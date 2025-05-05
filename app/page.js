"use client";

import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "./components/firebaseConfig";
import { authenticator } from "otplib";
import { useRouter } from "next/navigation";

const BlockPage = () => {
  const router = useRouter();
  const [enroll, setEnroll] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cardInfo, setCardInfo] = useState(null);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(0);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  const resetAll = () => {
    setStep(1);
    setEnroll("");
    setNameInput("");
    setCardInfo(null);
    setAmount(0);
    setOtpCode("");
    setError("");
    setSuccessMsg("");
    setButtonsDisabled(false);
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
    if (
      nameInput.trim().toLowerCase() !== cardInfo.name.trim().toLowerCase()
    ) {
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
    if (cardInfo.status === "Blocked") {
      return setError("Cannot recharge a blocked card.");
    }

    const rechargeAmount = Number(amount);
    const currentAmount = cardInfo.cashAmount || 0;
    const newAmount = currentAmount + rechargeAmount;

    if (newAmount > 500) {
      return setError(
        `Cannot exceed ₹500. You can only add ₹${500 - currentAmount}`
      );
    }

    set(ref(db, `/addedCards/${cardInfo.cardID}/cashAmount`), newAmount);
    setSuccessMsg(
      `Recharged successfully! New balance: ₹${newAmount}. Logging out in 10 seconds...`
    );
    setButtonsDisabled(true);

    // Redirect to UPI
    const upiLink = `upi://pay?pa=9643959117@pthdfc&pn=SmartCard&am=${rechargeAmount}&cu=INR&tn=${enroll}`;
    setTimeout(() => {
      window.location.href = upiLink;
    }, 1000);

    // Logout after 10 seconds
    setTimeout(() => {
      resetAll();
      router.refresh(); 
    }, 10000);
  };

  const handleToggleStatus = () => {
    setError("");
    onValue(
      ref(db, `/totpSecrets/${cardInfo.cardID}/secret`),
      (snapshot) => {
        const secret = snapshot.val();
        if (!secret) return setError("Authenticator setup not found for this card");
        const isValid = authenticator.check(otpCode, secret);
        if (!isValid) return setError("Invalid OTP code");

        const newStatus = cardInfo.status === "Blocked" ? "Active" : "Blocked";
        set(ref(db, `/addedCards/${cardInfo.cardID}/status`), newStatus);
        setCardInfo((prev) => ({ ...prev, status: newStatus }));
        setSuccessMsg(`Card is now ${newStatus}`);
      },
      { onlyOnce: true }
    );
  };

  const maxRecharge = 500 - (cardInfo?.cashAmount || 0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-gray-950 text-white p-4">
      <div className="w-full max-w-xl bg-zinc-800 rounded-2xl shadow-2xl p-8 space-y-6 border border-zinc-600">
        <h1 className="text-3xl font-bold text-center text-white">
          💳 Jaypee Card Recharge & Control
        </h1>

        {error && (
          <div className="bg-red-500 text-white text-sm px-4 py-2 rounded-md">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-600 text-white text-sm px-4 py-2 rounded-md">
            {successMsg}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">Enrollment Number</label>
            <input
              type="text"
              value={enroll}
              onChange={(e) => setEnroll(e.target.value)}
              placeholder="e.g., 12345678"
              className="w-full p-3 rounded-md bg-zinc-700 text-white border border-zinc-600"
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
              className="w-full p-3 rounded-md bg-zinc-700 text-white border border-zinc-600"
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
              <p className="text-sm text-gray-300">
                Status:{" "}
                <span
                  className={`font-bold ${
                    cardInfo.status === "Blocked" ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {cardInfo.status}
                </span>
              </p>
              <p className="text-md font-medium text-lime-400">
                Balance: ₹{cardInfo.cashAmount}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-zinc-700 rounded-xl p-4 border border-zinc-600 space-y-3">
                <h3 className="text-lg font-semibold">💸 Recharge Card</h3>
                <input
                  type="range"
                  min="0"
                  max={maxRecharge}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full"
                  disabled={buttonsDisabled || cardInfo.status === "Blocked"}
                  step={5}
                />
                <div className="text-sm text-gray-300">
                  Amount: <span className="font-semibold">₹{amount}</span>
                </div>
                <button
                  onClick={handleRecharge}
                  disabled={buttonsDisabled || cardInfo.status === "Blocked" || amount <= 0}
                  className={`w-full ${
                    buttonsDisabled || cardInfo.status === "Blocked" || amount <= 0
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } transition font-semibold py-2 rounded-md`}
                >
                  Proceed to Recharge
                </button>
              </div>

              <div className="bg-zinc-700 rounded-xl p-4 border border-zinc-600 space-y-3">
                <h3 className="text-lg font-semibold">
                  {cardInfo.status === "Blocked" ? "🔓 Unblock Card" : "🚫 Block Card"}
                </h3>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full p-2 rounded-md bg-zinc-600 text-white border border-zinc-500"
                />
                <button
                  onClick={handleToggleStatus}
                  className="w-full bg-red-600 hover:bg-red-700 transition font-semibold py-2 rounded-md"
                >
                  {cardInfo.status === "Blocked" ? "Unblock Card" : "Block Card"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockPage;
