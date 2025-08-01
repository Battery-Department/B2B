// Dynamic Quiz Questions Configuration
import { QuizQuestion } from '@/types/quiz-v2';

// Question 1: User Type Selection
export const USER_TYPE_QUESTION: QuizQuestion = {
  id: 'user-type',
  type: 'visual-cards',
  question: "Let's start with the basics - who's this for?",
  subtitle: "This helps us show the right products and pricing",
  options: [
    {
      id: 'professional',
      value: 'professional',
      title: 'Professional Contractor',
      label: '🔧 Professional Contractor',
      description: 'Crew of 2+ • Daily use • Volume pricing',
      highlights: ['Fleet Pricing', 'Net Terms', 'Dedicated Support'],
      visualCard: {
        background: 'linear-gradient(135deg, #006FEE 0%, #0050B3 100%)',
        hoverEffect: 'translateY(-4px) shadow-xl',
        selectionAnimation: 'pulse-border 0.6s ease-out'
      }
    },
    {
      id: 'personal',
      value: 'personal',
      title: 'DIY/Homeowner',
      label: '🏠 DIY/Homeowner',
      description: 'Personal projects • Weekend warrior',
      highlights: ['Best Value', 'Free Shipping', 'Easy Returns'],
      visualCard: {
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        hoverEffect: 'translateY(-4px) shadow-lg',
        selectionAnimation: 'pulse-border 0.6s ease-out'
      }
    }
  ]
};

// Professional Path Questions
export const PROFESSIONAL_QUESTIONS: QuizQuestion[] = [
  {
    id: 'trade',
    type: 'single-choice',
    question: "What's your primary trade?",
    subtitle: "We'll recommend tools and batteries specific to your industry",
    options: [
      { id: 'electrical', value: 'electrical', label: '⚡ Electrical', icon: '⚡' },
      { id: 'plumbing', value: 'plumbing', label: '🔧 Plumbing', icon: '🔧' },
      { id: 'hvac', value: 'hvac', label: '❄️ HVAC', icon: '❄️' },
      { id: 'carpentry', value: 'carpentry', label: '🔨 Carpentry', icon: '🔨' },
      { id: 'general', value: 'general', label: '🏗️ General Contractor', icon: '🏗️' },
      { id: 'concrete', value: 'concrete', label: '🧱 Concrete/Masonry', icon: '🧱' },
      { id: 'landscaping', value: 'landscaping', label: '🌿 Landscaping', icon: '🌿' },
      { id: 'other', value: 'other', label: '📋 Other Trade', icon: '📋' }
    ]
  },
  {
    id: 'crew-size',
    type: 'slider',
    question: "How many people on your crew?",
    subtitle: "This helps us calculate the right battery fleet size",
    options: [
      { id: 'solo', value: 1, label: 'Solo' },
      { id: 'small', value: 5, label: '2-5 people' },
      { id: 'medium', value: 10, label: '6-15 people' },
      { id: 'large', value: 20, label: '16+ people' }
    ]
  },
  {
    id: 'pain-points',
    type: 'ranking',
    question: "Rank your biggest battery frustrations",
    subtitle: "Drag to reorder - we'll address your top concerns",
    options: [
      { 
        id: 'runtime',
        value: 'runtime',
        label: 'Batteries die mid-job',
        icon: '🔋'
      },
      {
        id: 'cold-weather',
        value: 'cold-weather',
        label: 'Cold weather kills batteries',
        icon: '❄️'
      },
      {
        id: 'compatibility',
        value: 'compatibility',
        label: 'Too many different chargers',
        icon: '🔌'
      },
      {
        id: 'cost',
        value: 'cost',
        label: 'Replacement costs killing budget',
        icon: '💰'
      },
      {
        id: 'theft',
        value: 'theft',
        label: 'Tools/batteries keep getting stolen',
        icon: '🔒'
      }
    ]
  },
  {
    id: 'usage-intensity',
    type: 'single-choice',
    question: "Daily battery usage?",
    subtitle: "This determines the battery capacity you need",
    options: [
      {
        id: 'light',
        value: 'light',
        label: '2-4 hours',
        description: 'Light usage - occasional tasks'
      },
      {
        id: 'moderate',
        value: 'moderate',
        label: '4-6 hours',
        description: 'Standard construction day'
      },
      {
        id: 'heavy',
        value: 'heavy',
        label: '6-8 hours',
        description: 'Full day heavy use',
        highlights: ['Most common']
      },
      {
        id: 'extreme',
        value: 'extreme',
        label: '8+ hours',
        description: 'Non-stop operations'
      }
    ]
  },
  {
    id: 'timeline',
    type: 'single-choice',
    question: "When do you need batteries?",
    subtitle: "We'll prioritize based on your timeline",
    options: [
      { id: 'asap', value: 'asap', label: '🚀 ASAP', description: 'Need them now' },
      { id: 'week', value: 'week', label: '📅 This week', description: 'Quick turnaround' },
      { id: 'month', value: 'month', label: '📆 This month', description: 'Standard delivery' },
      { id: 'quarter', value: 'quarter', label: '📊 Next quarter', description: 'Planning ahead' },
      { id: 'planning', value: 'planning', label: '📋 Just planning', description: 'Research phase' }
    ]
  }
];

