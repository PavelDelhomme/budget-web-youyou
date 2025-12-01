/**
 * API utilities for ML and AI recommendations
 */
import { Api } from '../api';

export interface MLRecommendation {
  monthly_contribution?: number;
  target_date?: string;
  recommended_amount?: number;
  confidence: number;
  message: string;
  recommendation_type: 'ai_enhanced' | 'basic';
}

export interface MLValidationResult {
  is_ready_for_training: boolean;
  years_validated: number;
  valid_years: number;
  total_errors: number;
  total_warnings: number;
  average_completeness: number;
  year_results: Array<{
    year: number;
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    completeness_score: number;
    recommendations: string[];
  }>;
  recommendations: string[];
}

export interface MLTrainingScores {
  total_expenses?: { mae: number; r2: number; rmse: number };
  annual_income?: { mae: number; r2: number; rmse: number };
  savings?: { mae: number; r2: number; rmse: number };
}

export const MLApi = {
  /**
   * Get AI recommendation for monthly contribution
   */
  async recommendContribution(
    targetAmount: number,
    targetDate?: string,
    currentAmount: number = 0
  ): Promise<MLRecommendation> {
    const response = await fetch('/api/ml/recommend/contribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_amount: targetAmount,
        target_date: targetDate,
        current_amount: currentAmount,
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la recommandation');
    }
    
    return data.recommendation;
  },

  /**
   * Get AI recommendation for target date
   */
  async recommendDate(
    targetAmount: number,
    monthlyContribution: number,
    currentAmount: number = 0
  ): Promise<MLRecommendation> {
    const response = await fetch('/api/ml/recommend/date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_amount: targetAmount,
        monthly_contribution: monthlyContribution,
        current_amount: currentAmount,
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la recommandation');
    }
    
    return data.recommendation;
  },

  /**
   * Get AI recommendation for savings goal amount
   */
  async recommendGoal(
    goalType: 'emergency' | 'project' | 'investment' = 'emergency',
    timeframeMonths: number = 12
  ): Promise<MLRecommendation> {
    const response = await fetch('/api/ml/recommend/goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: goalType,
        timeframe_months: timeframeMonths,
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la recommandation');
    }
    
    return data.recommendation;
  },

  /**
   * Validate data for ML training
   */
  async validateData(): Promise<MLValidationResult> {
    const response = await fetch('/api/ml/validate-data');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la validation');
    }
    
    return data;
  },

  /**
   * Train ML model
   */
  async trainModel(): Promise<{ success: boolean; training_scores: MLTrainingScores }> {
    const response = await fetch('/api/ml/train', {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'entraînement');
    }
    
    return data;
  },

  /**
   * Get model info
   */
  async getModelInfo() {
    const response = await fetch('/api/ml/info');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur');
    }
    
    return data;
  },

  /**
   * Analyze budget health
   */
  async analyzeBudgetHealth() {
    const response = await fetch('/api/ml/analyze-health');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'analyse');
    }
    
    return data.analysis;
  },
};

