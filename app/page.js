"use client";
import { useState } from "react";

export default function RechargePage() {
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: "Recharge Payment",
      order_id: order.id,
      handler: function (response) {
        alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
      },
      prefill: {
        email: "user@example.com",
        contact: "9999999999",
      },
      theme: { color: "#3399cc" },
    };

    const razor = new window.Razorpay(options);
    razor.open();
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Recharge Portal</h1>

      <input
        type="range"
        min="50"
        max="500"
        step="10"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-80 mb-4"
      />
      <p className="text-lg font-bold">₹{amount}</p>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md"
      >
        {loading ? "Processing..." : `Pay ₹${amount}`}
      </button>
    </div>
  );
}
