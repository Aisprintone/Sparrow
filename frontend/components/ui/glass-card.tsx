"use client"

import type React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
}

export default function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-2xl backdrop-blur-xl",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
      <div className="relative">{children}</div>
    </motion.div>
  )
}
