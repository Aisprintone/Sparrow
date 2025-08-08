'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Loader2, Brain, TrendingUp, DollarSign, Target, AlertCircle } from 'lucide-react';
import { aiInsightsService, AIInsight } from '../../lib/api/ai-insights-service';

interface AIInsightsProps {
  profileId: number;
  className?: string;
}

export function AIInsights({ profileId, className }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'financial' | 'spending' | 'investment'>('financial');

  const generateInsights = async (type: 'financial' | 'spending' | 'investment') => {
    setLoading(true);
    setActiveTab(type);
    
    try {
      let newInsights: AIInsight[] = [];
      
      switch (type) {
        case 'financial':
          newInsights = await aiInsightsService.getFinancialInsights(profileId);
          break;
        case 'spending':
          newInsights = await aiInsightsService.getSpendingAnalysis(profileId);
          break;
        case 'investment':
          newInsights = await aiInsightsService.getInvestmentRecommendations(profileId);
          break;
      }
      
      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setInsights([{
        type: 'financial_analysis',
        title: 'Error',
        content: 'Unable to generate insights at this time.',
        confidence: 0,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (type: 'financial' | 'spending' | 'investment') => {
    switch (type) {
      case 'financial': return Brain;
      case 'spending': return TrendingUp;
      case 'investment': return DollarSign;
    }
  };

  const getTabTitle = (type: 'financial' | 'spending' | 'investment') => {
    switch (type) {
      case 'financial': return 'Financial Analysis';
      case 'spending': return 'Spending Patterns';
      case 'investment': return 'Investment Tips';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Financial Insights
          </CardTitle>
          <CardDescription>
            Get intelligent analysis powered by our backend AI system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {(['financial', 'spending', 'investment'] as const).map((type) => {
              const Icon = getTabIcon(type);
              return (
                <Button
                  key={type}
                  onClick={() => generateInsights(type)}
                  disabled={loading}
                  variant={activeTab === type ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {loading && activeTab === type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  {getTabTitle(type)}
                </Button>
              );
            })}
          </div>

          {/* Insights Display */}
          {insights.length > 0 && (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      {insight.title}
                    </h4>
                    {insight.confidence > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {insight.content}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Generated: {new Date(insight.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Insights State */}
          {insights.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                Click one of the buttons above to generate AI-powered insights
              </p>
            </div>
          )}

          {/* Error State */}
          {insights.length === 1 && insights[0].title === 'Error' && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <h4 className="font-medium text-red-900 dark:text-red-100">
                  Unable to Generate Insights
                </h4>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                The AI system is currently unavailable. Please try again later.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