// DIY/Homeowner Path Questions
export const PERSONAL_QUESTIONS: QuizQuestion[] = [
  {
    id: 'project-type',
    type: 'multi-choice',
    question: "What projects do you tackle?",
    subtitle: "Select all that apply",
    options: [
      {
        id: 'home-repair',
        value: 'home-repair',
        label: '🔨 Home Repairs',
        description: 'Basic maintenance'
      },
      {
        id: 'woodworking',
        value: 'woodworking',
        label: '🪵 Woodworking',
        description: 'Building & crafting'
      },
      {
        id: 'auto',
        value: 'auto',
        label: '🚗 Auto Work',
        description: 'Car maintenance'
      },
      {
        id: 'yard',
        value: 'yard',
        label: '🌳 Yard Work',
        description: 'Outdoor projects'
      },
      {
        id: 'renovation',
        value: 'renovation',
        label: '🏠 Renovations',
        description: 'Major upgrades'
      }
    ]
  },
  {
    id: 'experience',
    type: 'single-choice',
    question: "How experienced are you?",
    subtitle: "This helps us recommend the right level of tools",
    options: [
      { id: 'beginner', value: 'beginner', label: '🆕 Just starting', description: 'Learning the basics' },
      { id: 'intermediate', value: 'intermediate', label: '🔧 Some experience', description: 'Comfortable with tools' },
      { id: 'advanced', value: 'advanced', label: '🏆 Very experienced', description: 'Pro-level skills' }
    ]
  },
  {
    id: 'current-tools',
    type: 'single-choice',
    question: "How many tools do you own in this brand?",
    subtitle: "We'll recommend compatible batteries",
    options: [
      { id: 'none', value: '0', label: 'None yet', description: 'Starting fresh' },
      { id: 'few', value: '1-2', label: '1-2 tools', description: 'Just beginning' },
      { id: 'several', value: '3-5', label: '3-5 tools', description: 'Growing collection' },
      { id: 'many', value: '6+', label: '6+ tools', description: 'Serious collection' }
    ]
  },
  {
    id: 'priority',
    type: 'single-choice',
    question: "What's most important to you?",
    subtitle: "We'll tailor recommendations to your priorities",
    options: [
      {
        id: 'price',
        value: 'price',
        label: '💰 Best Price',
        description: 'Maximum value',
        color: '#10B981'
      },
      {
        id: 'quality',
        value: 'quality',
        label: '⭐ Best Quality',
        description: 'Long-lasting',
        color: '#006FEE'
      },
      {
        id: 'warranty',
        value: 'warranty',
        label: '🛡️ Best Warranty',
        description: 'Peace of mind',
        color: '#8B5CF6'
      }
    ]
  }
];

// Helper function to get questions based on user path
export const getQuestionsForPath = (userType: 'professional' | 'personal'): QuizQuestion[] => {
  return userType === 'professional' ? PROFESSIONAL_QUESTIONS : PERSONAL_QUESTIONS;
};

// Dynamic question routing logic
export const getNextQuestion = (
  currentQuestionId: string,
  userType: 'professional' | 'personal',
  responses: Record<string, any>
): QuizQuestion | null => {
  const questions = getQuestionsForPath(userType);
  const currentIndex = questions.findIndex(q => q.id === currentQuestionId);
  
  if (currentIndex === -1) {
    // If not found in path questions, check if it's a base question
    if (currentQuestionId === 'user-type') {
      return questions[0]; // Return first question of the path
    }
    return null;
  }
  
  // Special routing logic based on responses
  if (userType === 'professional' && currentQuestionId === 'trade') {
    const trade = responses['trade'];
    // Could add trade-specific questions here
  }
  
  // Return next question in sequence
  return currentIndex < questions.length - 1 ? questions[currentIndex + 1] : null;
};