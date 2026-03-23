import { useState, useEffect } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, keccak256, stringToHex } from "viem";
import { Shield, CheckCircle, Clock, AlertCircle, ExternalLink, Zap } from "lucide-react";

const CONTRACT_ADDRESS = "0xF2436d6E98EbD303965C3Ef595C3a01B2561a6A4";
const TOKEN_ADDRESS = "0x405A5bAF6a66319de62ab6A86058dB4829F7487e";

const IACP_ABI = [
  { name: "fund", type: "function", inputs: [{ name: "j", type: "uint256" }, { name: "e", type: "uint256" }, { name: "o", type: "bytes" }], outputs: [] },
  { name: "jobs", type: "function", inputs: [{ name: "j", type: "uint256" }], outputs: [{ name: "client", type: "address" }, { name: "provider", type: "address" }, { name: "evaluator", type: "address" }, { name: "budget", type: "uint256" }, { name: "expiredAt", type: "uint256" }, { name: "deliverable", type: "bytes32" }, { name: "status", type: "uint8" }, { name: "description", type: "string" }, { name: "hook", type: "address" }] }
] as const;

const ERC20_ABI = [
  { name: "approve", type: "function", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "allowance", type: "function", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ name: "", type: "uint256" }] }
] as const;

function App() {
  const { address, isConnected } = useAccount();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 1. Load Order from Backend
  useEffect(() => {
    const orderId = window.location.pathname.split("/").pop() || "demo";
    if (orderId) {
      setLoading(true);
      fetch(`http://localhost:3001/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  const handleFund = async () => {
    if (!order || !address) return;
    const amount = parseUnits(order.job.budget, 6);
    
    // Step 1: Approve
    writeContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amount],
    });
  };

  const handleFinalFund = async () => {
    if (!order || !order.onChainJobId) return;
    const amount = parseUnits(order.job.budget, 6);
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: IACP_ABI,
      functionName: "fund",
      args: [BigInt(order.onChainJobId), amount, "0x"],
    });
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Architecting Logic...</div>;
  if (!order) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Order not found. Check backend vault.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <Zap className="text-purple-500 fill-purple-500" /> PANDEM <span className="text-slate-500 font-light">CHECKOUT</span>
            </h1>
            <p className="text-slate-400 mt-1">High-Integrity Verification Protocol</p>
          </div>
          <ConnectKitButton />
        </div>

        {/* Main Content */}
        <div className="grid gap-8">
          {/* Intent Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Bug Bounty Case
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Budget</p>
                <p className="text-2xl font-black text-white">{order.job.budget} <span className="text-slate-500">pUSDC</span></p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{order.job.description}</h2>
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-800 text-sm text-slate-400">
              <div className="flex items-center gap-1"><Shield size={14} className="text-green-500"/> Evaluator: {order.job.evaluator.substring(0, 6)}...</div>
              <div className="flex items-center gap-1"><Clock size={14} /> Expiry: {new Date(order.job.expiry * 1000).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Strategic Rubric (The AI Intelligence) */}
          <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={16} /> AI Strategic Verification Rubric
            </h3>
            <div className="bg-black/40 rounded-xl p-4 border border-slate-800 leading-relaxed text-slate-300">
              {order.strategy.rubric.split('\n').map((line: string, i: number) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 italic">
              * This rubric was autonomously synthesized by the Pandem Strategic Architect. The Evaluator Agent is cryptographically bound to these success criteria.
            </p>
          </div>

          {/* Action Module */}
          {!isConnected ? (
            <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
              <p className="text-slate-500 mb-4">Connect your wallet to authorize funding.</p>
              <div className="flex justify-center"><ConnectKitButton /></div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm bg-blue-500/10 text-blue-400 p-4 rounded-xl border border-blue-500/20">
                <AlertCircle size={18} />
                <span>You are authorizing <b>{order.job.budget} pUSDC</b> to be escrowed on Base Sepolia.</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleFund}
                  disabled={isConfirming}
                  className="bg-white text-black font-black py-4 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isConfirming ? <CheckCircle className="animate-spin" /> : "1. AUTHORIZE"}
                </button>
                <button 
                  onClick={handleFinalFund}
                  disabled={!isSuccess}
                  className="bg-purple-600 text-white font-black py-4 rounded-xl hover:bg-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                >
                  2. FUND ESCROW
                </button>
              </div>
              
              {isSuccess && (
                <div className="text-center text-green-400 text-sm font-bold flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Transaction Confirmed! You can now fund the escrow.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
