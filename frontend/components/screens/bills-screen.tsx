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
    <div className="pb-28">
      <header className="p-6 text-white">
        <h1 className="text-2xl font-bold">Bills & Subscriptions</h1>
      </header>

      <div className="px-4">
        <section className="mb-8">
          <h2 className="mb-3 px-2 text-lg font-semibold text-white">Upcoming</h2>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
            {upcomingBills.map((bill) => (
              <motion.div key={bill.id} variants={itemVariants}>
                <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Clock className="mr-4 h-6 w-6 text-yellow-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-200">{bill.name}</p>
                    <p className="text-sm text-gray-400">Due {format(parseISO(bill.dueDate), "MMM d")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">${bill.amount.toFixed(2)}</p>
                    <Button size="sm" variant="ghost" onClick={() => payBill(bill.id)} className="h-auto p-1 text-xs">
                      Pay Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section>
          <h2 className="mb-3 px-2 text-lg font-semibold text-white">Paid this month</h2>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
            {paidBills.map((bill) => (
              <motion.div key={bill.id} variants={itemVariants}>
                <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-4 opacity-60">
                  <CheckCircle className="mr-4 h-6 w-6 text-green-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-300">{bill.name}</p>
                    <p className="text-sm text-gray-500">Paid {format(parseISO(bill.dueDate), "MMM d")}</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-300">${bill.amount.toFixed(2)}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>
    </div>
  )
}
