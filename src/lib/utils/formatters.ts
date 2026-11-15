import type {
  LearningDifficulty,
  LearningFormat,
  Offer,
  PricingModel,
  RequirementState,
  ResourceType,
  StudentAccessState,
  ValidityType,
  VerificationStatus,
} from '../../types/resource';
import { isSafeHttpsUrl } from '../validation/offerValidator';

export function formatPricingModel(model: PricingModel): string {
  switch (model) {
    case 'completely_free':
      return 'Completely free';
    case 'free_tier':
      return 'Free tier';
    case 'free_credits':
      return 'Free credits';
    case 'student_exclusive':
      return 'Student exclusive';
    case 'open_source':
      return 'Open source';
    case 'free_learning_material':
      return 'Free learning material';
    case 'free_trial':
      return 'Free trial';
    case 'freemium':
      return 'Freemium';
  }
}

export function formatResourceType(type: ResourceType): string {
  switch (type) {
    case 'software':
      return 'Software';
    case 'ai_model':
      return 'AI Model';
    case 'mcp_server':
      return 'MCP Server';
    case 'api':
      return 'API';
    case 'course':
      return 'Course';
    case 'book':
      return 'Book';
    case 'documentation':
      return 'Documentation';
    case 'tutorial':
      return 'Tutorial';
    case 'roadmap':
      return 'Roadmap';
    case 'dataset':
      return 'Dataset';
    case 'cloud_service':
      return 'Cloud Service';
    case 'developer_tool':
      return 'Developer Tool';
    case 'student_benefit':
      return 'Student Benefit';
    case 'practice':
      return 'Practice';
    case 'other':
      return 'Resource';
  }
}

export function formatVerificationStatus(status: VerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'needs_review':
      return 'Needs review';
    case 'expired':
      return 'Expired';
    case 'unavailable':
      return 'Unavailable';
    case 'unverified':
      return 'Unverified';
  }
}

export function formatCardRequirement(state: RequirementState): string {
  switch (state) {
    case 'not_required':
      return 'No credit card required';
    case 'required':
      return 'Credit card required';
    case 'unknown':
      return 'Unknown (card rule)';
  }
}

export function formatAccountRequirement(state: RequirementState): string {
  switch (state) {
    case 'not_required':
      return 'No account needed';
    case 'required':
      return 'Free account required';
    case 'unknown':
      return 'Unknown';
  }
}

export function formatStudentAccess(state: StudentAccessState): string {
  switch (state) {
    case 'exclusive':
      return 'Students only (academic verification required)';
    case 'eligible':
      return 'Open to students and general public';
    case 'not_eligible':
      return 'Not eligible for students';
    case 'unknown':
      return 'Student eligibility unknown';
  }
}

export function formatValidityType(type: ValidityType): string {
  switch (type) {
    case 'ongoing':
      return 'Ongoing / no fixed expiry';
    case 'fixed_period':
      return 'Fixed period (renewable)';
    case 'credit_based':
      return 'Credit-based validity';
    case 'trial_period':
      return 'Time-limited trial';
    case 'unknown':
      return 'Unknown validity';
  }
}

export function formatLearningFormat(format: LearningFormat): string {
  switch (format) {
    case 'course':
      return 'Course';
    case 'book':
      return 'Book';
    case 'documentation':
      return 'Documentation';
    case 'tutorial':
      return 'Tutorial';
    case 'roadmap':
      return 'Roadmap';
    case 'video':
      return 'Video Lectures';
    case 'practice':
      return 'Practice';
    case 'challenge':
      return 'Challenge';
    case 'other':
      return 'Other';
  }
}

export function formatLearningDifficulty(diff: LearningDifficulty): string {
  switch (diff) {
    case 'beginner':
      return 'Beginner';
    case 'intermediate':
      return 'Intermediate';
    case 'advanced':
      return 'Advanced';
    case 'all_levels':
      return 'All levels';
    case 'unknown':
      return 'Level unknown';
  }
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return 'Not yet verified';
  const parsed = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function getPrimaryLimitSummary(offer: Offer): string {
  const first = offer.access.free_limits[0];
  if (!first) return 'Limits not specified';
  if (first.value === null) return `${first.name}: Unknown`;
  return `${first.name}: ${first.value}${first.period ? ` ${first.period}` : ''}`;
}

export function getSafeGoUrl(slug: string, officialUrl: string | null | undefined): string | null {
  if (!isSafeHttpsUrl(officialUrl)) return null;
  return `/go/${encodeURIComponent(slug)}`;
}
