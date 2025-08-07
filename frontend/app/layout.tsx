import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

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
