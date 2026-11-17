export type LegalJurisdiction = 'india' | 'usa' | 'eu_uk' | 'global';

export type PrivacyRequestType =
  | 'access_summary'
  | 'correction_erasure'
  | 'withdraw_consent'
  | 'do_not_sell_share'
  | 'nominate_representative'
  | 'grievance_redressal'
  | 'data_portability'
  | 'appeal_decision';

export interface JurisdictionSpec {
  id: LegalJurisdiction;
  name: string;
  shortLabel: string;
  primaryLaws: string[];
  authorityName: string;
  authorityUrl: string;
  ackWindowHours: number;
  resolutionDays: number;
  officerTitle: string;
  officerEmail: string;
}

export interface PrivacyRequestInput {
  jurisdiction: LegalJurisdiction;
  requestType: PrivacyRequestType;
  fullName: string;
  email: string;
  stateOrRegion?: string;
  details: string;
  nomineeName?: string;
  nomineeContact?: string;
  verifiedIdentity: boolean;
}

export interface SubmittedPrivacyRequest extends PrivacyRequestInput {
  ticketId: string;
  submittedAt: string;
  ackDueBy: string;
  resolutionDueBy: string;
  applicableLaw: string;
  status: 'received_pending_verification';
}

export const JURISDICTION_SPECS: Record<LegalJurisdiction, JurisdictionSpec> = {
  india: {
    id: 'india',
    name: 'India (DPDP Act 2023 & IT Act 2000)',
    shortLabel: 'India (DPDP / IT Rules)',
    primaryLaws: [
      'Digital Personal Data Protection Act, 2023 (Sections 11–14)',
      'Information Technology Act, 2000 & SPDI Rules, 2011',
      'IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (Rule 3(2))',
      'CERT-In Cybersecurity Directions, 2022',
    ],
    authorityName: 'Data Protection Board of India (DPBI) & MeitY Grievance Appellate Committee',
    authorityUrl: 'https://www.meity.gov.in/',
    ackWindowHours: 24,
    resolutionDays: 15,
    officerTitle: 'Grievance Officer & Data Protection Officer (India)',
    officerEmail: 'aniketkolse07@gmail.com',
  },
  usa: {
    id: 'usa',
    name: 'United States (CCPA/CPRA, VCDPA, CPA, CTDPA, TDPSA)',
    shortLabel: 'United States (CCPA / State Laws)',
    primaryLaws: [
      'California Consumer Privacy Act / California Privacy Rights Act (Cal. Civ. Code § 1798.100 et seq.)',
      'Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA), Texas (TDPSA), Oregon (OCPA), Delaware (DPDPA)',
      'Children’s Online Privacy Protection Act (COPPA, 15 U.S.C. §§ 6501–6506)',
      'FTC Act Section 5 (15 U.S.C. § 45)',
    ],
    authorityName: 'California Privacy Protection Agency (CPPA), State Attorneys General & FTC',
    authorityUrl: 'https://cppa.ca.gov/',
    ackWindowHours: 240, // 10 business days statutory max
    resolutionDays: 45,
    officerTitle: 'US Privacy Compliance Officer',
    officerEmail: 'aniketkolse07@gmail.com',
  },
  eu_uk: {
    id: 'eu_uk',
    name: 'European Economic Area, UK & Switzerland (GDPR / UK GDPR)',
    shortLabel: 'EU / EEA / UK (GDPR)',
    primaryLaws: [
      'EU General Data Protection Regulation (Regulation (EU) 2016/679, Articles 12–22)',
      'UK General Data Protection Regulation & Data Protection Act 2018',
      'Swiss Federal Act on Data Protection (nFADP)',
      'ePrivacy Directive (2002/58/EC)',
    ],
    authorityName: 'European Data Protection Board (EDPB) Supervisory Authorities & UK ICO',
    authorityUrl: 'https://edpb.europa.eu/',
    ackWindowHours: 72,
    resolutionDays: 30,
    officerTitle: 'EU / UK Data Protection Officer (DPO)',
    officerEmail: 'aniketkolse07@gmail.com',
  },
  global: {
    id: 'global',
    name: 'Global / Rest of World (LGPD, PIPEDA, PDPA, APPI, Privacy Act)',
    shortLabel: 'Global (LGPD / PIPEDA / PDPA)',
    primaryLaws: [
      'Brazil General Data Protection Law (LGPD — Law No. 13.709/2018)',
      'Canada Personal Information Protection and Electronic Documents Act (PIPEDA)',
      'Singapore Personal Data Protection Act (PDPA) & Japan Act on the Protection of Personal Information (APPI)',
      'Australia Privacy Act 1988 (Australian Privacy Principles)',
    ],
    authorityName: 'ANPD (Brazil), OPC (Canada), PDPC (Singapore), OAIC (Australia) & Local Regulators',
    authorityUrl: 'https://globalprivacyassembly.org/',
    ackWindowHours: 72,
    resolutionDays: 30,
    officerTitle: 'Global Privacy & Trust Counsel',
    officerEmail: 'aniketkolse07@gmail.com',
  },
};

