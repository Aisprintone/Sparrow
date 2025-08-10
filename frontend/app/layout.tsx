import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
// Import dev config to suppress common warnings in local development
import "@/lib/utils/dev-config"

// Self-hosted font configuration - enterprise-safe
const fontSans = {
  variable: "--font-sans",
  className: "font-sans"
}

export const metadata: Metadata = {
  title: "FinanceAI",
  description: "Your autonomous financial co-pilot",
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
      </head>
      <body className={cn("font-sans antialiased", fontSans.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
