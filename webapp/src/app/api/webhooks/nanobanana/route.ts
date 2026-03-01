import { NextRequest, NextResponse } from "next/server";

/**
 * NanoBanana callback URL endpoint. The API requires a callBackUrl; we poll
 * record-info for results, so this handler just acknowledges receipt (200).
 */
export async function POST(request: NextRequest) {
  try {
    await request.json(); // consume body if any
  } catch {
    // ignore parse errors
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
