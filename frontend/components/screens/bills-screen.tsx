"use client"

import type { AppState } from "@/hooks/use-app-state"
import { CheckCircle, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"

export default function BillsScreen({ bills, payBill }: AppState) {
  const upcomingBills = bills.filter((b) => b.status === "upcoming").sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
  const paidBills = bills.filter((b) => b.status === "paid")

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="p-3 text-white">
        <h1 className="text-xl font-bold">Bills & Subscriptions</h1>
        <p className="text-white/80">Track your recurring expenses</p>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Upcoming Bills */}
        <div>
          <h2 className="mb-2 px-2 text-base font-semibold text-white">Upcoming</h2>
          <div className="space-y-2">
            {upcomingBills.map((bill) => (
              <div key={bill.id} className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{bill.name}</p>
                  <p className="text-xs text-white/60">{bill.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-white">${bill.amount.toFixed(2)}</p>
                  <p className="text-xs text-white/60">{bill.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paid This Month */}
        <div>
          <h2 className="mb-2 px-2 text-base font-semibold text-white">Paid this month</h2>
          <div className="space-y-2">
            {paidBills.map((bill) => (
              <div key={bill.id} className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-3 opacity-60">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-300">{bill.name}</p>
                  <p className="text-xs text-gray-400">{bill.paidDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-gray-300">${bill.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{bill.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
