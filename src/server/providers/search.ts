import { load } from "cheerio";
import sanitizeHtml from "sanitize-html";
import { inferDomainPack } from "@/features/debates/domain-packs";
import type {
  DebateSetupInput,
  ResearchQuery,
  SourceDocument,
  SourcePreferenceMode,
} from "@/features/debates/types";
import { getEnv, isTavilyConfigured } from "@/lib/env";

interface SearchResultCandidate {
  url: string;
  title: string;
  author?: string;
  organization?: string;
  publishedAt?: string;
  sourceType?: string;
  excerpt?: string;
  processedText?: string;
  metadata?: Record<string, unknown>;
}

interface SearchAdapter {
  id: string;
  enabled: boolean;
  search(query: ResearchQuery, setup: DebateSetupInput): Promise<SearchResultCandidate[]>;
}

const searchStopWords = new Set([
  "the",
  "and",
  "that",
  "with",
  "from",
  "what",
  "should",
  "would",
  "could",
  "this",
  "their",
  "about",
  "into",
  "your",
  "than",
  "have",
  "will",
  "best",
  "source",
  "sources",
  "future",
  "yes",
  "no",
  "ban",
  "allow",
  "default",
  "discretion",
  "outcomes",
  "trusted",
  "trust",
  "data",
  "evidence",
  "study",
  "report",
  "analysis",
  "united",
  "states",
]);

