"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, TrendingUp, Scale, Lightbulb } from "lucide-react"
import type { CardData } from "@/components/ai-actions/action-card-factory"

interface DeepDiveModalProps {
  isOpen: boolean
  onClose: () => void
  action: CardData
}

export default function DeepDiveModal({ isOpen, onClose, action }: DeepDiveModalProps) {
  const insights = action.detailed_insights

  if (!insights) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Deep Dive: {action.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="why-smart" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger value="why-smart" className="text-white data-[state=active]:bg-blue-500">
              Why Smart?
            </TabsTrigger>
            <TabsTrigger value="mechanics" className="text-white data-[state=active]:bg-purple-500">
              How It Works
            </TabsTrigger>
            <TabsTrigger value="context" className="text-white data-[state=active]:bg-green-500">
              Trade-offs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="why-smart" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <h3 className="text-white font-medium">Why This Is Smart</h3>
            </div>
            <div className="space-y-3">
              {insights.key_insights?.map((insight: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mechanics" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-purple-400" />
              <h3 className="text-white font-medium">How This Recommendation Works</h3>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-gray-300 leading-relaxed">{insights.mechanics_explanation}</p>
            </div>
          </TabsContent>

          <TabsContent value="context" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-4 w-4 text-orange-400" />
              <h3 className="text-white font-medium">Context & Trade-offs</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-white font-medium mb-2">Scenario Considerations</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{insights.scenario_nuances}</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-white font-medium mb-2">Decision Context</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{insights.decision_context}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer with key metrics */}
        <div className="border-t border-white/10 pt-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                +${action.potentialSaving}/mo potential
              </Badge>
            </div>
            <div className="text-xs text-gray-400">
              Generated with AI analysis of your profile
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}