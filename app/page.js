"use client";

import { useState } from "react";
import { db, ref, get } from "./components/firebaseConfig";

export default function RechargePage() {
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [amount, setAmount] = useState(50);

  const handleCheckEnrollment = async () => {
    if (!enrollmentNumber) {
      setMessage("Please enter your enrollment number.");
      return;
    }

    try {
      const enrollmentRef = ref(db, `/enrollments/${enrollmentNumber}`);
      const enrollmentSnap = await get(enrollmentRef);

      if (!enrollmentSnap.exists()) {
        setMessage("Invalid Enrollment Number.");
        return;
      }

      const { cardID } = enrollmentSnap.val();

      const cardRef = ref(db, `/addedCards/${cardID}`);
      const cardSnap = await get(cardRef);

      if (!cardSnap.exists()) {
        setMessage("Card not found for this enrollment number.");
        return;
      }

      const user = cardSnap.val();

      if (user.status && user.status.toLowerCase() === "blocked") {
        setMessage("This account is currently blocked and cannot be recharged.");
        return;
      }

      setUserData({ ...user, enrollmentNumber }); // Attach enrollment for confirmation
      setStep(2);
      setMessage("");
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  const handlePaymentRedirect = () => {
    const upiID = "upi-id@bank";
    const payUrl = `upi://pay?pa=${upiID}&pn=Recharge&mc=&tid=&tr=&tn=Recharge Payment&am=${amount}&cu=INR`;
    window.location.href = payUrl;
  };

  const maxRecharge = userData ? Math.max(0, 500 - userData.cashAmount) : 500;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">Recharge Portal</h1>

      {step === 1 && (
        <div className="flex flex-col items-center">
          <input
            type="text"
            placeholder="Enter Enrollment Number"
            value={enrollmentNumber}
            onChange={(e) => setEnrollmentNumber(e.target.value)}
            className="p-3 border border-gray-400 rounded-md mb-3 text-black w-80 text-center"
          />
          <button
            onClick={handleCheckEnrollment}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg"
          >
            Check
          </button>
          {message && <p className="mt-3 text-red-400">{message}</p>}
        </div>
      )}

      {step === 2 && userData && (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl mb-4">
            Is your enrollment number <span className="font-bold">{userData.enrollmentNumber}</span>?
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md text-lg"
            >
              Yes
            </button>
            <button
              onClick={() => {
                setEnrollmentNumber("");
                setUserData(null);
                setStep(1);
              }}
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
            Is your name <span className="font-bold">{userData.name}</span>?
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(4)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md text-lg"
            >
              Yes
            </button>
            <button
              onClick={() => {
                setEnrollmentNumber("");
                setUserData(null);
                setStep(1);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md text-lg"
            >
              No
            </button>
          </div>
        </div>
      )}

      {step === 4 && userData && (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl mb-2">
            Current Balance: ₹{userData.cashAmount}
          </h2>
          <h3 className="text-lg mb-4">Select Amount to Recharge (Max ₹{maxRecharge}):</h3>

          <input
            type="range"
            min="10"
            max={maxRecharge}
            step="10"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-80 mb-4"
            disabled={maxRecharge === 0}
          />
          <p className="text-lg font-bold">₹{amount}</p>

          {maxRecharge > 0 ? (
            <button
              onClick={handlePaymentRedirect}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg"
            >
              Proceed to Pay ₹{amount}
            </button>
          ) : (
            <p className="mt-4 text-yellow-400">You have reached the ₹500 limit.</p>
          )}
        </div>
      )}
    </div>
  );
}