function stripTags(value?: string) {
  if (!value) return "";
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function inferSourceType(url: string, hintedType?: string) {
  if (hintedType) return hintedType;
  const domain = domainFromUrl(url);
  if (domain.endsWith(".gov")) return "government";
  if (domain.endsWith(".edu")) return "university";
  if (domain.includes("oecd") || domain.includes("un.org") || domain.includes("worldbank")) {
    return "international";
  }
  if (domain.endsWith(".org")) return "institutional";
  if (domain.endsWith(".com")) return "journalism";
  return "institutional";
}

function scoreFreshness(publishedAt?: string) {
  if (!publishedAt) return 0.45;
  const year = new Date(publishedAt).getFullYear();
  if (Number.isNaN(year)) return 0.45;
  const age = new Date().getFullYear() - year;
  if (age <= 2) return 1;
  if (age <= 5) return 0.84;
  if (age <= 8) return 0.7;
  if (age <= 12) return 0.55;
  return 0.35;
}

function scoreCredibility(sourceType: string, organization?: string, excerpt?: string) {
  const typeScores: Record<string, number> = {
    government: 0.96,
    academic: 0.93,
    university: 0.91,
    international: 0.92,
    institutional: 0.84,
    industry: 0.73,
    journalism: 0.66,
  };
  const base = typeScores[sourceType] ?? 0.6;
  const organizationBoost = organization ? 0.04 : -0.03;
  const directnessBoost = excerpt && excerpt.length > 180 ? 0.03 : -0.01;
  return Math.max(0.1, Math.min(1, base + organizationBoost + directnessBoost));
}

function toCredibilityLabel(score: number) {
  if (score >= 0.9) return "High trust" as const;
  if (score >= 0.78) return "Moderate trust" as const;
  if (score >= 0.62) return "Limited trust" as const;
  return "Use with caution" as const;
}

function sourceModeAllows(sourceType: string, mode: SourcePreferenceMode) {
  switch (mode) {
    case "academic_only":
      return ["academic", "university"].includes(sourceType);
    case "government_only":
      return sourceType === "government";
    case "institutional_only":
      return ["institutional", "international"].includes(sourceType);
    case "teacher_safe_only":
      return ["government", "academic", "university", "international", "institutional"].includes(sourceType);
    default:
      return true;
  }
}

function extractSearchKeywords(...values: Array<string | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    for (const token of value?.toLowerCase().match(/[a-z][a-z-]{2,}/g) ?? []) {
      if (searchStopWords.has(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token);
}

function countKeywordHits(text: string, keywords: string[]) {
  const tokens = new Set(text.match(/[a-z][a-z-]{2,}/g) ?? []);
  return keywords.filter((keyword) => tokens.has(keyword)).length;
}

export function scoreQueryRelevance(
  candidate: SearchResultCandidate,
  query: ResearchQuery,
  setup: DebateSetupInput,
) {
  const pack = inferDomainPack(setup.resolution, setup.mySide, setup.opponentSide);
  const topicKeywords = extractSearchKeywords(
    setup.resolution,
    setup.mySide,
    setup.opponentSide,
  );
  const domainKeywords = extractSearchKeywords(
    ...pack.keywords,
  );
  const criterionKeywords = extractSearchKeywords(
    ...query.criterionTags,
    query.purpose,
  );
  const candidateText = [
    candidate.title,
    candidate.organization,
    candidate.author,
    candidate.excerpt,
    candidate.processedText?.slice(0, 500),
    candidate.metadata ? JSON.stringify(candidate.metadata) : undefined,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const topicHits = countKeywordHits(candidateText, topicKeywords);
  const domainHits = countKeywordHits(candidateText, domainKeywords);
  const criterionHits = countKeywordHits(candidateText, criterionKeywords);
  const exactCriterionBonus = query.criterionTags.some((tag) =>
    candidateText.includes(tag.toLowerCase()),
  )
    ? 0.18
    : 0;
  const exactResolutionBonus = candidateText.includes(setup.resolution.toLowerCase()) ? 0.22 : 0;
  const score = Math.min(
    1,
    topicHits * 0.28 +
      domainHits * 0.12 +
      criterionHits * 0.18 +
      exactCriterionBonus +
      exactResolutionBonus,
  );

  return {
    score,
    debateHits: topicHits + domainHits,
    topicHits,
    domainHits,
    criterionHits,
  };
}

function buildNormalizedSource(
  candidate: SearchResultCandidate,
  query: ResearchQuery,
  setup: DebateSetupInput,
): SourceDocument | null {
  const sourceType = inferSourceType(candidate.url, candidate.sourceType);
  if (
    !sourceModeAllows(sourceType, setup.sourcePreferenceMode) ||
    !setup.allowedSourceTypes.includes(sourceType)
  ) {
    return null;
  }

  if (
    setup.sourceBlacklist.some((blocked) =>
      candidate.url.toLowerCase().includes(blocked.toLowerCase()),
    )
  ) {
    return null;
  }

  if (
    setup.sourceWhitelist.length > 0 &&
    !setup.sourceWhitelist.some((allowed) =>
      candidate.url.toLowerCase().includes(allowed.toLowerCase()),
    )
  ) {
    return null;
  }

  const excerpt = stripTags(candidate.excerpt || candidate.processedText);
  const relevance = scoreQueryRelevance(candidate, query, setup);
  if (
    relevance.score < 0.46 &&
    !(
      relevance.topicHits >= 1 ||
      (relevance.domainHits >= 1 && relevance.criterionHits >= 1)
    )
  ) {
    return null;
  }

  const freshnessScore = scoreFreshness(candidate.publishedAt);
  const credibilityScore = scoreCredibility(sourceType, candidate.organization, excerpt);
  const directnessScore = Math.min(
    1,
    0.22 +
      relevance.score * 0.6 +
      query.criterionTags.length * 0.05 +
      (excerpt.length > 180 ? 0.08 : 0),
  );

  return {
    id: crypto.randomUUID(),
    url: candidate.url,
    title: stripTags(candidate.title) || domainFromUrl(candidate.url),
    author: candidate.author,
    organization: candidate.organization ?? domainFromUrl(candidate.url),
    publishedAt: candidate.publishedAt,
    sourceType,
    credibilityScore,
    credibilityLabel: toCredibilityLabel(credibilityScore),
    directnessScore,
    freshnessScore,
    excerpt: excerpt || "No excerpt available from this source. Import directly to inspect the document.",
    processedText: stripTags(candidate.processedText),
    metadata: {
      ...(candidate.metadata ?? {}),
      providerQuery: query.query,
      purpose: query.purpose,
      relevanceScore: relevance.score,
    },
    queryId: query.id,
    sideIntent: query.side,
    criterionTags: query.criterionTags,
  };
}

function reconstructOpenAlexAbstract(value?: Record<string, number[]>) {
  if (!value) return "";
  const positions = Object.entries(value).flatMap(([word, indexes]) =>
    indexes.map((position) => ({ word, position })),
  );
  return positions
    .sort((a, b) => a.position - b.position)
    .map((item) => item.word)
    .join(" ");
}

function createOpenAlexAdapter(): SearchAdapter {
  return {
    id: "openalex",
    enabled: true,
    async search(query) {
      const url = new URL("https://api.openalex.org/works");
      url.searchParams.set("search", query.query);
      url.searchParams.set("per-page", "6");
      url.searchParams.set(
        "select",
        "id,display_name,primary_location,publication_year,authorships,abstract_inverted_index,type",
      );
      const response = await fetch(url, {
        headers: { "User-Agent": "Cogent/1.0" },
        next: { revalidate: 3600 },
      });
      if (!response.ok) return [];
      const payload = (await response.json()) as {
        results?: Array<{
          id: string;
          display_name: string;
          publication_year?: number;
          primary_location?: {
            landing_page_url?: string;
            source?: { host_organization_name?: string };
          };
          authorships?: Array<{
            author?: { display_name?: string };
            institutions?: Array<{ display_name?: string }>;
          }>;
          abstract_inverted_index?: Record<string, number[]>;
          type?: string;
        }>;
      };
      return (payload.results ?? [])
        .filter((item) => item.primary_location?.landing_page_url)
        .map((item) => ({
          url: item.primary_location?.landing_page_url ?? item.id,
          title: item.display_name,
          author: item.authorships?.[0]?.author?.display_name,
          organization:
            item.primary_location?.source?.host_organization_name ??
            item.authorships?.[0]?.institutions?.[0]?.display_name ??
            "OpenAlex source",
          publishedAt: item.publication_year ? `${item.publication_year}-01-01` : undefined,
          sourceType: item.type === "journal-article" ? "academic" : "institutional",
          excerpt: reconstructOpenAlexAbstract(item.abstract_inverted_index),
          metadata: { provider: "openalex", openAlexId: item.id },
        }));
    },
  };
}

function createCrossrefAdapter(): SearchAdapter {
  return {
    id: "crossref",
    enabled: true,
    async search(query) {
      const url = new URL("https://api.crossref.org/works");
      url.searchParams.set("query", query.query);
      url.searchParams.set("rows", "5");
      const response = await fetch(url, {
        headers: { "User-Agent": "Cogent/1.0" },
        next: { revalidate: 3600 },
      });
      if (!response.ok) return [];
      const payload = (await response.json()) as {
        message?: {
          items?: Array<{
            DOI?: string;
            URL?: string;
            title?: string[];
            author?: Array<{ family?: string; given?: string }>;
            publisher?: string;
            abstract?: string;
            published?: { "date-parts"?: number[][] };
            type?: string;
          }>;
        };
      };
      return (payload.message?.items ?? [])
        .filter((item) => item.URL)
        .map((item) => ({
          url: item.URL!,
          title: item.title?.[0] ?? item.DOI ?? "Crossref result",
          author: item.author?.[0]
            ? `${item.author[0].given ?? ""} ${item.author[0].family ?? ""}`.trim()
            : undefined,
          organization: item.publisher ?? "Crossref source",
          publishedAt: item.published?.["date-parts"]?.[0]
            ? `${item.published["date-parts"][0][0]}-01-01`
            : undefined,
          sourceType: item.type?.includes("journal") ? "academic" : "institutional",
          excerpt: stripTags(item.abstract),
          metadata: { provider: "crossref", doi: item.DOI },
        }));
    },
  };
}

function createTavilyAdapter(): SearchAdapter {
  return {
    id: "tavily",
    enabled: isTavilyConfigured(),
    async search(query, setup) {
      if (!isTavilyConfigured()) return [];
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: getEnv().TAVILY_API_KEY,
          query: query.query,
          search_depth: "advanced",
          max_results: 6,
          include_answer: false,
          include_images: false,
          include_raw_content: true,
          include_domains: setup.sourceWhitelist.length > 0 ? setup.sourceWhitelist : undefined,
          exclude_domains: setup.sourceBlacklist.length > 0 ? setup.sourceBlacklist : undefined,
        }),
      });
      if (!response.ok) return [];
      const payload = (await response.json()) as {
        results?: Array<{
          url: string;
          title: string;
          content?: string;
          raw_content?: string;
          published_date?: string;
        }>;
      };
      return (payload.results ?? []).map((item) => ({
        url: item.url,
        title: item.title,
        organization: domainFromUrl(item.url),
        publishedAt: item.published_date,
        excerpt: item.content,
        processedText: item.raw_content,
        metadata: { provider: "tavily" },
      }));
    },
  };
}

