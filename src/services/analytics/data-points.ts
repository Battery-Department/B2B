/**
 * Enhanced Analytics Data Points System
 * Defines 150+ data points for comprehensive tracking
 */

export enum DataPointCategory {
  USER = 'user',
  BEHAVIOR = 'behavior',
  CONTENT = 'content',
  QUIZ = 'quiz',
  COMMERCE = 'commerce',
  TECHNICAL = 'technical',
  GEOGRAPHIC = 'geographic',
  ENGAGEMENT = 'engagement',
  CUSTOM = 'custom'
}

export enum DataPointType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  JSON = 'json',
  ARRAY = 'array'
}

export interface DataPoint {
  id: string;
  name: string;
  category: DataPointCategory;
  type: DataPointType;
  description: string;
  required?: boolean;
  defaultValue?: any;
  validator?: (value: any) => boolean;
  transformer?: (value: any) => any;
}

// All 150+ data points organized by category
export const DATA_POINTS: Record<string, DataPoint> = {
  // USER DEMOGRAPHICS (20 points)
  USER_ID: {
    id: 'user_id',
    name: 'User ID',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Unique identifier for the user',
    required: true
  },
  USER_EMAIL: {
    id: 'user_email',
    name: 'User Email',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'User email address',
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },
  USER_NAME: {
    id: 'user_name',
    name: 'User Name',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Full name of the user'
  },
  USER_COMPANY: {
    id: 'user_company',
    name: 'Company Name',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Company or organization name'
  },
  USER_ROLE: {
    id: 'user_role',
    name: 'User Role',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'User role in the system'
  },
  USER_INDUSTRY: {
    id: 'user_industry',
    name: 'Industry',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Industry vertical of the user'
  },
  USER_COMPANY_SIZE: {
    id: 'user_company_size',
    name: 'Company Size',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Size of user company (small, medium, large, enterprise)'
  },
  USER_JOB_TITLE: {
    id: 'user_job_title',
    name: 'Job Title',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Professional job title'
  },
  USER_REGISTRATION_DATE: {
    id: 'user_registration_date',
    name: 'Registration Date',
    category: DataPointCategory.USER,
    type: DataPointType.DATE,
    description: 'Date when user registered'
  },
  USER_LIFETIME_VALUE: {
    id: 'user_lifetime_value',
    name: 'Lifetime Value',
    category: DataPointCategory.USER,
    type: DataPointType.NUMBER,
    description: 'Total revenue from user'
  },
  USER_ACQUISITION_SOURCE: {
    id: 'user_acquisition_source',
    name: 'Acquisition Source',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'How the user was acquired'
  },
  USER_ACQUISITION_CAMPAIGN: {
    id: 'user_acquisition_campaign',
    name: 'Acquisition Campaign',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Specific campaign that acquired the user'
  },
  USER_PHONE: {
    id: 'user_phone',
    name: 'Phone Number',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'User phone number'
  },
  USER_AGE_RANGE: {
    id: 'user_age_range',
    name: 'Age Range',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Age bracket of user'
  },
  USER_GENDER: {
    id: 'user_gender',
    name: 'Gender',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'User gender identity'
  },
  USER_LANGUAGE: {
    id: 'user_language',
    name: 'Preferred Language',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'User preferred language'
  },
  USER_TIMEZONE: {
    id: 'user_timezone',
    name: 'Timezone',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'User timezone'
  },
  USER_SEGMENT: {
    id: 'user_segment',
    name: 'User Segment',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Assigned user segment'
  },
  USER_PERSONA: {
    id: 'user_persona',
    name: 'User Persona',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Marketing persona classification'
  },
  USER_STATUS: {
    id: 'user_status',
    name: 'User Status',
    category: DataPointCategory.USER,
    type: DataPointType.STRING,
    description: 'Active, inactive, churned, etc.'
  },

  // BEHAVIORAL PATTERNS (25 points)
  SESSION_ID: {
    id: 'session_id',
    name: 'Session ID',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.STRING,
    description: 'Unique session identifier',
    required: true
  },
  SESSION_DURATION: {
    id: 'session_duration',
    name: 'Session Duration',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Session duration in seconds'
  },
  PAGE_VIEWS: {
    id: 'page_views',
    name: 'Page Views',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Number of pages viewed in session'
  },
  PAGES_VISITED: {
    id: 'pages_visited',
    name: 'Pages Visited',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.ARRAY,
    description: 'List of pages visited'
  },
  TIME_ON_PAGE: {
    id: 'time_on_page',
    name: 'Time on Page',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.JSON,
    description: 'Time spent on each page'
  },
  BOUNCE_RATE: {
    id: 'bounce_rate',
    name: 'Bounce Rate',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Session bounce rate'
  },
  SCROLL_DEPTH: {
    id: 'scroll_depth',
    name: 'Scroll Depth',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Maximum scroll depth percentage'
  },
  CLICK_EVENTS: {
    id: 'click_events',
    name: 'Click Events',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.ARRAY,
    description: 'All click events in session'
  },
  FORM_INTERACTIONS: {
    id: 'form_interactions',
    name: 'Form Interactions',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.JSON,
    description: 'Form field interactions'
  },
  SEARCH_QUERIES: {
    id: 'search_queries',
    name: 'Search Queries',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.ARRAY,
    description: 'Search queries performed'
  },
  VIDEO_WATCH_TIME: {
    id: 'video_watch_time',
    name: 'Video Watch Time',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Total video watch time'
  },
  DOWNLOAD_EVENTS: {
    id: 'download_events',
    name: 'Download Events',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.ARRAY,
    description: 'Files downloaded'
  },
  SHARE_EVENTS: {
    id: 'share_events',
    name: 'Share Events',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.ARRAY,
    description: 'Content shared'
  },
  NAVIGATION_PATH: {
    id: 'navigation_path',
    name: 'Navigation Path',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.ARRAY,
    description: 'User navigation path through site'
  },
  EXIT_PAGE: {
    id: 'exit_page',
    name: 'Exit Page',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.STRING,
    description: 'Last page before leaving'
  },
  ENTRY_PAGE: {
    id: 'entry_page',
    name: 'Entry Page',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.STRING,
    description: 'First page visited'
  },
  INTERACTION_RATE: {
    id: 'interaction_rate',
    name: 'Interaction Rate',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Rate of user interactions'
  },
  RAGE_CLICKS: {
    id: 'rage_clicks',
    name: 'Rage Clicks',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Number of rage click events'
  },
  DEAD_CLICKS: {
    id: 'dead_clicks',
    name: 'Dead Clicks',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Clicks on non-interactive elements'
  },
  ERROR_ENCOUNTERS: {
    id: 'error_encounters',
    name: 'Error Encounters',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.ARRAY,
    description: 'Errors encountered by user'
  },
  FEATURE_USAGE: {
    id: 'feature_usage',
    name: 'Feature Usage',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.JSON,
    description: 'Features used and frequency'
  },
  API_CALLS: {
    id: 'api_calls',
    name: 'API Calls',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Number of API calls made'
  },
  LOAD_TIME_EVENTS: {
    id: 'load_time_events',
    name: 'Load Time Events',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.JSON,
    description: 'Page load time metrics'
  },
  ENGAGEMENT_SCORE: {
    id: 'engagement_score',
    name: 'Engagement Score',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.NUMBER,
    description: 'Calculated engagement score'
  },
  ACTIVITY_FREQUENCY: {
    id: 'activity_frequency',
    name: 'Activity Frequency',
    category: DataPointCategory.BEHAVIOR,
    type: DataPointType.STRING,
    description: 'Daily, weekly, monthly activity pattern'
  },

  // CONTENT ENGAGEMENT (20 points)
  CONTENT_VIEWS: {
    id: 'content_views',
    name: 'Content Views',
    category: DataPointCategory.CONTENT,
    type: DataPointType.ARRAY,
    description: 'Content pieces viewed'
  },
  CONTENT_ENGAGEMENT_TIME: {
    id: 'content_engagement_time',
    name: 'Content Engagement Time',
    category: DataPointCategory.CONTENT,
    type: DataPointType.JSON,
    description: 'Time spent on each content piece'
  },
  CONTENT_SHARES: {
    id: 'content_shares',
    name: 'Content Shares',
    category: DataPointCategory.CONTENT,
    type: DataPointType.ARRAY,
    description: 'Content shared by user'
  },
  CONTENT_DOWNLOADS: {
    id: 'content_downloads',
    name: 'Content Downloads',
    category: DataPointCategory.CONTENT,
    type: DataPointType.ARRAY,
    description: 'Content downloaded'
  },
  CONTENT_RATINGS: {
    id: 'content_ratings',
    name: 'Content Ratings',
    category: DataPointCategory.CONTENT,
    type: DataPointType.JSON,
    description: 'User ratings for content'
  },
  CONTENT_COMMENTS: {
    id: 'content_comments',
    name: 'Content Comments',
    category: DataPointCategory.CONTENT,
    type: DataPointType.NUMBER,
    description: 'Number of comments made'
  },
  CONTENT_BOOKMARKS: {
    id: 'content_bookmarks',
    name: 'Content Bookmarks',
    category: DataPointCategory.CONTENT,
    type: DataPointType.ARRAY,
    description: 'Bookmarked content'
  },
  CONTENT_COMPLETION_RATE: {
    id: 'content_completion_rate',
    name: 'Content Completion Rate',
    category: DataPointCategory.CONTENT,
    type: DataPointType.NUMBER,
    description: 'Percentage of content completed'
  },
  CONTENT_PREFERENCES: {
    id: 'content_preferences',
    name: 'Content Preferences',
    category: DataPointCategory.CONTENT,
    type: DataPointType.JSON,
    description: 'User content preferences'
  },
  CONTENT_RECOMMENDATIONS_CLICKED: {
    id: 'content_recommendations_clicked',
    name: 'Recommendations Clicked',
    category: DataPointCategory.CONTENT,
    type: DataPointType.ARRAY,
    description: 'Recommended content clicked'
  },
  CONTENT_SEARCH_TERMS: {
    id: 'content_search_terms',
    name: 'Content Search Terms',
    category: DataPointCategory.CONTENT,
    type: DataPointType.ARRAY,
    description: 'Terms searched in content'
  },
  CONTENT_CATEGORIES_VIEWED: {
    id: 'content_categories_viewed',
    name: 'Categories Viewed',
    category: DataPointCategory.CONTENT,
    type: DataPointType.ARRAY,
    description: 'Content categories accessed'
  },
  CONTENT_FORMAT_PREFERENCE: {
    id: 'content_format_preference',
    name: 'Format Preference',
    category: DataPointCategory.CONTENT,
    type: DataPointType.STRING,
    description: 'Preferred content format'
  },
  CONTENT_INTERACTION_DEPTH: {
    id: 'content_interaction_depth',
    name: 'Interaction Depth',
    category: DataPointCategory.CONTENT,
    type: DataPointType.NUMBER,
    description: 'Depth of content interaction'
  },
  CONTENT_RETURN_RATE: {
    id: 'content_return_rate',
    name: 'Content Return Rate',
    category: DataPointCategory.CONTENT,
    type: DataPointType.NUMBER,
    description: 'Rate of returning to content'
  },
  CONTENT_SHARE_CHANNELS: {
    id: 'content_share_channels',
    name: 'Share Channels',
    category: DataPointCategory.CONTENT,
    type: DataPointType.JSON,
    description: 'Channels used for sharing'
  },
  CONTENT_FEEDBACK: {
    id: 'content_feedback',
    name: 'Content Feedback',
    category: DataPointCategory.CONTENT,
    type: DataPointType.JSON,
    description: 'User feedback on content'
  },
  CONTENT_JOURNEY_STAGE: {
    id: 'content_journey_stage',
    name: 'Journey Stage',
    category: DataPointCategory.CONTENT,
    type: DataPointType.STRING,
    description: 'Stage in content journey'
  },
  CONTENT_PERSONALIZATION_SCORE: {
    id: 'content_personalization_score',
    name: 'Personalization Score',
    category: DataPointCategory.CONTENT,
    type: DataPointType.NUMBER,
    description: 'Content personalization effectiveness'
  },
  CONTENT_DISCOVERY_METHOD: {
    id: 'content_discovery_method',
    name: 'Discovery Method',
    category: DataPointCategory.CONTENT,
    type: DataPointType.STRING,
    description: 'How content was discovered'
  },

  // QUIZ INTERACTIONS (25 points)
  QUIZ_ID: {
    id: 'quiz_id',
    name: 'Quiz ID',
    category: DataPointCategory.QUIZ,
    type: DataPointType.STRING,
    description: 'Quiz identifier'
  },
  QUIZ_SESSION_ID: {
    id: 'quiz_session_id',
    name: 'Quiz Session ID',
    category: DataPointCategory.QUIZ,
    type: DataPointType.STRING,
    description: 'Unique quiz session'
  },
  QUIZ_START_TIME: {
    id: 'quiz_start_time',
    name: 'Quiz Start Time',
    category: DataPointCategory.QUIZ,
    type: DataPointType.DATE,
    description: 'When quiz was started'
  },
  QUIZ_COMPLETION_TIME: {
    id: 'quiz_completion_time',
    name: 'Completion Time',
    category: DataPointCategory.QUIZ,
    type: DataPointType.DATE,
    description: 'When quiz was completed'
  },
  QUIZ_DURATION: {
    id: 'quiz_duration',
    name: 'Quiz Duration',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Time to complete quiz'
  },
  QUIZ_SCORE: {
    id: 'quiz_score',
    name: 'Quiz Score',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Final quiz score'
  },
  QUIZ_COMPLETION_RATE: {
    id: 'quiz_completion_rate',
    name: 'Completion Rate',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Percentage completed'
  },
  QUIZ_RESPONSES: {
    id: 'quiz_responses',
    name: 'Quiz Responses',
    category: DataPointCategory.QUIZ,
    type: DataPointType.JSON,
    description: 'All quiz answers'
  },
  QUIZ_ABANDONED_AT: {
    id: 'quiz_abandoned_at',
    name: 'Abandoned At',
    category: DataPointCategory.QUIZ,
    type: DataPointType.STRING,
    description: 'Question where abandoned'
  },
  QUIZ_RETAKE_COUNT: {
    id: 'quiz_retake_count',
    name: 'Retake Count',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Number of quiz retakes'
  },
  QUIZ_PATH: {
    id: 'quiz_path',
    name: 'Quiz Path',
    category: DataPointCategory.QUIZ,
    type: DataPointType.ARRAY,
    description: 'Path through quiz questions'
  },
  QUIZ_SKIP_COUNT: {
    id: 'quiz_skip_count',
    name: 'Skip Count',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Questions skipped'
  },
  QUIZ_BACKTRACK_COUNT: {
    id: 'quiz_backtrack_count',
    name: 'Backtrack Count',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Times went back'
  },
  QUIZ_HESITATION_TIME: {
    id: 'quiz_hesitation_time',
    name: 'Hesitation Time',
    category: DataPointCategory.QUIZ,
    type: DataPointType.JSON,
    description: 'Time spent per question'
  },
  QUIZ_RECOMMENDATION: {
    id: 'quiz_recommendation',
    name: 'Quiz Recommendation',
    category: DataPointCategory.QUIZ,
    type: DataPointType.JSON,
    description: 'Generated recommendations'
  },
  QUIZ_LEAD_QUALITY: {
    id: 'quiz_lead_quality',
    name: 'Lead Quality Score',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Quality score of quiz lead'
  },
  QUIZ_ENGAGEMENT_SCORE: {
    id: 'quiz_engagement_score',
    name: 'Quiz Engagement',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Quiz engagement level'
  },
  QUIZ_CONVERSION: {
    id: 'quiz_conversion',
    name: 'Quiz Conversion',
    category: DataPointCategory.QUIZ,
    type: DataPointType.BOOLEAN,
    description: 'Whether quiz led to conversion'
  },
  QUIZ_FUNNEL_STAGE: {
    id: 'quiz_funnel_stage',
    name: 'Funnel Stage',
    category: DataPointCategory.QUIZ,
    type: DataPointType.STRING,
    description: 'Stage reached in quiz funnel'
  },
  QUIZ_DEVICE_SWITCHES: {
    id: 'quiz_device_switches',
    name: 'Device Switches',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Times switched devices'
  },
  QUIZ_AB_VARIANT: {
    id: 'quiz_ab_variant',
    name: 'A/B Test Variant',
    category: DataPointCategory.QUIZ,
    type: DataPointType.STRING,
    description: 'Which A/B test variant shown'
  },
  QUIZ_PERSONALIZATION: {
    id: 'quiz_personalization',
    name: 'Personalization Data',
    category: DataPointCategory.QUIZ,
    type: DataPointType.JSON,
    description: 'Personalization applied'
  },
  QUIZ_REFERRAL_SOURCE: {
    id: 'quiz_referral_source',
    name: 'Quiz Referral',
    category: DataPointCategory.QUIZ,
    type: DataPointType.STRING,
    description: 'How user found quiz'
  },
  QUIZ_FOLLOWUP_ACTION: {
    id: 'quiz_followup_action',
    name: 'Followup Action',
    category: DataPointCategory.QUIZ,
    type: DataPointType.STRING,
    description: 'Action taken after quiz'
  },
  QUIZ_RESULT_SHARES: {
    id: 'quiz_result_shares',
    name: 'Result Shares',
    category: DataPointCategory.QUIZ,
    type: DataPointType.NUMBER,
    description: 'Times results were shared'
  },

  // PURCHASE JOURNEY (25 points)
  CART_ID: {
    id: 'cart_id',
    name: 'Cart ID',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.STRING,
    description: 'Shopping cart identifier'
  },
  CART_VALUE: {
    id: 'cart_value',
    name: 'Cart Value',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Total cart value'
  },
  CART_ITEMS: {
    id: 'cart_items',
    name: 'Cart Items',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.JSON,
    description: 'Items in cart'
  },
  CART_ABANDONMENT_REASON: {
    id: 'cart_abandonment_reason',
    name: 'Abandonment Reason',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.STRING,
    description: 'Why cart was abandoned'
  },
  PRODUCT_VIEWS: {
    id: 'product_views',
    name: 'Product Views',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.ARRAY,
    description: 'Products viewed'
  },
  PRODUCT_INTERACTIONS: {
    id: 'product_interactions',
    name: 'Product Interactions',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.JSON,
    description: 'Interactions with products'
  },
  WISHLIST_ITEMS: {
    id: 'wishlist_items',
    name: 'Wishlist Items',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.ARRAY,
    description: 'Items saved to wishlist'
  },
  PURCHASE_INTENT_SCORE: {
    id: 'purchase_intent_score',
    name: 'Purchase Intent',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Likelihood to purchase'
  },
  CHECKOUT_STARTED: {
    id: 'checkout_started',
    name: 'Checkout Started',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.BOOLEAN,
    description: 'Whether checkout was initiated'
  },
  CHECKOUT_STEP_REACHED: {
    id: 'checkout_step_reached',
    name: 'Checkout Step',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Furthest checkout step'
  },
  PAYMENT_METHOD: {
    id: 'payment_method',
    name: 'Payment Method',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.STRING,
    description: 'Selected payment method'
  },
  SHIPPING_METHOD: {
    id: 'shipping_method',
    name: 'Shipping Method',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.STRING,
    description: 'Selected shipping method'
  },
  COUPON_USAGE: {
    id: 'coupon_usage',
    name: 'Coupon Usage',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.ARRAY,
    description: 'Coupons applied'
  },
  DISCOUNT_SENSITIVITY: {
    id: 'discount_sensitivity',
    name: 'Discount Sensitivity',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Response to discounts'
  },
  PRICE_COMPARISON_COUNT: {
    id: 'price_comparison_count',
    name: 'Price Comparisons',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Times compared prices'
  },
  REVIEW_INTERACTIONS: {
    id: 'review_interactions',
    name: 'Review Interactions',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.JSON,
    description: 'Interactions with reviews'
  },
  CROSS_SELL_CLICKS: {
    id: 'cross_sell_clicks',
    name: 'Cross-sell Clicks',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Cross-sell items clicked'
  },
  UPSELL_CONVERSIONS: {
    id: 'upsell_conversions',
    name: 'Upsell Conversions',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Upsells accepted'
  },
  RETURN_CUSTOMER: {
    id: 'return_customer',
    name: 'Return Customer',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.BOOLEAN,
    description: 'Has purchased before'
  },
  PURCHASE_FREQUENCY: {
    id: 'purchase_frequency',
    name: 'Purchase Frequency',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.STRING,
    description: 'How often they purchase'
  },
  AVERAGE_ORDER_VALUE: {
    id: 'average_order_value',
    name: 'Average Order Value',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Average purchase amount'
  },
  CATEGORY_AFFINITY: {
    id: 'category_affinity',
    name: 'Category Affinity',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.JSON,
    description: 'Preferred product categories'
  },
  BRAND_LOYALTY: {
    id: 'brand_loyalty',
    name: 'Brand Loyalty',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Brand loyalty score'
  },
  REFERRAL_PURCHASES: {
    id: 'referral_purchases',
    name: 'Referral Purchases',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.NUMBER,
    description: 'Purchases from referrals'
  },
  SUBSCRIPTION_STATUS: {
    id: 'subscription_status',
    name: 'Subscription Status',
    category: DataPointCategory.COMMERCE,
    type: DataPointType.STRING,
    description: 'Current subscription status'
  },

  // DEVICE AND BROWSER DATA (20 points)
  DEVICE_TYPE: {
    id: 'device_type',
    name: 'Device Type',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Desktop, mobile, tablet'
  },
  DEVICE_BRAND: {
    id: 'device_brand',
    name: 'Device Brand',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Device manufacturer'
  },
  DEVICE_MODEL: {
    id: 'device_model',
    name: 'Device Model',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Specific device model'
  },
  OPERATING_SYSTEM: {
    id: 'operating_system',
    name: 'Operating System',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'OS name and version'
  },
  BROWSER_NAME: {
    id: 'browser_name',
    name: 'Browser Name',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Browser being used'
  },
  BROWSER_VERSION: {
    id: 'browser_version',
    name: 'Browser Version',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Browser version number'
  },
  SCREEN_RESOLUTION: {
    id: 'screen_resolution',
    name: 'Screen Resolution',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Display resolution'
  },
  VIEWPORT_SIZE: {
    id: 'viewport_size',
    name: 'Viewport Size',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Browser viewport dimensions'
  },
  CONNECTION_TYPE: {
    id: 'connection_type',
    name: 'Connection Type',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Network connection type'
  },
  CONNECTION_SPEED: {
    id: 'connection_speed',
    name: 'Connection Speed',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Network speed category'
  },
  IP_ADDRESS: {
    id: 'ip_address',
    name: 'IP Address',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'User IP address'
  },
  USER_AGENT: {
    id: 'user_agent',
    name: 'User Agent',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.STRING,
    description: 'Full user agent string'
  },
  COOKIES_ENABLED: {
    id: 'cookies_enabled',
    name: 'Cookies Enabled',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.BOOLEAN,
    description: 'Whether cookies are enabled'
  },
  JAVASCRIPT_ENABLED: {
    id: 'javascript_enabled',
    name: 'JavaScript Enabled',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.BOOLEAN,
    description: 'Whether JS is enabled'
  },
  AD_BLOCKER_DETECTED: {
    id: 'ad_blocker_detected',
    name: 'Ad Blocker',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.BOOLEAN,
    description: 'Ad blocker detected'
  },
  DO_NOT_TRACK: {
    id: 'do_not_track',
    name: 'Do Not Track',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.BOOLEAN,
    description: 'DNT header present'
  },
  TOUCH_SUPPORT: {
    id: 'touch_support',
    name: 'Touch Support',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.BOOLEAN,
    description: 'Device supports touch'
  },
  BATTERY_LEVEL: {
    id: 'battery_level',
    name: 'Battery Level',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.NUMBER,
    description: 'Device battery percentage'
  },
  HARDWARE_CONCURRENCY: {
    id: 'hardware_concurrency',
    name: 'CPU Cores',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.NUMBER,
    description: 'Number of CPU cores'
  },
  DEVICE_MEMORY: {
    id: 'device_memory',
    name: 'Device Memory',
    category: DataPointCategory.TECHNICAL,
    type: DataPointType.NUMBER,
    description: 'Available device memory'
  },

  // GEOGRAPHIC INFORMATION (15 points)
  COUNTRY: {
    id: 'country',
    name: 'Country',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.STRING,
    description: 'User country'
  },
  REGION: {
    id: 'region',
    name: 'Region/State',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.STRING,
    description: 'State or region'
  },
  CITY: {
    id: 'city',
    name: 'City',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.STRING,
    description: 'User city'
  },
  POSTAL_CODE: {
    id: 'postal_code',
    name: 'Postal Code',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.STRING,
    description: 'ZIP or postal code'
  },
  LATITUDE: {
    id: 'latitude',
    name: 'Latitude',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.NUMBER,
    description: 'Geographic latitude'
  },
  LONGITUDE: {
    id: 'longitude',
    name: 'Longitude',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.NUMBER,
    description: 'Geographic longitude'
  },
  METRO_CODE: {
    id: 'metro_code',
    name: 'Metro Code',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.STRING,
    description: 'Metropolitan area code'
  },
  ISP: {
    id: 'isp',
    name: 'ISP',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.STRING,
    description: 'Internet service provider'
  },
  ORGANIZATION: {
    id: 'organization',
    name: 'Organization',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.STRING,
    description: 'Organization from IP'
  },
  DOMAIN: {
    id: 'domain',
    name: 'Domain',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.STRING,
    description: 'Domain from IP'
  },
  GEO_ACCURACY: {
    id: 'geo_accuracy',
    name: 'Geo Accuracy',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.NUMBER,
    description: 'Location accuracy radius'
  },
  WEATHER_CONDITIONS: {
    id: 'weather_conditions',
    name: 'Weather',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.JSON,
    description: 'Local weather data'
  },
  LOCAL_TIME: {
    id: 'local_time',
    name: 'Local Time',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.DATE,
    description: 'User local time'
  },
  CURRENCY_PREFERENCE: {
    id: 'currency_preference',
    name: 'Currency',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.STRING,
    description: 'Preferred currency'
  },
  DISTANCE_FROM_STORE: {
    id: 'distance_from_store',
    name: 'Store Distance',
    category: DataPointCategory.GEOGRAPHIC,
    type: DataPointType.NUMBER,
    description: 'Distance to nearest store'
  },

  // CUSTOM EVENTS (10 points)
  CUSTOM_EVENT_NAME: {
    id: 'custom_event_name',
    name: 'Event Name',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.STRING,
    description: 'Custom event identifier'
  },
  CUSTOM_EVENT_VALUE: {
    id: 'custom_event_value',
    name: 'Event Value',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.JSON,
    description: 'Custom event data'
  },
  CUSTOM_EVENT_TIMESTAMP: {
    id: 'custom_event_timestamp',
    name: 'Event Timestamp',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.DATE,
    description: 'When event occurred'
  },
  CUSTOM_DIMENSION_1: {
    id: 'custom_dimension_1',
    name: 'Custom Dimension 1',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.STRING,
    description: 'User-defined dimension'
  },
  CUSTOM_DIMENSION_2: {
    id: 'custom_dimension_2',
    name: 'Custom Dimension 2',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.STRING,
    description: 'User-defined dimension'
  },
  CUSTOM_DIMENSION_3: {
    id: 'custom_dimension_3',
    name: 'Custom Dimension 3',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.STRING,
    description: 'User-defined dimension'
  },
  CUSTOM_METRIC_1: {
    id: 'custom_metric_1',
    name: 'Custom Metric 1',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.NUMBER,
    description: 'User-defined metric'
  },
  CUSTOM_METRIC_2: {
    id: 'custom_metric_2',
    name: 'Custom Metric 2',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.NUMBER,
    description: 'User-defined metric'
  },
  CUSTOM_METRIC_3: {
    id: 'custom_metric_3',
    name: 'Custom Metric 3',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.NUMBER,
    description: 'User-defined metric'
  },
  EXPERIMENT_VARIANT: {
    id: 'experiment_variant',
    name: 'Experiment Variant',
    category: DataPointCategory.CUSTOM,
    type: DataPointType.STRING,
    description: 'A/B test variant assignment'
  }
};

