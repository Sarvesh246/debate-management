import type { DebateCriterion, FavorableTo } from "@/features/debates/types";

export interface DomainPack {
  id:
    | "energy"
    | "environment"
    | "public_policy"
    | "education"
    | "healthcare"
    | "technology"
    | "business_economics"
    | "ethics_social_issues";
  label: string;
  keywords: string[];
  criteria: Array<{
    name: string;
    description: string;
    importance: number;
  }>;
  recommendedSourceTypes: string[];
  trustedOrganizations: string[];
  commonOpponentStrategies: string[];
  framingMistakes: string[];
  sideKeywordProfiles: Record<
    string,
    {
      strengths: string[];
      weaknesses: string[];
    }
  >;
}

export const domainPacks: DomainPack[] = [
  {
    id: "energy",
    label: "Energy",
    keywords: ["energy", "power", "electricity", "grid", "fuel", "nuclear", "solar", "wind", "gas"],
    criteria: [
      { name: "Affordability", description: "Total cost and price stability.", importance: 0.94 },
      { name: "Reliability", description: "Ability to deliver power consistently.", importance: 0.98 },
      { name: "Scalability", description: "How well the source can expand at national scale.", importance: 0.92 },
      { name: "Emissions", description: "Climate and pollution impact.", importance: 0.9 },
      { name: "Safety", description: "Operational and public-health risks.", importance: 0.88 },
      { name: "Infrastructure readiness", description: "How much existing infrastructure supports rollout.", importance: 0.86 },
      { name: "Deployment speed", description: "How quickly the source can solve near-term needs.", importance: 0.84 },
      { name: "Waste and externalities", description: "Long-tail harms and cleanup burden.", importance: 0.82 },
    ],
    recommendedSourceTypes: ["government", "international", "academic", "industry"],
    trustedOrganizations: ["EIA", "IEA", "DOE", "IPCC", "NREL"],
    commonOpponentStrategies: [
      "Reframe around emissions and long-run sustainability.",
      "Attack hidden infrastructure costs.",
      "Argue safety or waste turns public opinion against the source.",
    ],
    framingMistakes: [
      "Treating cost alone as decisive without reliability.",
      "Ignoring deployment speed in near-term energy debates.",
      "Overclaiming emissions or safety perfection.",
    ],
    sideKeywordProfiles: {
      "natural gas": {
        strengths: ["Affordability", "Reliability", "Infrastructure readiness", "Deployment speed"],
        weaknesses: ["Emissions", "Waste and externalities"],
      },
      nuclear: {
        strengths: ["Reliability", "Emissions", "Scalability"],
        weaknesses: ["Safety", "Deployment speed", "Waste and externalities"],
      },
      solar: {
        strengths: ["Emissions", "Deployment speed", "Safety"],
        weaknesses: ["Reliability", "Land use"],
      },
      wind: {
        strengths: ["Emissions", "Scalability"],
        weaknesses: ["Reliability", "Land use"],
      },
    },
  },
  {
    id: "environment",
    label: "Environment",
    keywords: ["climate", "environment", "pollution", "conservation", "emissions", "sustainability"],
    criteria: [
      { name: "Environmental impact", description: "Net ecological harm or protection.", importance: 0.98 },
      { name: "Feasibility", description: "Can the policy or action realistically be implemented?", importance: 0.91 },
      { name: "Cost-effectiveness", description: "Whether benefits justify resource use.", importance: 0.87 },
      { name: "Equity", description: "Distribution of burdens and benefits.", importance: 0.84 },
      { name: "Urgency", description: "How well the proposal responds to time pressure.", importance: 0.88 },
    ],
    recommendedSourceTypes: ["government", "academic", "international"],
    trustedOrganizations: ["EPA", "UNEP", "IPCC", "NOAA", "World Bank"],
    commonOpponentStrategies: [
      "Argue implementation is too expensive.",
      "Question whether the proposal scales fast enough.",
      "Push tradeoffs onto jobs or development.",
    ],
    framingMistakes: [
      "Ignoring transition costs.",
      "Assuming every green outcome is automatically feasible.",
    ],
    sideKeywordProfiles: {},
  },
  {
    id: "public_policy",
    label: "Public Policy",
    keywords: ["policy", "government", "law", "regulation", "state", "federal", "public"],
    criteria: [
      { name: "Effectiveness", description: "Does the policy achieve its stated goal?", importance: 0.96 },
      { name: "Enforceability", description: "Can institutions administer and enforce it?", importance: 0.88 },
      { name: "Cost", description: "Fiscal and administrative burden.", importance: 0.86 },
      { name: "Rights and fairness", description: "Civil liberties and equitable outcomes.", importance: 0.9 },
      { name: "Political durability", description: "Will the policy survive real-world politics?", importance: 0.79 },
    ],
    recommendedSourceTypes: ["government", "institutional", "academic"],
    trustedOrganizations: ["GAO", "CBO", "Brookings", "RAND", "OECD"],
    commonOpponentStrategies: ["Claim the policy backfires or is unenforceable.", "Shift the round to liberty harms."],
    framingMistakes: ["Ignoring implementation mechanics.", "Treating intention as proof of results."],
    sideKeywordProfiles: {},
  },
  {
    id: "education",
    label: "Education",
    keywords: ["education", "school", "teacher", "student", "curriculum", "classroom"],
    criteria: [
      { name: "Learning outcomes", description: "Impact on student performance and retention.", importance: 0.97 },
      { name: "Equity", description: "Whether the approach helps or harms disadvantaged students.", importance: 0.92 },
      { name: "Practicality", description: "Teacher workload and implementation fit.", importance: 0.89 },
      { name: "Cost", description: "Budget impact and sustainability.", importance: 0.82 },
      { name: "Student well-being", description: "Stress, motivation, and development effects.", importance: 0.87 },
    ],
    recommendedSourceTypes: ["academic", "government", "university"],
    trustedOrganizations: ["IES", "UNESCO", "OECD", "Education Week"],
    commonOpponentStrategies: ["Argue the idea sounds good but fails in classrooms.", "Emphasize teacher workload."],
    framingMistakes: ["Using isolated anecdotes as proof.", "Ignoring diverse classroom contexts."],
    sideKeywordProfiles: {},
  },
  {
    id: "healthcare",
    label: "Healthcare",
    keywords: ["health", "medical", "hospital", "insurance", "patient", "care"],
    criteria: [
      { name: "Patient outcomes", description: "Does the proposal improve health and safety?", importance: 0.98 },
      { name: "Access", description: "Can people actually obtain the care?", importance: 0.93 },
      { name: "Cost", description: "Individual and system affordability.", importance: 0.9 },
      { name: "Provider capacity", description: "Effects on staffing and delivery.", importance: 0.84 },
      { name: "Long-term sustainability", description: "Can the system maintain the change?", importance: 0.85 },
    ],
    recommendedSourceTypes: ["government", "academic", "institutional"],
    trustedOrganizations: ["CDC", "WHO", "NIH", "KFF", "Lancet"],
    commonOpponentStrategies: ["Attack cost and implementation burden.", "Question effect size and tradeoffs."],
    framingMistakes: ["Overclaiming universal outcome gains.", "Ignoring provider capacity."],
    sideKeywordProfiles: {},
  },
  {
    id: "technology",
    label: "Technology",
    keywords: ["technology", "ai", "algorithm", "software", "internet", "data", "automation"],
    criteria: [
      { name: "Performance", description: "Actual capability and reliability.", importance: 0.93 },
      { name: "Safety and risk", description: "Misuse, privacy, and systemic harms.", importance: 0.95 },
      { name: "Adoption readiness", description: "Can users and institutions deploy it now?", importance: 0.86 },
      { name: "Scalability", description: "Will it keep working at larger scale?", importance: 0.89 },
      { name: "Governance", description: "Can it be monitored and regulated?", importance: 0.84 },
    ],
    recommendedSourceTypes: ["academic", "government", "institutional", "industry"],
    trustedOrganizations: ["NIST", "OECD", "Stanford HAI", "MIT", "Nature"],
    commonOpponentStrategies: ["Shift to risk and governance.", "Question readiness and reliability."],
    framingMistakes: ["Confusing novelty with usefulness.", "Ignoring externalities or bias."],
    sideKeywordProfiles: {},
  },
  {
    id: "business_economics",
    label: "Business and Economics",
    keywords: ["economy", "business", "market", "trade", "inflation", "jobs", "tax"],
    criteria: [
      { name: "Growth", description: "Impact on output, productivity, or innovation.", importance: 0.91 },
      { name: "Stability", description: "Volatility, resilience, and risk exposure.", importance: 0.89 },
      { name: "Distribution", description: "Who wins and loses economically.", importance: 0.85 },
      { name: "Feasibility", description: "Implementation and market realism.", importance: 0.84 },
      { name: "Competitiveness", description: "Positioning relative to other firms or countries.", importance: 0.82 },
    ],
    recommendedSourceTypes: ["government", "institutional", "academic", "industry"],
    trustedOrganizations: ["IMF", "World Bank", "Federal Reserve", "OECD", "NBER"],
    commonOpponentStrategies: ["Attack hidden costs and regressivity.", "Argue the market adapts better without intervention."],
    framingMistakes: ["Using GDP as the only metric.", "Ignoring transition losers."],
    sideKeywordProfiles: {},
  },
  {
    id: "ethics_social_issues",
    label: "Ethics and Social Issues",
    keywords: ["ethics", "moral", "social", "rights", "justice", "equity", "freedom"],
    criteria: [
      { name: "Rights", description: "Core liberties and protections.", importance: 0.96 },
      { name: "Harm reduction", description: "Which side prevents the worst outcomes.", importance: 0.93 },
      { name: "Fairness", description: "Consistency and equal treatment.", importance: 0.9 },
      { name: "Practical impact", description: "Real-world consequences, not only ideals.", importance: 0.85 },
      { name: "Social cohesion", description: "How the proposal affects legitimacy and trust.", importance: 0.8 },
    ],
    recommendedSourceTypes: ["academic", "institutional", "government"],
    trustedOrganizations: ["Pew Research", "UN Human Rights", "ACLU", "APA"],
    commonOpponentStrategies: ["Shift from principle to consequences or vice versa.", "Attack inconsistency in standards."],
    framingMistakes: ["Using moral language without a clear standard.", "Ignoring practical consequences."],
    sideKeywordProfiles: {},
  },
];

const genericPack = domainPacks[2];

export function inferDomainPack(
  resolution: string,
  mySide: string,
  opponentSide: string,
) {
  const text = `${resolution} ${mySide} ${opponentSide}`.toLowerCase();

  return (
    domainPacks.find((pack) =>
      pack.keywords.some((keyword) => text.includes(keyword)),
    ) ?? genericPack
  );
}

export function createPackCriteria(
  pack: DomainPack,
  favorabilityResolver: (criterion: string) => FavorableTo,
): DebateCriterion[] {
  return pack.criteria.map((criterion, index) => ({
    id: `${pack.id}-criterion-${index + 1}`,
    name: criterion.name,
    description: criterion.description,
    favorableTo: favorabilityResolver(criterion.name),
    importanceScore: criterion.importance,
    explanation: `${criterion.name} is central in ${pack.label.toLowerCase()} debates because ${criterion.description.toLowerCase()}`,
  }));
}