export async function discoverSources(
  queries: ResearchQuery[],
  setup: DebateSetupInput,
) {
  if (process.env.DISABLE_NETWORK_RETRIEVAL === "1") {
    return [];
  }

  const adapters = [createTavilyAdapter(), createOpenAlexAdapter(), createCrossrefAdapter()];
  const results = await Promise.allSettled(
    queries.slice(0, 8).flatMap((query) =>
      adapters
        .filter((adapter) => adapter.enabled)
        .map(async (adapter) => {
          const items = await adapter.search(query, setup);
          return items
            .map((item) => buildNormalizedSource(item, query, setup))
            .filter(Boolean) as SourceDocument[];
        }),
    ),
  );

  const deduped = new Map<string, SourceDocument>();
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const source of result.value.flat()) {
      const key = `${source.url}::${source.title.toLowerCase()}`;
      const existing = deduped.get(key);
      if (!existing || existing.credibilityScore < source.credibilityScore) {
        deduped.set(key, source);
      }
    }
  }

  const ranked = [...deduped.values()].sort((a, b) => {
    const aRelevance = Number(a.metadata.relevanceScore ?? 0);
    const bRelevance = Number(b.metadata.relevanceScore ?? 0);
    return (
      bRelevance * 2 + b.credibilityScore + b.directnessScore + b.freshnessScore -
      (aRelevance * 2 + a.credibilityScore + a.directnessScore + a.freshnessScore)
    );
  });

  const strongMatches = ranked.filter(
    (source) => Number(source.metadata.relevanceScore ?? 0) >= 0.5,
  );
  const fallbackMatches = ranked.filter(
    (source) => Number(source.metadata.relevanceScore ?? 0) >= 0.4,
  );

  const selected =
    strongMatches.length >= 6
      ? strongMatches
      : fallbackMatches.length >= 6
        ? fallbackMatches
        : ranked;

  return selected.slice(0, 12);
}

export async function fetchDocumentText(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Cogent/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Could not import document from ${url}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    const html = await response.text();
    const $ = load(html);
    const paragraphs = $("main p, article p, p")
      .slice(0, 20)
      .toArray()
      .map((element) => $(element).text().trim())
      .filter(Boolean);
    return paragraphs.join(" ");
  }

  return response.text();
}