export const PRIVACY_REQUEST_TYPE_LABELS: Record<
  PrivacyRequestType,
  { title: string; subtitle: string; badge: string }
> = {
  access_summary: {
    title: 'Right to Access / Know Personal Data',
    subtitle: 'Request a summary of personal data processed and processing activities (DPDP Sec. 11 / CCPA § 1798.110 / GDPR Art. 15)',
    badge: 'Access',
  },
  correction_erasure: {
    title: 'Right to Correction, Completion or Erasure (Deletion)',
    subtitle: 'Correct inaccurate data or permanently erase personal data (DPDP Sec. 12 / CCPA § 1798.105 / GDPR Art. 16–17)',
    badge: 'Delete / Correct',
  },
  withdraw_consent: {
    title: 'Right to Withdraw Consent / Restrict Processing',
    subtitle: 'Withdraw previously granted consent or restrict processing (DPDP Sec. 6(4) / GDPR Art. 7(3) & 18)',
    badge: 'Consent',
  },
  do_not_sell_share: {
    title: 'Do Not Sell or Share / Opt-Out of Targeted Processing',
    subtitle: 'Record formal opt-out of sale, sharing, or profiling (CCPA/CPRA § 1798.120 / CPA / VCDPA / GPC)',
    badge: 'US Opt-Out',
  },
  nominate_representative: {
    title: 'Right to Nominate (India DPDP Act Section 14)',
    subtitle: 'Nominate an individual to exercise your Data Principal rights in the event of death or incapacity',
    badge: 'India DPDP Sec. 14',
  },
  grievance_redressal: {
    title: 'Formal Grievance Redressal (India IT Rules & DPDP Sec. 13)',
    subtitle: 'Lodge a formal grievance with the designated Grievance Officer regarding data protection or platform content',
    badge: 'Grievance',
  },
  data_portability: {
    title: 'Right to Data Portability (Machine-Readable Export)',
    subtitle: 'Receive your submitted records in structured, machine-readable JSON format (GDPR Art. 20 / CCPA)',
    badge: 'Export',
  },
  appeal_decision: {
    title: 'Appeal a Prior Privacy Request Decision',
    subtitle: 'Appeal a declined or unresolved privacy request (US State Privacy Laws VCDPA/CPA/CTDPA & DPDP Board escalation)',
    badge: 'Appeal',
  },
};

export function validatePrivacyRequestInput(input: PrivacyRequestInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.push('Please enter your full name (at least 2 characters).');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email.trim())) {
    errors.push('Please enter a valid email address for statutory acknowledgement.');
  }

  if (!input.details || input.details.trim().length < 10) {
    errors.push('Please provide at least 10 characters describing your request or grievance.');
  }

  if (input.requestType === 'nominate_representative') {
    if (!input.nomineeName || input.nomineeName.trim().length < 2) {
      errors.push('Nominee full name is required for a Section 14 DPDP Act nomination request.');
    }
  }

  if (!input.verifiedIdentity) {
    errors.push(
      'You must confirm under penalty of applicable law that you are the Data Principal / Consumer or an authorized representative.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createPrivacyRequestRecord(
  input: PrivacyRequestInput,
  now: Date = new Date()
): SubmittedPrivacyRequest {
  const spec = JURISDICTION_SPECS[input.jurisdiction];
  const prefix =
    input.jurisdiction === 'india'
      ? 'DPDP'
      : input.jurisdiction === 'usa'
      ? 'USPRIV'
      : input.jurisdiction === 'eu_uk'
      ? 'GDPR'
      : 'GLOB';

  const year = now.getUTCFullYear();
  const deterministicHash = Math.abs(
    Array.from(`${input.email.trim()}-${input.requestType}-${now.getTime()}`).reduce(
      (acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0,
      7
    )
  )
    .toString(36)
    .toUpperCase()
    .slice(0, 6)
    .padEnd(6, '0');

  const ackDate = new Date(now.getTime() + spec.ackWindowHours * 60 * 60 * 1000);
  const resDate = new Date(now.getTime() + spec.resolutionDays * 24 * 60 * 60 * 1000);

  return {
    ...input,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    details: input.details.trim(),
    stateOrRegion: input.stateOrRegion?.trim() || undefined,
    nomineeName: input.nomineeName?.trim() || undefined,
    nomineeContact: input.nomineeContact?.trim() || undefined,
    ticketId: `FS-${prefix}-${year}-${deterministicHash}`,
    submittedAt: now.toISOString(),
    ackDueBy: ackDate.toISOString(),
    resolutionDueBy: resDate.toISOString(),
    applicableLaw: spec.primaryLaws[0],
    status: 'received_pending_verification',
  };
}
