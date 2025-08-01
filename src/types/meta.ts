export interface MetaEvent {
  event: string;
  data?: any;
  timestamp: Date;
  source: 'pixel' | 'capi' | 'simulator';
  testMode?: boolean;
}

export interface MetaEventData {
  content_type?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
  content_name?: string;
  search_string?: string;
  content_category?: string;
  num_items?: number;
  predicted_ltv?: number;
  custom_data?: Record<string, any>;
}

export interface PixelConfig {
  pixelId: string;
  testMode?: boolean;
  externalId?: string;
  email?: string;
  phone?: string;
  limitedDataUse?: boolean;
  dataProcessingOptions?: string[];
  dataProcessingOptionsCountry?: number;
  dataProcessingOptionsState?: number;
}

export interface ConversionsAPIConfig {
  accessToken: string;
  pixelId: string;
  testMode?: boolean;
  testEventCode?: string;
  datasetId?: string;
}

export interface ServerEvent {
  eventName: string;
  eventTime: number;
  eventId: string;
  actionSource?: string;
  userData?: UserData;
  customData?: Record<string, any>;
  eventSourceUrl?: string;
  optOut?: boolean;
  dataProcessingOptions?: string[];
  dataProcessingOptionsCountry?: number;
  dataProcessingOptionsState?: number;
  testMode?: boolean;
}

export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  customerId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook click ID
  fbp?: string; // Facebook browser ID
}

export interface MetaAudience {
  id: string;
  name: string;
  description?: string;
  subtype: 'CUSTOM' | 'LOOKALIKE' | 'WEBSITE' | 'ENGAGEMENT' | 'VIDEO' | 'DYNAMIC';
  approximate_count?: number;
  status: 'Active' | 'Pending' | 'Inactive';
  rule?: string;
  retention_days?: number;
  created_time?: string;
  updated_time?: string;
}

export interface MetaCustomAudience extends MetaAudience {
  subtype: 'CUSTOM';
  customer_file_source?: 'USER_PROVIDED_ONLY' | 'PARTNER_PROVIDED_ONLY' | 'BOTH_USER_AND_PARTNER_PROVIDED';
  delivery_status?: {
    code: number;
    description: string;
  };
  operation_status?: {
    code: number;
    description: string;
  };
}

export interface MetaLookalikeAudience extends MetaAudience {
  subtype: 'LOOKALIKE';
  origin_audience_id: string;
  ratio: number;
  country: string;
  similarity_spec?: {
    country: string;
    ratio: number;
  };
}

export interface MetaWebsiteAudience extends MetaAudience {
  subtype: 'WEBSITE';
  rule: string;
  inclusion_count?: number;
  exclusion_count?: number;
}

export interface MetaEngagementAudience extends MetaAudience {
  subtype: 'ENGAGEMENT';
  engagement_specs: Array<{
    action: string;
    object_id: string;
  }>;
}

export interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  effective_status: string;
  budget_remaining?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  updated_time: string;
  start_time?: string;
  stop_time?: string;
  special_ad_categories?: string[];
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  effective_status: string;
  targeting?: {
    age_min?: number;
    age_max?: number;
    genders?: number[];
    geo_locations?: {
      countries?: string[];
      regions?: Array<{ key: string; name: string }>;
      cities?: Array<{ key: string; name: string; radius: number; distance_unit: string }>;
    };
    interests?: Array<{ id: string; name: string }>;
    behaviors?: Array<{ id: string; name: string }>;
    custom_audiences?: Array<{ id: string; name: string }>;
    excluded_custom_audiences?: Array<{ id: string; name: string }>;
    lookalike_audiences?: Array<{ id: string; name: string }>;
  };
  optimization_goal?: string;
  billing_event?: string;
  bid_amount?: number;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  updated_time: string;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  effective_status: string;
  creative?: {
    id: string;
    name: string;
    object_story_spec?: any;
    image_url?: string;
    video_id?: string;
    body?: string;
    title?: string;
    description?: string;
    call_to_action?: {
      type: string;
      value?: {
        link?: string;
        application?: string;
        page?: string;
      };
    };
  };
  tracking_specs?: Array<{
    action_type: string[];
    fb_pixel?: string[];
  }>;
  created_time: string;
  updated_time: string;
}

export interface MetaInsights {
  account_id?: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  date_start: string;
  date_stop: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  frequency?: string;
  cpm?: string;
  cpc?: string;
  cpp?: string;
  ctr?: string;
  cost_per_action_type?: Array<{
    action_type: string;
    value: string;
  }>;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  conversions?: Array<{
    action_type: string;
    value: string;
  }>;
  conversion_values?: Array<{
    action_type: string;
    value: string;
  }>;
}

export interface MetaPixelEvent {
  id: string;
  pixel_id: string;
  event: string;
  timestamp: string;
  user_data?: {
    em?: string;
    ph?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: Record<string, any>;
  event_source_url?: string;
  action_source: string;
  match_keys?: string[];
}

export interface MetaBusinessAccount {
  id: string;
  name: string;
  primary_page?: {
    id: string;
    name: string;
  };
  timezone_id?: number;
  timezone_name?: string;
  timezone_offset_hours_utc?: number;
  currency?: string;
  account_status?: number;
  disable_reason?: number;
  created_time?: string;
  business?: {
    id: string;
    name: string;
  };
}

export interface MetaIntegrationStatus {
  pixelConnected: boolean;
  capiConnected: boolean;
  testMode: boolean;
  lastEventTime?: string;
  eventsToday: number;
  audienceCount: number;
  campaignCount: number;
  errors: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export interface MetaEventDeduplication {
  eventId: string;
  sources: Array<'pixel' | 'capi'>;
  timestamps: Record<string, number>;
  deduplicated: boolean;
  primarySource?: 'pixel' | 'capi';
}