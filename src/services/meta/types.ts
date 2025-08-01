// Type definitions for Meta tracking services

export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string;
}

export interface EventData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
  search_string?: string;
  status?: string;
  [key: string]: any;
}

export interface CustomData {
  [key: string]: any;
}

export interface ServerEvent {
  event_name: string;
  event_time: number;
  event_id?: string;
  event_source_url?: string;
  action_source: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  user_data?: UserData;
  custom_data?: CustomData;
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
}

export interface BatchRequest {
  data: ServerEvent[];
  test_event_code?: string;
}

export interface ConversionAPIConfig {
  accessToken: string;
  pixelId: string;
  testMode: boolean;
  testEventCode?: string;
  debug?: boolean;
  batchSize?: number;
  batchDelay?: number;
  maxRetries?: number;
}

export interface EventMatchResult {
  clientEventId: string;
  serverEventId: string;
  timestamp: number;
  matched: boolean;
}

export interface MatchQualityScore {
  overall: number;
  fields: {
    email?: number;
    phone?: number;
    firstName?: number;
    lastName?: number;
    dateOfBirth?: number;
    gender?: number;
    city?: number;
    state?: number;
    zip?: number;
    country?: number;
    externalId?: number;
  };
}

export interface EnrichedUserData extends UserData {
  matchQuality?: MatchQualityScore;
  hashedData?: Record<string, string>;
}