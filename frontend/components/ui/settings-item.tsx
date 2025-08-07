"use client"

import type React from "react"
import { ChevronRight } from "lucide-react"

interface SettingsItemProps {
  icon: React.ReactNode
  label: string
  action?: React.ReactNode
  onClick?: () => void
}

export default function SettingsItem({ icon, label, action, onClick }: SettingsItemProps) {
  const content = (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
      <div>{action ?? <ChevronRight className="h-5 w-5 text-gray-400" />}</div>
    </div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left transition-colors hover:bg-gray-50/50">
        {content}
      </button>
    )
  }

  return <div>{content}</div>
}
