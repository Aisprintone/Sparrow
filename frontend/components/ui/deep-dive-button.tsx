"use client"

import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"

interface DeepDiveButtonProps {
  onClick: () => void
  disabled?: boolean
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export default function DeepDiveButton({ 
  onClick, 
  disabled = false, 
  variant = "ghost",
  size = "sm",
  className = ""
}: DeepDiveButtonProps) {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={`text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all duration-200 ${className}`}
    >
      <Brain className="mr-2 h-3 w-3" />
      Deep Dive Analysis
    </Button>
  )
}