"use client"

import { useState, useRef, useEffect } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Bot, User, Sparkles, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  sender: "user" | "ai"
  text: string
  timestamp: Date
  context?: {
    profile?: string
    netWorth?: number
    income?: number
  }
}

export default function ChatScreen({ 
  isChatOpen, 
  setChatOpen, 
  demographic, 
  profileData 
}: AppState) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: "ai", 
      text: "Hello! I'm your FinanceAI assistant. I can help you with budgeting, investment strategies, debt management, and financial planning. What would you like to discuss today?",
      timestamp: new Date(),
      context: { profile: demographic }
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = { 
      sender: "user", 
      text: input,
      timestamp: new Date(),
      context: { 
        profile: demographic,
        netWorth: profileData?.netWorth,
        income: profileData?.income
      }
    }
    
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          context: {
            profile: demographic,
            netWorth: profileData?.netWorth,
            income: profileData?.income,
            age: profileData?.age,
            location: profileData?.location
          }
        }),
      })
      
      const data = await response.json()
      
      // Simulate typing delay for more natural feel
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      
      const aiMessage: Message = { 
        sender: "ai", 
        text: data.reply || "I'm here to help with your financial questions. Could you please rephrase that?",
        timestamp: new Date(),
        context: { profile: demographic }
      }
      
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = { 
        sender: "ai", 
        text: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date(),
        context: { profile: demographic }
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isChatOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-xl"
    >
      <header className="flex items-center justify-between p-4 text-white border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">FinanceAI Assistant</h2>
            <p className="text-xs text-white/60">Powered by AI • {demographic} profile</p>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={() => setChatOpen(false)}>
          <X />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex flex-col max-w-xs md:max-w-md">
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    msg.sender === "user"
                      ? "rounded-br-none bg-blue-600 text-white"
                      : "rounded-bl-none bg-gray-700 text-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-white/40 mt-1 ml-2">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              {msg.sender === "user" && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-600">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center space-x-1 rounded-2xl rounded-bl-none bg-gray-700 px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your finances..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
