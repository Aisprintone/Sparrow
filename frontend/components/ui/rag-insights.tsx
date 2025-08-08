'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Loader2, Brain, TrendingUp, DollarSign, Target } from 'lucide-react';
import { ragService, ProfileSummary } from '../../lib/api/rag-service';

interface RAGInsightsProps {
  profileId: number;
  className?: string;
}

export function RAGInsights({ profileId, className }: RAGInsightsProps) {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const financialInsights = await ragService.getFinancialInsights(profileId);
      setInsights(financialInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setInsights('Unable to generate insights at this time.');
    } finally {
      setLoading(false);
    }
  };

  const generateSpendingAnalysis = async () => {
    setLoading(true);
    try {
      const analysis = await ragService.getSpendingAnalysis(profileId);
      setInsights(analysis);
    } catch (error) {
      console.error('Failed to generate spending analysis:', error);
      setInsights('Unable to analyze spending patterns at this time.');
    } finally {
      setLoading(false);
    }
  };

  const generateInvestmentRecommendations = async () => {
    setLoading(true);
    try {
      const recommendations = await ragService.getInvestmentRecommendations(profileId);
      setInsights(recommendations);
    } catch (error) {
      console.error('Failed to generate investment recommendations:', error);
      setInsights('Unable to generate investment recommendations at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load profile summary on mount
    const loadProfileSummary = async () => {
      try {
        const summaries = await ragService.getProfileSummaries();
        const profile = summaries.find(p => p.profile_id === profileId);
        if (profile) {
          setProfileSummary(profile);
        }
      } catch (error) {
        console.error('Failed to load profile summary:', error);
      }
    };

    loadProfileSummary();
  }, [profileId]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Financial Insights
          </CardTitle>
          <CardDescription>
            Get personalized financial insights powered by AI analysis of your financial data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Summary */}
          {profileSummary && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Net Worth</p>
                <p className="text-2xl font-bold text-green-600">
                  ${profileSummary.net_worth.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Accounts</p>
                <p className="text-lg font-semibold">{profileSummary.total_accounts}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={generateInsights}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Financial Insights
            </Button>

            <Button
              onClick={generateSpendingAnalysis}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Spending Analysis
            </Button>

            <Button
              onClick={generateInvestmentRecommendations}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              Investment Tips
            </Button>
          </div>

          {/* Insights Display */}
          {insights && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  AI Analysis
                </h4>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {insights}
                </p>
              </div>
            </div>
          )}

          {/* No Insights State */}
          {!insights && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                Click one of the buttons above to generate AI-powered financial insights
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
