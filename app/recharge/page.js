"use client";

import { useState } from "react";
import { db, ref, get } from "../components/firebaseConfig"; // Adjust the import path if needed

export default function RechargePage() {
  const [rechargeNumber, setRechargeNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleCheckRecharge = async () => {
    if (!rechargeNumber) {
      setMessage("Please enter a recharge number.");
      return;
    }

    try {
      // Check if Recharge Number exists in Firebase
      const rechargeRef = ref(db, `/recharge/${rechargeNumber}`);
      const rechargeSnapshot = await get(rechargeRef);

      if (!rechargeSnapshot.exists()) {
        setMessage("Invalid Recharge Number.");
        return;
      }

      const cardID = rechargeSnapshot.val().cardID;

      // Fetch Name from `addedCards`
      const cardRef = ref(db, `/addedCards/${cardID}`);
      const cardSnapshot = await get(cardRef);

      if (!cardSnapshot.exists()) {
        setMessage("Card ID not found.");
        return;
      }

      const name = cardSnapshot.val().name;
      setMessage(`Hello, ${name}!`);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Check Recharge</h1>
      <input
        type="text"
        placeholder="Enter Recharge Number"
        value={rechargeNumber}
        onChange={(e) => setRechargeNumber(e.target.value)}
        className="p-2 border border-gray-300 rounded mb-2 w-80"
      />
      <button
        onClick={handleCheckRecharge}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Check
      </button>

      {message && <h2 className="text-xl mt-4">{message}</h2>}
    </div>
  );
}
