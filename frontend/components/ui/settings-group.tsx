import type React from "react"
import GlassCard from "./glass-card"

interface SettingsGroupProps {
  title: string
  children: React.ReactNode
}

export default function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <section aria-labelledby={`header-${title.toLowerCase().replace(" ", "-")}`}>
      <h2
        id={`header-${title.toLowerCase().replace(" ", "-")}`}
        className="mb-3 px-4 text-lg font-semibold text-white/90"
      >
        {title}
      </h2>
      <GlassCard className="bg-white/80 p-0 text-foreground">
        <div className="divide-y divide-gray-200">{children}</div>
      </GlassCard>
    </section>
  )
}
