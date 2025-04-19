"use client";

import { useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "./components/firebaseConfig";
import { authenticator } from "otplib";

const BlockPage = () => {
  const [enroll, setEnroll] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cardInfo, setCardInfo] = useState(null);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(0);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resetAll = () => {
    setStep(1);
    setEnroll("");
    setNameInput("");
    setCardInfo(null);
    setAmount(0);
    setOtpCode("");
    setError("");
    setSuccessMsg("");
  };

  const handleFetch = () => {
    setError("");
    if (!enroll) return setError("Please enter enrollment number");
    onValue(
      ref(db, `/enrollments/${enroll}`),
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCardInfo({ ...data });
          setStep(2);
        } else {
          setError("Enrollment not found");
        }
      },
      { onlyOnce: true }
    );
  };

  const confirmName = () => {
    setError("");
    if (nameInput.trim().toLowerCase() !== cardInfo.name.trim().toLowerCase()) {
      return setError("Name does not match");
    }
    onValue(
      ref(db, `/addedCards/${cardInfo.cardID}`),
      (snapshot) => {
        const full = snapshot.val();
        if (full) {
          setCardInfo((prev) => ({ ...prev, ...full }));
          setStep(3);
        } else {
          setError("Card data not found");
        }
      },
      { onlyOnce: true }
    );
  };

  const handleRecharge = () => {
    setError("");
    const rechargeAmount = Number(amount);
    const currentAmount = cardInfo.cashAmount || 0;
    const newAmount = currentAmount + rechargeAmount;

    if (newAmount > 500) {
      return setError(`Cannot exceed ₹500. You can only add ₹${500 - currentAmount}`);
    }

    // Update balance in Firebase
    set(ref(db, `/addedCards/${cardInfo.cardID}/cashAmount`), newAmount);
    setSuccessMsg(`Recharged successfully! New balance: ₹${newAmount}`);

    // Redirect to UPI link with pre-filled data
    const upiURL = `upi://pay?pa=merchant@upi&pn=SmartCard&am=${rechargeAmount}&cu=INR&tn=Recharge for ${enroll}`;
    window.location.href = upiURL;
  };

  const handleBlock = () => {
    setError("");
    onValue(
      ref(db, `/totpSecrets/${cardInfo.cardID}/secret`),
      (snapshot) => {
        const secret = snapshot.val();
        if (!secret) return setError("Authenticator setup not found for this card");
        const isValid = authenticator.check(otpCode, secret);
        if (!isValid) return setError("Invalid OTP code");

        set(ref(db, `/addedCards/${cardInfo.cardID}/status`), "Blocked");
        setSuccessMsg("Card successfully blocked!");
      },
      { onlyOnce: true }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4">
      <div className="w-full max-w-xl bg-slate-950 rounded-2xl shadow-2xl p-8 space-y-6 border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-4 text-white">🛡️ Card Control Panel</h1>

        {error && (
          <div className="bg-red-500 text-white text-sm px-4 py-2 rounded-md">{error}</div>
        )}
        {successMsg && (
          <div className="bg-green-600 text-white text-sm px-4 py-2 rounded-md">{successMsg}</div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">Enrollment Number</label>
            <input
              type="text"
              value={enroll}
              onChange={(e) => setEnroll(e.target.value)}
              placeholder="e.g., 12345678"
              className="w-full p-3 rounded-md bg-slate-800 text-white border border-slate-600 focus:outline-none focus:ring focus:ring-blue-500"
            />
            <button
              onClick={handleFetch}
              className="w-full bg-blue-600 hover:bg-blue-700 transition font-semibold py-3 rounded-md"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">Confirm Your Name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.toLowerCase())}
              placeholder="Enter your full name"
              className="w-full p-3 rounded-md bg-slate-800 text-white border border-slate-600 focus:outline-none focus:ring focus:ring-blue-500"
            />
            <button
              onClick={confirmName}
              className="w-full bg-blue-600 hover:bg-blue-700 transition font-semibold py-3 rounded-md"
            >
              Confirm Name
            </button>
          </div>
        )}

        {step === 3 && cardInfo && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-semibold">Welcome, {cardInfo.name}</h2>
              <p className="text-sm text-slate-300">Card ID: {cardInfo.cardID}</p>
              <p className="text-sm text-slate-300">Status: {cardInfo.status}</p>
              <p className="text-md font-medium text-green-400">Balance: ₹{cardInfo.cashAmount}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
                <h3 className="text-lg font-semibold">💸 Recharge Card</h3>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder={`Max ₹${500 - (cardInfo.cashAmount || 0)}`}
                  className="w-full p-2 rounded-md bg-slate-700 text-white border border-slate-600"
                />
                <button
                  onClick={handleRecharge}
                  className="w-full bg-green-600 hover:bg-green-700 transition font-semibold py-2 rounded-md"
                >
                  Proceed to Recharge
                </button>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
                <h3 className="text-lg font-semibold">🚫 Block Card</h3>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full p-2 rounded-md bg-slate-700 text-white border border-slate-600"
                />
                <button
                  onClick={handleBlock}
                  className="w-full bg-red-600 hover:bg-red-700 transition font-semibold py-2 rounded-md"
                >
                  Block Card
                </button>
              </div>
            </div>

            <button
              onClick={resetAll}
              className="w-full bg-slate-600 hover:bg-slate-700 mt-4 py-2 rounded-md"
            >
              🔄 Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockPage;
