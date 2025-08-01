'use client';

import React from 'react';
import { Award, CheckCircle, Star, Target } from 'lucide-react';

interface QuizBadgeProps {
  type: 'recommended' | 'match' | 'popular' | 'best-value';
  quizResult?: string;
  confidence?: number;
  onClick?: () => void;
}

export function QuizBadge({ type, quizResult, confidence = 100, onClick }: QuizBadgeProps) {
  const getBadgeConfig = () => {
    switch (type) {
      case 'recommended':
        return {
          icon: Target,
          text: 'Quiz Match',
          subtext: quizResult ? `Based on ${quizResult}` : 'Recommended for you',
          className: 'bg-blue-600 text-white',
          glowColor: 'shadow-blue-500/25'
        };
      case 'match':
        return {
          icon: CheckCircle,
          text: 'Perfect Match',
          subtext: `${confidence}% match`,
          className: 'bg-green-600 text-white',
          glowColor: 'shadow-green-500/25'
        };
      case 'popular':
        return {
          icon: Star,
          text: 'Most Popular',
          subtext: 'Top choice',
          className: 'bg-amber-500 text-white',
          glowColor: 'shadow-amber-500/25'
        };
      case 'best-value':
        return {
          icon: Award,
          text: 'Best Value',
          subtext: 'Great savings',
          className: 'bg-purple-600 text-white',
          glowColor: 'shadow-purple-500/25'
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <div 
      className={`
        absolute -top-2 -right-2 z-20 px-3 py-1 rounded-full text-xs font-bold 
        flex items-center gap-1 shadow-lg ${config.className} ${config.glowColor}
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
        transition-all duration-200 animate-pulse
      `}
      onClick={onClick}
      title={`${config.text}${config.subtext ? ` - ${config.subtext}` : ''}`}
    >
      <IconComponent size={12} fill="currentColor" />
      <span className="whitespace-nowrap">{config.text}</span>
    </div>
  );
}

// Hook to determine quiz badges for products
export function useQuizBadges(productId: string) {
  const [badges, setBadges] = React.useState<QuizBadgeProps[]>([]);

  React.useEffect(() => {
    // Get quiz results from localStorage or session
    const getQuizResults = () => {
      try {
        const quizData = localStorage.getItem('quiz_results');
        if (!quizData) return null;
        return JSON.parse(quizData);
      } catch {
        return null;
      }
    };

    const determineProductBadges = (productId: string, quizResults: any) => {
      const badges: QuizBadgeProps[] = [];

      if (!quizResults) {
        // No quiz results, just show popular badges
        if (productId === '9Ah') {
          badges.push({ type: 'popular' });
        }
        return badges;
      }

      // Analyze quiz results and match to products
      const { projectType, teamSize, workIntensity, environment } = quizResults;

      // Logic for 6Ah battery
      if (productId === '6Ah') {
        if (teamSize === 'small' || workIntensity === 'light') {
          badges.push({ 
            type: 'recommended', 
            quizResult: teamSize === 'small' ? 'small team setup' : 'light usage',
            confidence: 85 
          });
        }
        if (projectType === 'residential') {
          badges.push({ type: 'best-value', quizResult: 'residential projects' });
        }
      }

      // Logic for 9Ah battery (most versatile)
      if (productId === '9Ah') {
        if (teamSize === 'medium' || workIntensity === 'moderate') {
          badges.push({ 
            type: 'match', 
            quizResult: 'medium crew projects',
            confidence: 95 
          });
        }
        if (!badges.length) {
          badges.push({ type: 'popular' });
        }
      }

      // Logic for 15Ah battery
      if (productId === '15Ah') {
        if (teamSize === 'large' || workIntensity === 'heavy') {
          badges.push({ 
            type: 'recommended', 
            quizResult: teamSize === 'large' ? 'large team operations' : 'heavy-duty work',
            confidence: 90 
          });
        }
        if (environment === 'outdoor' || projectType === 'commercial') {
          badges.push({ type: 'match', quizResult: 'demanding conditions' });
        }
      }

      return badges;
    };

    const quizResults = getQuizResults();
    const productBadges = determineProductBadges(productId, quizResults);
    setBadges(productBadges);
  }, [productId]);

  return badges;
}

// Component to display quiz match explanation
export function QuizMatchExplanation({ productId, badges }: { productId: string; badges: QuizBadgeProps[] }) {
  if (!badges.length) return null;

  const recommendedBadge = badges.find(b => b.type === 'recommended' || b.type === 'match');
  if (!recommendedBadge) return null;

  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-start gap-2">
        <Target size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">
            Quiz Recommendation
          </p>
          <p className="text-xs text-blue-600 mt-1">
            This battery matches your {recommendedBadge.quizResult} requirements.
            {recommendedBadge.confidence && ` ${recommendedBadge.confidence}% compatibility.`}
          </p>
        </div>
      </div>
    </div>
  );
}