// Helper function to get data points by category
export function getDataPointsByCategory(category: DataPointCategory): DataPoint[] {
  return Object.values(DATA_POINTS).filter(dp => dp.category === category);
}

// Helper function to get required data points
export function getRequiredDataPoints(): DataPoint[] {
  return Object.values(DATA_POINTS).filter(dp => dp.required === true);
}

// Helper function to validate data point value
export function validateDataPoint(dataPointId: string, value: any): boolean {
  const dataPoint = DATA_POINTS[dataPointId];
  if (!dataPoint) return false;
  
  // Check type
  switch (dataPoint.type) {
    case DataPointType.STRING:
      if (typeof value !== 'string') return false;
      break;
    case DataPointType.NUMBER:
      if (typeof value !== 'number') return false;
      break;
    case DataPointType.BOOLEAN:
      if (typeof value !== 'boolean') return false;
      break;
    case DataPointType.DATE:
      if (!(value instanceof Date) && !Date.parse(value)) return false;
      break;
    case DataPointType.ARRAY:
      if (!Array.isArray(value)) return false;
      break;
    case DataPointType.JSON:
      if (typeof value !== 'object') return false;
      break;
  }
  
  // Run custom validator if exists
  if (dataPoint.validator) {
    return dataPoint.validator(value);
  }
  
  return true;
}

// Helper function to transform data point value
export function transformDataPoint(dataPointId: string, value: any): any {
  const dataPoint = DATA_POINTS[dataPointId];
  if (!dataPoint) return value;
  
  if (dataPoint.transformer) {
    return dataPoint.transformer(value);
  }
  
  return value;
}

// Export the total count for verification
export const TOTAL_DATA_POINTS = Object.keys(DATA_POINTS).length;
console.log(`Total data points defined: ${TOTAL_DATA_POINTS}`);