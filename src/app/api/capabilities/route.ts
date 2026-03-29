import { NextResponse } from "next/server";
import { getCapabilitySnapshot } from "@/server/capabilities/service";

export async function GET() {
  return NextResponse.json(await getCapabilitySnapshot());
}
