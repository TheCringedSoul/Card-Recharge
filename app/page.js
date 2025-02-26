"use client";

import { useState } from "react";
import { db } from "./components/firebaseConfig";
import { ref, get, update } from "firebase/database";

export default function RechargePage() {
  const [rechargeNumber, setRechargeNumber] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [amount, setAmount] = useState(50);

  // 🔍 Check Recharge Number in Firebase
  const handleCheckRecharge = async () => {
    if (!rechargeNumber) {
      setMessage("Please enter a recharge number.");
      return;
    }

    try {
      const rechargeRef = ref(db, `/recharge/${rechargeNumber}`);
      const rechargeSnapshot = await get(rechargeRef);

      if (!rechargeSnapshot.exists()) {
        setMessage("Invalid Recharge Number.");
        return;
      }

      const cardID = rechargeSnapshot.val().cardID;
      const cardRef = ref(db, `/addedCards/${cardID}`);
      const cardSnapshot = await get(cardRef);

      if (!cardSnapshot.exists()) {
        setMessage("Card ID not found.");
        return;
      }

      setUserData({ ...cardSnapshot.val(), cardID });
      setStep(2); // Move to next step
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  // 🔄 Redirect to UPI Payment
  const handlePaymentRedirect = () => {
    const upiID = "9643959117@pthdfc"; // Replace with your actual UPI ID
    const payUrl = `upi://pay?pa=${upiID}&pn=Recharge&am=${amount}&cu=INR`;

    // Open UPI app
    window.open(payUrl, "_blank");
  };

  // ✅ Update Firebase After Payment
  const handlePaymentSuccess = async () => {
    try {
      const userRef = ref(db, `/addedCards/${userData.cardID}`);
      await update(userRef, { cashAmount: userData.cashAmount + Number(amount) });

      setMessage(`Recharge Successful! New Balance: ₹${userData.cashAmount + Number(amount)}`);
      setStep(1);
      setRechargeNumber("");
    } catch (error) {
      console.error("Error updating balance:", error);
      setMessage("Failed to update balance. Please contact support.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">Recharge Portal</h1>

      {step === 1 && (
        <div className="flex flex-col items-center">
          <input
            type="text"
            placeholder="Enter Recharge Number"
            value={rechargeNumber}
            onChange={(e) => setRechargeNumber(e.target.value)}
            className="p-3 border border-gray-400 rounded-md mb-3 text-black w-80 text-center"
          />
          <button
            onClick={handleCheckRecharge}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg"
          >
            Check
          </button>
          {message && <p className="mt-3 text-red-400">{message}</p>}
        </div>
      )}

      {step === 2 && userData && (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl mb-4">Are you <span className="font-bold">{userData.name}</span>?</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md text-lg"
            >
              Yes
            </button>
            <button
              onClick={() => setStep(1)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md text-lg"
            >
              No
            </button>
          </div>
        </div>
      )}

      {step === 3 && userData && (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl mb-4">
            Your Enrollment Number is <span className="font-bold">{userData.enrollmentNumber}</span>, right?
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(4)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md text-lg"
            >
              Yes
            </button>
            <button
              onClick={() => setStep(1)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md text-lg"
            >
              No
            </button>
          </div>
        </div>
      )}

      {step === 4 && userData && (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl mb-2">Your Current Balance: ₹{userData.cashAmount}</h2>
          <h3 className="text-lg mb-4">Select Amount to Recharge:</h3>
          
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
            onClick={handlePaymentRedirect}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg"
          >
            Proceed to Pay ₹{amount}
          </button>

          <button
            onClick={handlePaymentSuccess}
            className="mt-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md text-lg"
          >
            Payment Successful (Simulated)
          </button>
        </div>
      )}
    </div>
  );
}
