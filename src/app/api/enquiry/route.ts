import { NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EnquiryPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  interest?: unknown;
  message?: unknown;
  consent?: unknown;
};

function asString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Enquiry intake.
 *
 * This demo has no CRM wired, so the payload is validated and accepted here;
 * the client then hands the same details to WhatsApp, which is how the sales
 * gallery actually talks to buyers. Point `destination` at a real sink to
 * persist server-side.
 */
export async function POST(request: Request) {
  let payload: EnquiryPayload;
  try {
    payload = (await request.json()) as EnquiryPayload;
  } catch {
    return NextResponse.json({ ok: false, errors: { form: "invalid" } }, { status: 400 });
  }

  const name = asString(payload.name, 120);
  const email = asString(payload.email, 200);
  const phone = asString(payload.phone, 60);
  const interest = asString(payload.interest, 80);
  const message = asString(payload.message, 2000);
  const consent = payload.consent === true;

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "required";
  if (!EMAIL.test(email)) errors.email = "invalid";
  if (phone.replace(/[^\d]/g, "").length < 7) errors.phone = "invalid";
  if (!consent) errors.consent = "required";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    received: { name, email, phone, interest, message },
  });
}
