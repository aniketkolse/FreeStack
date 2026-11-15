export type CategorySlug =
  | 'ai-ml'
  | 'mcp'
  | 'cloud-hosting'
  | 'developer-tools'
  | 'databases-backend'
  | 'learning'
  | 'student-benefits'
  | 'apis-integrations'
  | 'design-creative'
  | 'security-networking'
  | 'productivity-collaboration';

export type PricingModel =
  | 'completely_free'
  | 'free_tier'
  | 'free_credits'
  | 'student_exclusive'
  | 'open_source'
  | 'free_learning_material'
  | 'free_trial'
  | 'freemium';

export type ResourceType =
  | 'software'
  | 'ai_model'
  | 'mcp_server'
  | 'api'
  | 'course'
  | 'book'
  | 'documentation'
  | 'tutorial'
  | 'roadmap'
  | 'dataset'
  | 'cloud_service'
  | 'developer_tool'
  | 'student_benefit'
  | 'practice'
  | 'other';

export type VerificationStatus =
  | 'verified'
  | 'needs_review'
  | 'expired'
  | 'unavailable'
  | 'unverified';

export type RequirementState = 'required' | 'not_required' | 'unknown';

export type ValidityType =
  | 'ongoing'
  | 'fixed_period'
  | 'credit_based'
  | 'trial_period'
  | 'unknown';

export type StudentAccessState =
  | 'eligible'
  | 'exclusive'
  | 'not_eligible'
  | 'unknown';

export type LearningFormat =
  | 'course'
  | 'book'
  | 'documentation'
  | 'tutorial'
  | 'roadmap'
  | 'video'
  | 'practice'
  | 'challenge'
  | 'other';

export type LearningDifficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'all_levels'
  | 'unknown';

export type EvidenceConfidence = 'high' | 'medium' | 'low';

export interface FreeLimit {
  name: string;
  value: string | number | null;
  period: string | null;
}

export interface EvidenceSource {
  id: string;
  url: string;
  source_type:
    | 'official_pricing'
    | 'official_docs'
    | 'official_terms'
    | 'student_page'
    | 'official_repo'
    | 'other';
  checked_at: string;
}

export interface EvidenceClaim {
  source_id: string;
  field_path: string;
  quote: string;
  confidence: EvidenceConfidence;
  notes?: string | null;
}

export interface LearningMetadata {
  format: LearningFormat;
  difficulty: LearningDifficulty;
  topics: string[];
  language: string | null;
}

export interface Offer {
  schema_version: '1.0.0';
  identity: {
    id: string;
    name: string;
    slug: string;
    provider: string;
    logo_url?: string | null;
  };
  classification: {
    category: CategorySlug;
    subcategory: string;
    resource_type: ResourceType;
    pricing_model: PricingModel;
    tags: string[];
  };
  description: string;
  access: {
    free_limits: FreeLimit[];
    requirements: {
      account_required: RequirementState;
      card_required: RequirementState;
      payment_method_notes: string | null;
    };
    validity: {
      type: ValidityType;
      duration: string | null;
      auto_renewal: string | null;
    };
    restrictions: string[];
  };
  eligibility: {
    student_access: StudentAccessState;
    regions: string[];
    conditions: string | null;
  };
  links: {
    official: string;
    signup?: string | null;
    documentation?: string | null;
    pricing?: string | null;
  };
  learning?: LearningMetadata;
  evidence: {
    sources: EvidenceSource[];
    claims: EvidenceClaim[];
  };
  verification: {
    status: VerificationStatus;
    last_verified_at: string | null;
    notes: string | null;
  };
  metadata: {
    created_at: string;
    updated_at: string;
    featured?: boolean;
    contributor?: string | null;
  };
}

export type CategoryColorToken =
  | 'sky-blue'
  | 'grass-green'
  | 'bubblegum-pink'
  | 'tangerine'
  | 'sunshine-yellow'
  | 'daylight';

export interface Subcategory {
  slug: string;
  name: string;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  color: CategoryColorToken;
  popular: boolean;
  subcategories: Subcategory[];
}

export type SortOption =
  | 'relevance'
  | 'use_case'
  | 'context_desc'
  | 'recently_added'
  | 'recently_verified'
  | 'name_asc';

export interface FilterState {
  query: string;
  category: CategorySlug | 'all';
  subcategory: string;
  pricingModels: PricingModel[];
  cardRequired: RequirementState | 'all';
  studentAccess: StudentAccessState | 'all';
  resourceType: ResourceType | 'all';
  region: string;
  verificationStatus: VerificationStatus | 'all';
  sortBy: SortOption;
}

export interface OutdatedReport {
  id: string;
  offerSlug: string | null;
  offerName: string;
  reportType: 'outdated_limit' | 'card_changed' | 'broken_link' | 'new_resource' | 'other';
  details: string;
  sourceUrl: string | null;
  createdAt: string;
}

export interface SourceRegistryEntry {
  id: string;
  name: string;
  domain: string;
  entry_url: string;
  source_type:
    | 'official_pricing'
    | 'official_docs'
    | 'student_page'
    | 'curated_registry'
    | 'official_repo';
  category: CategorySlug;
  crawl_policy: {
    respect_robots_txt: boolean;
    rate_limit_rpm: number;
    max_retries: number;
    primary_fetcher: 'crawl4ai' | 'scrapling' | 'http_head';
  };
  active: boolean;
}

export interface SourceRegistry {
  schema_version: '1.0.0';
  sources: SourceRegistryEntry[];
}

export interface DataQualityReport {
  totalOffers: number;
  totalCategories: number;
  verifiedCount: number;
  needsReviewCount: number;
  unverifiedCount: number;
  expiredCount: number;
  unavailableCount: number;
  noCardCount: number;
  studentExclusiveCount: number;
  learningCount: number;
  totalEvidenceSources: number;
  totalEvidenceClaims: number;
  highConfidenceClaims: number;
  schemaValid: boolean;
  validationErrors: string[];
  latestVerificationDate: string | null;
}

export type ChangeSeverity = 'critical' | 'low_risk';

export interface FieldChange {
  field: string;
  previousValue: unknown;
  nextValue: unknown;
  severity: ChangeSeverity;
  reason: string;
}

export interface ChangeDetectionReport {
  offerId: string;
  slug: string;
  hasChanges: boolean;
  requiresHumanReview: boolean;
  reviewClassification: 'no_change' | 'low_risk_auto_eligible' | 'human_review_required';
  changes: FieldChange[];
}

