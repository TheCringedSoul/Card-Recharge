import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req) {
  const { amount, rechargeNumber } = await req.json();

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paisa
      currency: "INR",
      receipt: rechargeNumber,
      payment_capture: 1, // Auto capture
    });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
