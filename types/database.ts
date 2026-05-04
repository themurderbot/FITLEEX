// Auto-mirrors the Supabase PostgreSQL schema (001_schema.sql)
// Run `npx supabase gen types typescript` to regenerate from live DB.

export type UserRole       = 'subscriber' | 'trainer' | 'admin'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type DocType        = 'id' | 'cert' | 'photo'
export type SubStatus      = 'pending' | 'active' | 'expiring' | 'expired' | 'cancelled'
export type PaymentMethod  = 'tap' | 'tabby' | 'tamara'
export type PaymentStatus  = 'pending' | 'completed' | 'failed' | 'refunded'
export type ReportType     = 'harassment' | 'spam' | 'other'
export type ReportStatus   = 'pending' | 'reviewed' | 'dismissed'
export type MuscleGroup    = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'glutes' | 'core' | 'cardio' | 'full_body'

// ─── Row types (what comes back from SELECT) ──────────────────

export interface Profile {
  id:         string
  role:       UserRole
  full_name:  string
  avatar_url: string | null
  phone:      string | null
  country:    string
  language:   'ar' | 'en'
  created_at: string
  updated_at: string
}

export interface Trainer {
  id:                string
  profile_id:        string
  specialty:         string | null
  bio:               string | null
  bio_ar:            string | null
  years_experience:  number
  approval_status:   ApprovalStatus
  rejection_reason:  string | null
  commission_rate:   number
  rating:            number | null
  rating_count:      number
  subscribers_count: number
  is_featured:       boolean
  created_at:        string
  updated_at:        string
}

export interface TrainerWithProfile extends Trainer {
  profiles: Profile
}

export interface TrainerDocument {
  id:          string
  trainer_id:  string
  type:        DocType
  url:         string
  verified:    boolean
  verified_by: string | null
  verified_at: string | null
  created_at:  string
}

export interface TrainerPlan {
  id:             string
  trainer_id:     string
  name:           string
  name_ar:        string | null
  description:    string | null
  description_ar: string | null
  duration_days:  number
  price:          number
  currency:       string
  active:         boolean
  created_at:     string
  updated_at:     string
}

export interface Subscription {
  id:             string
  subscriber_id:  string
  trainer_id:     string
  plan_id:        string
  status:         SubStatus
  payment_method: PaymentMethod | null
  promo_code_id:  string | null
  start_date:     string | null
  end_date:       string | null
  created_at:     string
  updated_at:     string
}

export interface SubscriptionWithRelations extends Subscription {
  profiles:      Profile
  trainers:      TrainerWithProfile
  trainer_plans: TrainerPlan
}

export interface WorkoutPlan {
  id:              string
  subscription_id: string
  trainer_id:      string
  week_number:     number
  notes:           string | null
  created_at:      string
  updated_at:      string
}

export interface WorkoutDay {
  id:              string
  workout_plan_id: string
  day_number:      number
  label:           string | null
}

export interface Exercise {
  id:             string
  workout_day_id: string
  name:           string
  name_ar:        string | null
  sets:           number | null
  reps:           string | null
  rest_seconds:   number | null
  video_url:      string | null
  video_id:       string | null
  sort_order:     number
}

export interface NutritionPlan {
  id:              string
  subscription_id: string
  trainer_id:      string
  notes:           string | null
  created_at:      string
  updated_at:      string
}

export interface Meal {
  id:                string
  nutrition_plan_id: string
  meal_time:         string
  name:              string
  name_ar:           string | null
  kcal:              number | null
  protein_g:         number | null
  carbs_g:           number | null
  fat_g:             number | null
  sort_order:        number
}

export interface ExerciseVideo {
  id:               string
  title:            string
  title_ar:         string | null
  muscle_group:     MuscleGroup
  url:              string
  thumbnail_url:    string | null
  duration_seconds: number | null
  uploaded_by:      string | null
  created_at:       string
}

export interface ProgressSubmission {
  id:              string
  subscription_id: string
  subscriber_id:   string
  week_number:     number
  weight_kg:       number | null
  photos:          string[]
  notes:           string | null
  reviewed:        boolean
  submitted_at:    string
}

export interface TrainerFeedback {
  id:            string
  submission_id: string
  trainer_id:    string
  message:       string
  created_at:    string
}

export interface Conversation {
  id:              string
  subscriber_id:   string
  trainer_id:      string
  last_message_at: string | null
  created_at:      string
}

export interface Message {
  id:              string
  conversation_id: string
  sender_id:       string
  content:         string
  read:            boolean
  created_at:      string
}

export interface Payment {
  id:              string
  subscription_id: string
  amount:          number
  currency:        string
  method:          PaymentMethod
  status:          PaymentStatus
  external_ref:    string | null
  installments:    number | null
  metadata:        Record<string, unknown> | null
  created_at:      string
  updated_at:      string
}

export interface PromoCode {
  id:           string
  trainer_id:   string
  code:         string
  discount_pct: number
  max_uses:     number | null
  uses_count:   number
  expires_at:   string | null
  active:       boolean
  created_at:   string
}

