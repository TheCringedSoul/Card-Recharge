import { NextResponse } from "next/server";
import crypto from "crypto";
import { db, ref, set } from "./components/firebaseConfig";

export async function POST(req) {
  const bodyText = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(bodyText)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json(
      { success: false, message: "Invalid signature" },
      { status: 400 }
    );
  }

  const event = JSON.parse(bodyText);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const { id: paymentId, order_id, amount } = payment;

    const transactionRef = ref(db, `/transactions/${paymentId}`);
    await set(transactionRef, {
      rechargeNumber: order_id,
      paymentId,
      amount: amount / 100,
      capturedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true });
}
