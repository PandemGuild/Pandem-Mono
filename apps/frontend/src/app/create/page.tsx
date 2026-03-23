'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap, Shield, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { useRouter } from 'next/navigation'
import { HANDOVER_CONTRACT_ADDRESS, getCurrentNetwork } from '@/lib/contracts/config'

// ABI for createJob
const IACP_ABI = [
  { 
    name: "createJob", 
    type: "function", 
    inputs: [
      { name: "p", type: "address" }, 
      { name: "e", type: "address" }, 
      { name: "x", type: "uint256" }, 
      { name: "d", type: "string" }, 
      { name: "h", type: "address" }
    ], 
    outputs: [{ name: "j", type: "uint256" }] 
  }
] as const;

export default function CreateJobPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('10')
  const [provider, setProvider] = useState('')
  const [isArchitecting, setIsArchitecting] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isCreatingOnChain, isSuccess: isCreatedOnChain, data: receipt } = useWaitForTransactionReceipt({ hash })

  const handleArchitect = async () => {
    setIsArchitecting(true)
    try {
      const res = await fetch('http://localhost:3001/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            description,
            budget,
            provider,
            evaluator: "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5", // Default Evaluator
            expiry: Math.floor(Date.now() / 1000) + 86400
          }
        })
      })
      const data = await res.json()
      setOrderData(data)
    } catch (err) {
      console.error("Architecting failed", err)
    } finally {
      setIsArchitecting(false)
    }
  }

  const handleCreateOnChain = async () => {
    if (!orderData) return
    
    writeContract({
      address: HANDOVER_CONTRACT_ADDRESS,
      abi: IACP_ABI,
      functionName: "createJob",
      args: [
        provider as `0x${string}`,
        "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5",
        BigInt(Math.floor(Date.now() / 1000) + 86400),
        description,
        "0x0000000000000000000000000000000000000000"
      ],
    })
  }

  // Effect to link job once created
  React.useEffect(() => {
    if (isCreatedOnChain && orderData && hash) {
       // In a real app we'd extract jobId from receipt logs
       // For this demo we'll just redirect to the checkout
       router.push(`/checkout/${orderData.orderId}`)
    }
  }, [isCreatedOnChain, orderData, hash])

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-8 tracking-tighter flex items-center gap-3">
          <Zap className="text-purple-500 fill-purple-500" /> ARCHITECT <span className="text-slate-700">DEAL</span>
        </h1>

        {!orderData ? (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle>Define the Intent</CardTitle>
              <CardDescription className="text-slate-500">The Strategic Architect will analyze your requirements and generate a verification rubric.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500">Job Description</Label>
                <Input 
                  placeholder="e.g. Verify fix for critical buffer overflow in storage module" 
                  className="bg-black border-slate-800 h-12"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-slate-500">Budget (pUSDC)</Label>
                  <Input 
                    type="number" 
                    className="bg-black border-slate-800 h-12"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-slate-500">Provider Address</Label>
                  <Input 
                    placeholder="0x..." 
                    className="bg-black border-slate-800 h-12"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleArchitect}
                disabled={isArchitecting || !description || !provider}
                className="w-full h-14 bg-white text-black hover:bg-slate-200 font-black rounded-xl uppercase tracking-widest"
              >
                {isArchitecting ? <Loader2 className="animate-spin" /> : "SYTHESIZE STRATEGY"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-3xl p-8">
              <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield size={16} /> Strategy Generated
              </h3>
              <p className="text-slate-300 leading-relaxed italic border-l-2 border-purple-500 pl-4 py-2 bg-purple-500/5">
                {orderData.strategy.rubric.split('\n')[0]}...
              </p>
              <div className="mt-6 p-4 bg-black/40 rounded-xl text-xs text-slate-500 font-bold">
                The AI has determined that this is a <b>{orderData.strategy.caseType}</b> and requires <b>{orderData.strategy.requiredSkills.join(', ')}</b>.
              </div>
            </div>

            <Button 
              onClick={handleCreateOnChain}
              disabled={isCreatingOnChain}
              className="w-full h-20 bg-purple-600 text-white hover:bg-purple-500 font-black rounded-2xl text-lg uppercase tracking-widest shadow-2xl shadow-purple-500/20"
            >
              {isCreatingOnChain ? "MINING JOB..." : "INITIALIZE ON-CHAIN AGREEMENT"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
