"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Target, 
  Shield, 
  Home, 
  Plane, 
  TrendingUp, 
  GraduationCap, 
  Briefcase, 
  BarChart3, 
  BookOpen,
  Check,
  Sparkles
} from 'lucide-react'
import { Goal } from '@/lib/data'
import { GoalService } from '@/lib/services/goal-service'
import { useToast } from '@/hooks/use-toast'
import type { AppState } from "@/hooks/use-app-state"

const goalTypes = [
  { value: 'safety', label: 'Safety', icon: Shield, color: 'green' },
  { value: 'home', label: 'Home', icon: Home, color: 'purple' },
  { value: 'experience', label: 'Experience', icon: Plane, color: 'blue' },
  { value: 'retirement', label: 'Retirement', icon: TrendingUp, color: 'orange' },
  { value: 'debt', label: 'Debt', icon: GraduationCap, color: 'red' },
  { value: 'investment', label: 'Investment', icon: BarChart3, color: 'teal' },
  { value: 'business', label: 'Business', icon: Briefcase, color: 'indigo' },
  { value: 'education', label: 'Education', icon: BookOpen, color: 'cyan' }
]

const goalIcons = [
  { value: 'Target', label: 'Target', icon: Target },
  { value: 'Shield', label: 'Shield', icon: Shield },
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'Plane', label: 'Plane', icon: Plane },
  { value: 'TrendingUp', label: 'Trending Up', icon: TrendingUp },
  { value: 'GraduationCap', label: 'Graduation Cap', icon: GraduationCap },
  { value: 'Briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'BarChart3', label: 'Bar Chart', icon: BarChart3 },
  { value: 'BookOpen', label: 'Book Open', icon: BookOpen }
]

const goalColors = [
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
  { value: 'teal', label: 'Teal', color: 'bg-teal-500' },
  { value: 'cyan', label: 'Cyan', color: 'bg-cyan-500' }
]

export default function CreateGoalScreen({ 
  addGoal, 
  setCurrentScreen 
}: AppState) {
  const { toast } = useToast()
  const [goalService] = useState(() => GoalService.getInstance())
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    target: '',
    current: '0',
    deadline: '',
    icon: 'Target',
    color: 'blue',
    monthlyContribution: '',
    priority: 'medium',
    milestones: [] as { name: string; target: number }[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Goal title is required'
    }

    if (!formData.type) {
      newErrors.type = 'Goal type is required'
    }

    if (!formData.target || parseFloat(formData.target) <= 0) {
      newErrors.target = 'Target amount must be greater than 0'
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required'
    }

    if (!formData.monthlyContribution || parseFloat(formData.monthlyContribution) <= 0) {
      newErrors.monthlyContribution = 'Monthly contribution must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const goalData: Omit<Goal, 'id'> = {
        title: formData.title,
        type: formData.type as Goal['type'],
        target: parseFloat(formData.target),
        current: parseFloat(formData.current),
        deadline: formData.deadline,
        icon: formData.icon,
        color: formData.color,
        monthlyContribution: parseFloat(formData.monthlyContribution),
        priority: formData.priority as Goal['priority'],
        milestones: formData.milestones
      }

      const newGoal = await goalService.createGoal(goalData)
      addGoal(goalData)
      
      toast({
        title: 'Goal created',
        description: `${newGoal.title} has been created successfully.`,
      })
      
      setCurrentScreen('goals')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleTemplateSelect = (template: any) => {
    setFormData({
      ...formData,
      title: template.title,
      type: template.type,
      icon: template.icon,
      color: template.color,
      priority: template.priority,
      milestones: template.milestones || []
    })
    setSelectedTemplate(template)
    setShowTemplates(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getSelectedType = () => goalTypes.find(type => type.value === formData.type)
  const getSelectedIcon = () => goalIcons.find(icon => icon.value === formData.icon)
  const getSelectedColor = () => goalColors.find(color => color.value === formData.color)

  return (
    <div className="h-[100dvh] overflow-y-auto pb-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentScreen('goals')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Goal</h1>
            <p className="text-white/60">
              Set up a new financial goal
            </p>
          </div>
        </div>

        {/* Templates Section */}
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5" />
              Quick Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {goalService.getGoalTemplates().slice(0, 4).map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-3 flex-col items-start bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1 rounded ${goalColors.find(c => c.value === template.color)?.color} text-white`}>
                      {goalIcons.find(i => i.value === template.icon)?.icon && 
                        React.createElement(goalIcons.find(i => i.value === template.icon)!.icon, { className: "h-3 w-3" })
                      }
                    </div>
                    <span className="text-sm font-medium">{template.title}</span>
                  </div>
                  <span className="text-xs text-white/60">{template.type}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Goal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Emergency Fund"
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.title ? 'border-red-500' : ''}`}
                />
                {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-white">Goal Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className={`bg-white/10 border-white/20 text-white ${errors.type ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {goalTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${type.color} text-white`}>
                            <type.icon className="h-3 w-3" />
                          </div>
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-400">{errors.type}</p>}
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <Label htmlFor="target" className="text-white">Target Amount</Label>
                <Input
                  id="target"
                  type="number"
                  value={formData.target}
                  onChange={(e) => handleInputChange('target', e.target.value)}
                  placeholder="0.00"
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.target ? 'border-red-500' : ''}`}
                />
                {errors.target && <p className="text-sm text-red-400">{errors.target}</p>}
              </div>

              {/* Current Amount */}
              <div className="space-y-2">
                <Label htmlFor="current" className="text-white">Current Amount</Label>
                <Input
                  id="current"
                  type="number"
                  value={formData.current}
                  onChange={(e) => handleInputChange('current', e.target.value)}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              {/* Monthly Contribution */}
              <div className="space-y-2">
                <Label htmlFor="monthlyContribution" className="text-white">Monthly Contribution</Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  value={formData.monthlyContribution}
                  onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
                  placeholder="0.00"
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.monthlyContribution ? 'border-red-500' : ''}`}
                />
                {errors.monthlyContribution && <p className="text-sm text-red-400">{errors.monthlyContribution}</p>}
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-white">Target Date</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className={`bg-white/10 border-white/20 text-white ${errors.deadline ? 'border-red-500' : ''}`}
                />
                {errors.deadline && <p className="text-sm text-red-400">{errors.deadline}</p>}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-white">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="low" className="text-white hover:bg-gray-800">Low</SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-gray-800">Medium</SelectItem>
                    <SelectItem value="high" className="text-white hover:bg-gray-800">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Icon and Color */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => handleInputChange('icon', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {goalIcons.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value} className="text-white hover:bg-gray-800">
                          <div className="flex items-center gap-2">
                            <icon.icon className="h-4 w-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Color</Label>
                  <Select value={formData.color} onValueChange={(value) => handleInputChange('color', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {goalColors.map((color) => (
                        <SelectItem key={color.value} value={color.value} className="text-white hover:bg-gray-800">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${color.color}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
            <Check className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </form>
      </div>
    </div>
  )
}