export interface Report {
  id:          string
  reporter_id: string
  reported_id: string
  type:        ReportType
  description: string
  status:      ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at:  string
}

export interface PlatformSetting {
  key:         string
  value:       string
  description: string | null
  updated_by:  string | null
  updated_at:  string
}

// ─── View types ───────────────────────────────────────────────

export interface TrainerEarningsSummary {
  trainer_id:       string
  profile_id:       string
  trainer_name:     string
  total_subscriptions: number
  gross_revenue:    number
  trainer_revenue:  number
  platform_revenue: number
}

export interface SubscriberStats {
  subscription_id:    string
  subscriber_id:      string
  full_name:          string
  avatar_url:         string | null
  trainer_id:         string
  status:             SubStatus
  start_date:         string | null
  end_date:           string | null
  days_remaining:     number | null
  total_submissions:  number
  last_submission_at: string | null
  latest_weight_kg:   number | null
}

// ─── Database helper type (for typed Supabase client) ─────────

export interface Database {
  public: {
    Tables: {
      profiles:              { Row: Profile;             Insert: Omit<Profile, 'created_at' | 'updated_at'>;             Update: Partial<Profile> }
      trainers:              { Row: Trainer;             Insert: Omit<Trainer, 'id' | 'created_at' | 'updated_at'>;      Update: Partial<Trainer> }
      trainer_documents:     { Row: TrainerDocument;     Insert: Omit<TrainerDocument, 'id' | 'created_at'>;             Update: Partial<TrainerDocument> }
      trainer_plans:         { Row: TrainerPlan;         Insert: Omit<TrainerPlan, 'id' | 'created_at' | 'updated_at'>; Update: Partial<TrainerPlan> }
      subscriptions:         { Row: Subscription;        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Subscription> }
      workout_plans:         { Row: WorkoutPlan;         Insert: Omit<WorkoutPlan, 'id' | 'created_at' | 'updated_at'>; Update: Partial<WorkoutPlan> }
      workout_days:          { Row: WorkoutDay;          Insert: Omit<WorkoutDay, 'id'>;                                 Update: Partial<WorkoutDay> }
      exercises:             { Row: Exercise;            Insert: Omit<Exercise, 'id'>;                                   Update: Partial<Exercise> }
      nutrition_plans:       { Row: NutritionPlan;       Insert: Omit<NutritionPlan, 'id' | 'created_at' | 'updated_at'>; Update: Partial<NutritionPlan> }
      meals:                 { Row: Meal;                Insert: Omit<Meal, 'id'>;                                       Update: Partial<Meal> }
      exercise_videos:       { Row: ExerciseVideo;       Insert: Omit<ExerciseVideo, 'id' | 'created_at'>;              Update: Partial<ExerciseVideo> }
      progress_submissions:  { Row: ProgressSubmission;  Insert: Omit<ProgressSubmission, 'id' | 'submitted_at'>;       Update: Partial<ProgressSubmission> }
      trainer_feedback:      { Row: TrainerFeedback;     Insert: Omit<TrainerFeedback, 'id' | 'created_at'>;            Update: Partial<TrainerFeedback> }
      conversations:         { Row: Conversation;        Insert: Omit<Conversation, 'id' | 'created_at'>;               Update: Partial<Conversation> }
      messages:              { Row: Message;             Insert: Omit<Message, 'id' | 'created_at'>;                    Update: Partial<Message> }
      payments:              { Row: Payment;             Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;     Update: Partial<Payment> }
      promo_codes:           { Row: PromoCode;           Insert: Omit<PromoCode, 'id' | 'created_at'>;                  Update: Partial<PromoCode> }
      reports:               { Row: Report;              Insert: Omit<Report, 'id' | 'created_at'>;                     Update: Partial<Report> }
      platform_settings:     { Row: PlatformSetting;     Insert: PlatformSetting;                                       Update: Partial<PlatformSetting> }
    }
    Views: {
      trainer_earnings_summary: { Row: TrainerEarningsSummary }
      subscriber_stats:         { Row: SubscriberStats }
    }
    Functions: {
      current_user_role:            { Args: Record<never, never>;                                              Returns: UserRole }
      my_trainer_id:                { Args: Record<never, never>;                                              Returns: string | null }
      has_active_subscription:      { Args: { p_trainer_id: string };                                         Returns: boolean }
      apply_promo_code:             { Args: { p_code: string; p_trainer_id: string; p_price: number };        Returns: number }
      refresh_subscription_statuses:{ Args: Record<never, never>;                                              Returns: void }
      unread_message_count:         { Args: { p_user_id: string };                                            Returns: number }
      admin_review_trainer:         { Args: { p_trainer_id: string; p_decision: ApprovalStatus; p_rejection_reason?: string }; Returns: void }
    }
    Enums: {
      user_role:       UserRole
      approval_status: ApprovalStatus
      doc_type:        DocType
      sub_status:      SubStatus
      payment_method:  PaymentMethod
      payment_status:  PaymentStatus
      report_type:     ReportType
      report_status:   ReportStatus
      muscle_group:    MuscleGroup
    }
  }
}
