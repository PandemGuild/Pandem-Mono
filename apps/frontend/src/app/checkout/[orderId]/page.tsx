'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Zap, Clock, AlertCircle, CheckCircle, Wallet } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { HANDOVER_CONTRACT_ADDRESS, TOKEN_ADDRESS } from '@/lib/contracts/config'

// Simplified ABI for the checkout
const IACP_ABI = [
  { name: "fund", type: "function", inputs: [{ name: "j", type: "uint256" }, { name: "e", type: "uint256" }, { name: "o", type: "bytes" }], outputs: [] }
] as const;

const ERC20_ABI = [
  { name: "approve", type: "function", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ name: "", type: "bool" }] }
] as const;

export default function CheckoutPage() {
  const { orderId } = useParams()
  const { address, isConnected } = useAccount()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (orderId) {
      fetch(`http://localhost:3001/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data)
          setLoading(false)
        })
        .catch(err => {
          console.error("Failed to fetch order", err)
          setLoading(false)
        })
    }
  }, [orderId])

  const handleApprove = async () => {
    if (!order) return
    const amount = parseUnits(order.job.budget, 6)
    writeContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [HANDOVER_CONTRACT_ADDRESS, amount],
    })
  }

  const handleFund = async () => {
    if (!order || !order.onChainJobId) return
    const amount = parseUnits(order.job.budget, 6)
    writeContract({
      address: HANDOVER_CONTRACT_ADDRESS,
      abi: IACP_ABI,
      functionName: "fund",
      args: [BigInt(order.onChainJobId), amount, "0x"],
    })
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">ARCHITECTING DEAL...</div>
  if (!order) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">ORDER NOT FOUND</div>

  return (
    <div className="min-h-screen bg-black text-slate-200 font-mono p-4 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-2">
              <Zap className="text-purple-500 fill-purple-500" /> PANDEM <span className="text-slate-600">CHECKOUT</span>
            </h1>
            <p className="text-slate-500 mt-1 font-bold">PROTOCOL LEVEL: ERC-8183</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl">
             {/* @ts-ignore */}
             <w3m-button />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            
            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className="text-purple-400 border-purple-400/30 bg-purple-400/10 uppercase tracking-widest text-[10px]">Active Agreement</Badge>
                  <span className="text-slate-500 text-xs uppercase font-bold">Order ID: {orderId}</span>
                </div>
                <CardTitle className="text-2xl font-bold">{order.job.description}</CardTitle>
                <CardDescription className="text-slate-400">Created by Proposer for on-chain settlement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Escrow Amount</p>
                    <p className="text-3xl font-black">{order.job.budget} <span className="text-slate-600 text-lg">pUSDC</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Network</p>
                    <p className="text-xl font-bold flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      Celo Sepolia
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strategic Rubric Section */}
            <div className="bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-purple-500/20 group-hover:text-purple-500/40 transition-colors">
                <Shield size={120} strokeWidth={1} />
              </div>
              <h3 className="text-sm font-black text-purple-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Zap size={18} className="fill-purple-400" /> AI STRATEGIC VERIFICATION RUBRIC
              </h3>
              <div className="space-y-4 relative z-10">
                {order.strategy.rubric.split('\n').map((line: string, i: number) => (
                  <p key={i} className="text-slate-300 leading-relaxed text-sm bg-black/30 p-3 rounded-lg border border-white/5">
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <div className="w-4 h-[1px] bg-slate-700"></div>
                Generated by Gemini 1.5 Flash Strategic Architect
              </div>
            </div>

          </div>

          {/* Action Sidebar */}
          <div className="space-y-6">
            
            <Card className="bg-slate-900 border-slate-800 text-white sticky top-8">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest">Payment Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {!isConnected ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500 text-xs mb-4 uppercase font-bold tracking-tighter">Connect wallet to begin</p>
                    {/* @ts-ignore */}
                    <w3m-button />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                      <AlertCircle className="text-blue-400 shrink-0" size={18} />
                      <p className="text-[11px] text-blue-300 leading-tight">
                        You are authorizing the <b>Pandem Handover Contract</b> to lock 10 pUSDC in escrow. Funds release only after AI verification.
                      </p>
                    </div>

                    <div className="grid gap-2 pt-4">
                      <Button 
                        onClick={handleApprove}
                        disabled={isConfirming}
                        className="w-full h-14 bg-white text-black hover:bg-slate-200 font-black rounded-xl text-xs uppercase tracking-widest"
                      >
                        {isConfirming ? "Processing..." : "1. Authorize Token"}
                      </Button>
                      
                      <Button 
                        onClick={handleFund}
                        disabled={!isSuccess || !order.onChainJobId}
                        className="w-full h-14 bg-purple-600 text-white hover:bg-purple-500 font-black rounded-xl text-xs uppercase tracking-widest disabled:opacity-30"
                      >
                        2. Fund Escrow
                      </Button>
                    </div>

                    {isSuccess && (
                      <div className="flex items-center gap-2 justify-center text-[10px] text-green-400 font-bold uppercase animate-bounce">
                        <CheckCircle size={14} /> Ready to fund on-chain
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-6 mt-6 border-t border-slate-800">
                   <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4">
                      <span>Evaluator Node</span>
                      <span className="text-green-500">Online</span>
                   </div>
                   <div className="text-[9px] text-slate-600 leading-relaxed italic">
                      The Evaluator Agent will autonomously watch the blockchain for your funding event. Verification starts instantly upon block finality.
                   </div>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </div>
  )
}

// Minimal Badge Component since we copied UI
function Badge({ children, className, variant }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  )
}
