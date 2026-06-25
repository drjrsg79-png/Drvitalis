import { NextRequest, NextResponse } from "next/server";
import { checkSubscriptionStatus, normalizeEmail } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json(
        { isPro: false, status: "missing_email", plan: "free", renewalDate: null },
        { status: 400 }
      );
    }

    const subscription = await checkSubscriptionStatus(normalizedEmail);
    return NextResponse.json(subscription);
  } catch {
    return NextResponse.json(
      { isPro: false, status: "error", plan: "free", renewalDate: null },
      { status: 500 }
    );
  }
}
