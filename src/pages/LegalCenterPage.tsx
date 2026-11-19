import React, { useEffect, useState } from 'react';
import {
  Home,
  ShieldCheck,
  Scale,
  FileText,
  Globe,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Send,
  Lock,
  Building2,
  Clock,
  UserCheck,
  Gavel,
} from 'lucide-react';
import {
  createPrivacyRequestRecord,
  JURISDICTION_SPECS,
  PRIVACY_REQUEST_TYPE_LABELS,
  validatePrivacyRequestInput,
  type LegalJurisdiction,
  type PrivacyRequestType,
  type SubmittedPrivacyRequest,
} from '../lib/legal/privacyRequests';
import { formatDate } from '../lib/utils/formatters';
import type { NavigateOptions } from '../lib/router/useRouter';
import { FilterDropdown } from '../components/ui/FilterDropdown';

export type LegalTab = 'privacy' | 'privacy-requests' | 'terms';

interface LegalCenterPageProps {
  activeTab: LegalTab;
  onNavigate: (path: string, options?: NavigateOptions) => void;
}

const STORAGE_KEY_REQUESTS = 'freestack-privacy-requests-v1';

const KNOWN_LOCAL_KEYS = [
  {
    key: 'freestack-theme',
    storage: 'localStorage',
    purpose: 'Stores your explicit Light / Dark mode preference on your device only.',
    category: 'Strictly Necessary UI Preference',
  },
  {
    key: 'freestack-saved-offers-v1',
    storage: 'localStorage',
    purpose: 'Stores your bookmarked offer slugs locally in your browser (capped at 500 slugs).',
    category: 'Client-Side Bookmarks',
  },
  {
    key: 'freestack-reports-v1',
    storage: 'localStorage',
    purpose: 'Stores community correction or resource suggestion drafts submitted from your browser.',
    category: 'User-Initiated Submission',
  },
  {
    key: 'freestack-privacy-requests-v1',
    storage: 'localStorage',
    purpose: 'Stores your local Privacy Request / Grievance receipts on your device for your reference.',
    category: 'Local Receipt Log',
  },
];

export function LegalCenterPage({ activeTab, onNavigate }: LegalCenterPageProps) {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<LegalJurisdiction>('india');
  const [requestType, setRequestType] = useState<PrivacyRequestType>('access_summary');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [stateOrRegion, setStateOrRegion] = useState('');
  const [details, setDetails] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeContact, setNomineeContact] = useState('');
  const [verifiedIdentity, setVerifiedIdentity] = useState(false);
  const [gpcOptOutActive, setGpcOptOutActive] = useState<boolean>(true);

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [latestTicket, setLatestTicket] = useState<SubmittedPrivacyRequest | null>(null);
  const [submittedRequests, setSubmittedRequests] = useState<SubmittedPrivacyRequest[]>([]);
  const [localStorageSnapshot, setLocalStorageSnapshot] = useState<
    Array<{ key: string; present: boolean; valuePreview: string }>
  >([]);
  const [purgedNotice, setPurgedNotice] = useState(false);

  const refreshLocalSnapshot = () => {
    if (typeof window === 'undefined') return;
    const snap = KNOWN_LOCAL_KEYS.map((item) => {
      try {
        const store =
          item.storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
        const val = store.getItem(item.key);
        return {
          key: item.key,
          present: val !== null,
          valuePreview: val ? (val.length > 48 ? `${val.slice(0, 48)}…` : val) : 'Not set',
        };
      } catch {
        return { key: item.key, present: false, valuePreview: 'Unavailable' };
      }
    });
    setLocalStorageSnapshot(snap);

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSubmittedRequests(parsed);
      } else {
        setSubmittedRequests([]);
      }
    } catch {
      setSubmittedRequests([]);
    }
  };

  useEffect(() => {
    refreshLocalSnapshot();
  }, [activeTab]);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setPurgedNotice(false);
    const validation = validatePrivacyRequestInput({
      jurisdiction: selectedJurisdiction,
      requestType,
      fullName,
      email,
      stateOrRegion,
      details,
      nomineeName,
      nomineeContact,
      verifiedIdentity,
    });

    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors([]);
    const record = createPrivacyRequestRecord({
      jurisdiction: selectedJurisdiction,
      requestType,
      fullName,
      email,
      stateOrRegion,
      details,
      nomineeName,
      nomineeContact,
      verifiedIdentity,
    });

    const nextList = [record, ...submittedRequests];
    setSubmittedRequests(nextList);
    setLatestTicket(record);
    try {
      window.localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(nextList));
    } catch {
      // ignore storage quota errors
    }
    setDetails('');
    refreshLocalSnapshot();
  };

  const handlePurgeAllLocalData = () => {
    try {
      for (const item of KNOWN_LOCAL_KEYS) {
        window.localStorage.removeItem(item.key);
        window.sessionStorage.removeItem(item.key);
      }
    } catch {
      // ignore
    }
    setSubmittedRequests([]);
    setLatestTicket(null);
    setPurgedNotice(true);
    refreshLocalSnapshot();
  };

  const handleExportPortabilityJson = () => {
    const payload = {
      platform: 'FreeStack Public Directory',
      exportedAt: new Date().toISOString(),
      complianceFrameworks: [
        'India Digital Personal Data Protection Act (DPDP Act) 2023',
        'US CCPA / CPRA & State Privacy Laws',
        'EU / UK GDPR Article 20 Data Portability',
      ],
      localBrowserKeys: localStorageSnapshot,
      submittedPrivacyRequests: submittedRequests,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freestack-privacy-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentSpec = JURISDICTION_SPECS[selectedJurisdiction];

  const headerSlabColor =
    activeTab === 'privacy'
      ? 'bg-sky-blue'
      : activeTab === 'privacy-requests'
      ? 'bg-grass-green'
      : 'bg-sunshine-yellow';

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-14 flex flex-col gap-5 sm:gap-7">
      {/* Header Slab with Home Option & Legal Section Switcher */}
      <section
        className={`${headerSlabColor} rounded-[22px] sm:rounded-[26px] p-4 sm:p-7 md:p-8 flex flex-col items-center text-center gap-3`}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[13px] rounded-full px-3.5 py-1.5 min-h-[32px] inline-flex items-center gap-1.5 spring-pill"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Home</span>
          </a>
          <span className="bg-paper/85 text-midnight-mouth font-[var(--font-mono)] font-semibold text-[11.5px] rounded-full px-3 py-1">
            Effective: November 17, 2026 · Privacy &amp; Legal Transparency Center
          </span>
        </div>

        <h1 className="font-[var(--font-wallop)] font-extrabold text-[26px] sm:text-[36px] lg:text-[44px] leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
          {activeTab === 'privacy' && 'Privacy Policy & Global Data Protection'}
          {activeTab === 'privacy-requests' && 'Privacy Requests & Grievance Redressal Center'}
          {activeTab === 'terms' && 'Terms of Service & Global Legal Terms'}
        </h1>

        <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[15px] leading-[1.45] text-ink max-w-2xl">
          {activeTab === 'privacy' &&
            'Designed to support user privacy rights under India’s Digital Personal Data Protection Act (DPDP Act, 2023) & IT Act 2000, United States Federal & State Privacy Laws (CCPA/CPRA, VCDPA, CPA, CTDPA, TDPSA, COPPA), EU/UK GDPR, Brazil LGPD, and Canada PIPEDA. Informational template — operators should review with qualified legal counsel.'}
          {activeTab === 'privacy-requests' &&
            'Inspect, export, or erase your local browser storage in one click, or generate a structured Privacy Request receipt to email directly to the site operator.'}
          {activeTab === 'terms' &&
            'Terms of Service governing public use of the FreeStack informational directory, source citations, community correction submissions, and third-party outbound links.'}
        </p>

        {/* Top Legal Section Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Legal and compliance pages"
          className="mt-1 inline-flex flex-wrap items-center justify-center bg-paper p-1.5 rounded-full border border-midnight-mouth/10 gap-1"
        >
          {[
            { id: 'privacy', label: 'Privacy Policy', path: '/privacy', icon: ShieldCheck },
            {
              id: 'privacy-requests',
              label: 'Privacy Requests & Grievance',
              path: '/privacy-requests',
              icon: UserCheck,
            },
            { id: 'terms', label: 'Terms of Service', path: '/terms', icon: Scale },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={tab.path}
                role="tab"
                aria-selected={active}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(tab.path);
                }}
                className={`inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[13.5px] rounded-full px-4 py-2 min-h-[36px] filter-pill ${
                  active
                    ? 'bg-midnight-mouth text-daylight shadow-xs'
                    : 'text-midnight-mouth hover:bg-sunshine-yellow/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Interactive Jurisdiction Compliance Bar */}
      <section
        aria-label="Jurisdiction compliance overview"
        className="bg-daylight rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 flex flex-col gap-3.5 border border-midnight-mouth/8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-midnight-mouth" aria-hidden="true" />
            <h2 className="font-[var(--font-wallop)] font-bold text-[15px] sm:text-[16px] text-midnight-mouth">
              Select Jurisdiction Framework (India, USA, EU/UK &amp; Global)
            </h2>
          </div>
          <span className="font-[var(--font-mono)] text-[11.5px] text-ink/75 bg-paper px-3 py-1 rounded-full">
            Statutory SLA: {currentSpec.ackWindowHours}h Ack · {currentSpec.resolutionDays}d Resolution
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {(Object.keys(JURISDICTION_SPECS) as LegalJurisdiction[]).map((key) => {
            const spec = JURISDICTION_SPECS[key];
            const active = selectedJurisdiction === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedJurisdiction(key)}
                className={`rounded-[14px] p-3 text-left flex flex-col justify-between gap-1.5 filter-pill cursor-pointer border ${
                  active
                    ? 'bg-midnight-mouth text-daylight border-midnight-mouth shadow-xs'
                    : 'bg-paper text-midnight-mouth border-midnight-mouth/8 hover:bg-sunshine-yellow/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-[var(--font-wallop)] font-bold text-[13px]">
                    {spec.shortLabel}
                  </span>
                  {active && (
                    <span className="bg-grass-green text-[#101014] text-[10.5px] font-[var(--font-wallop)] font-bold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <span className="font-[var(--font-inter)] text-[11.5px] opacity-80 line-clamp-2">
                  {spec.primaryLaws[0]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-paper rounded-[16px] p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border border-midnight-mouth/6">
          <div>
            <span className="font-[var(--font-wallop)] font-semibold text-[11.5px] uppercase tracking-wider text-ink/65">
              Designated Compliance Officer
            </span>
            <p className="font-[var(--font-wallop)] font-bold text-[13.5px] text-midnight-mouth mt-0.5">
              {currentSpec.officerTitle}
            </p>
            <p className="font-[var(--font-mono)] text-[12px] text-ink/85 mt-0.5">
              {currentSpec.officerEmail}
            </p>
          </div>
          <div>
            <span className="font-[var(--font-wallop)] font-semibold text-[11.5px] uppercase tracking-wider text-ink/65">
              Primary Enacted Statutes Covered
            </span>
            <ul className="font-[var(--font-inter)] text-[12px] text-ink/90 mt-0.5 list-disc pl-4 space-y-0.5">
              {currentSpec.primaryLaws.slice(0, 2).map((law) => (
                <li key={law}>{law}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-[var(--font-wallop)] font-semibold text-[11.5px] uppercase tracking-wider text-ink/65">
              Supervisory / Appellate Authority
            </span>
            <p className="font-[var(--font-inter)] font-medium text-[12.5px] text-midnight-mouth mt-0.5">
              {currentSpec.authorityName}
            </p>
            <p className="font-[var(--font-inter)] text-[11.5px] text-ink/75 mt-0.5">
              Acknowledgement within {currentSpec.ackWindowHours} hours; full resolution within{' '}
              {currentSpec.resolutionDays} calendar days.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          TAB 1: PRIVACY POLICY (/privacy)
         ===================================================================== */}
      {activeTab === 'privacy' && (
        <div
          data-testid="privacy-policy-content"
          className="flex flex-col gap-5 card-enter"
        >
          {/* Key Privacy Highlights */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            {[
              {
                title: 'Zero Accounts or Cookies',
                desc: 'Browse all 7,880+ developer offers, quotas, and source citations publicly without creating an account, setting cookies, or providing personal identifiers.',
              },
              {
                title: 'Zero Third-Party Trackers',
                desc: 'Fonts and provider logos are self-hosted on this origin. FreeStack makes zero browser requests to Google Fonts, remote favicon CDNs, or ad networks.',
              },
              {
                title: 'Transparent Server Queue',
                desc: 'Voluntary community reports (POST /api/reports) store only the submitted offer name, report category, factual details, and source URL in a maintainer review queue.',
              },
              {
                title: 'Standard Edge Access Logs',
                desc: 'Our hosting infrastructure and reverse proxy process standard transient HTTP request metadata (IP address, User-Agent, rate-limit counters) strictly for security and abuse prevention.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-daylight rounded-[18px] p-4 flex flex-col gap-1.5 border border-midnight-mouth/6"
              >
                <h3 className="font-[var(--font-wallop)] font-bold text-[15px] text-midnight-mouth">
                  {card.title}
                </h3>
                <p className="font-[var(--font-inter)] text-[13px] leading-[1.45] text-ink/85">
                  {card.desc}
                </p>
              </div>
            ))}
          </section>

          {/* Detailed Clauses */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* 1. India Specific Privacy Notice */}
              <article className="bg-daylight rounded-[20px] p-5 sm:p-6 flex flex-col gap-3 border border-midnight-mouth/8">
                <div className="flex items-center gap-2">
                  <span className="bg-tangerine text-[#101014] font-[var(--font-wallop)] font-bold text-[11.5px] px-2.5 py-0.5 rounded-full">
                    INDIA LAW
                  </span>
                  <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                    1. India Compliance: DPDP Act, 2023 &amp; IT Act, 2000
                  </h2>
                </div>
                <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.55] text-ink/90">
                  For users located in the Republic of India, FreeStack acts as a <strong>Data Fiduciary</strong> under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> only to the limited extent you voluntarily submit personal data (such as your name or email address in a community correction report or a Privacy Request). We also comply with the <strong>Information Technology Act, 2000</strong>, the <strong>IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules)</strong>, the <strong>IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, and applicable <strong>CERT-In Directions (2022)</strong>.
                </p>
                <div className="bg-paper rounded-[14px] p-4 flex flex-col gap-2">
                  <h3 className="font-[var(--font-wallop)] font-bold text-[14.5px] text-midnight-mouth">
                    Your Statutory Rights as a Data Principal in India (Sections 11–14, DPDP Act 2023):
                  </h3>
                  <ul className="font-[var(--font-inter)] text-[13px] leading-[1.5] text-ink list-disc pl-5 space-y-1">
                    <li>
                      <strong>Right to Access Information (Section 11):</strong> Obtain a summary of personal data being processed, the processing activities undertaken, and the identities of any Data Processors.
                    </li>
                    <li>
                      <strong>Right to Correction &amp; Erasure (Section 12):</strong> Request correction of inaccurate or misleading personal data, completion of incomplete data, updating of data, and erasure of personal data no longer necessary for the specified purpose.
                    </li>
                    <li>
                      <strong>Right of Grievance Redressal (Section 13 &amp; IT Rules Rule 3(2)):</strong> Have any complaint acknowledged within <strong>24 hours</strong> and resolved within <strong>15 days</strong> by our designated India Grievance Officer. You must exhaust this grievance redressal mechanism before approaching the <strong>Data Protection Board of India (DPBI)</strong>.
                    </li>
                    <li>
                      <strong>Right to Nominate (Section 14):</strong> Nominate any other individual who shall, in the event of your death or incapacity, exercise your rights under the DPDP Act.
                    </li>
                    <li>
                      <strong>Notice in English &amp; 22 Eighth Schedule Indian Languages (Section 5(3)):</strong> Upon request via our Privacy Requests portal, statutory notices and summaries are made available in English and Constitutionally recognized Indian languages.
                    </li>
                  </ul>
                </div>
              </article>

              {/* 2. United States Privacy Notice */}
              <article className="bg-daylight rounded-[20px] p-5 sm:p-6 flex flex-col gap-3 border border-midnight-mouth/8">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-blue text-[#101014] font-[var(--font-wallop)] font-bold text-[11.5px] px-2.5 py-0.5 rounded-full">
                    USA FEDERAL &amp; STATE LAW
                  </span>
                  <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                    2. United States Compliance: CCPA/CPRA, VCDPA, CPA, CTDPA, TDPSA &amp; COPPA
                  </h2>
                </div>
                <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.55] text-ink/90">
                  For residents of the United States—including California (<strong>CCPA / CPRA</strong>, Cal. Civ. Code § 1798.100 et seq.), Virginia (<strong>VCDPA</strong>), Colorado (<strong>CPA</strong>), Connecticut (<strong>CTDPA</strong>), Utah (<strong>UCPA</strong>), Texas (<strong>TDPSA</strong>), Oregon (<strong>OCPA</strong>), Delaware (<strong>DPDPA</strong>), and all other US states—FreeStack provides full statutory privacy disclosures and rights to every US user regardless of state residency.
                </p>
                <div className="bg-paper rounded-[14px] p-4 flex flex-col gap-2">
                  <h3 className="font-[var(--font-wallop)] font-bold text-[14.5px] text-midnight-mouth">
                    Your US Consumer Privacy Rights &amp; “Notice at Collection”:
                  </h3>
                  <ul className="font-[var(--font-inter)] text-[13px] leading-[1.5] text-ink list-disc pl-5 space-y-1">
                    <li>
                      <strong>Categories of Personal Information Collected in Last 12 Months:</strong> Zero passive personal identifiers required for browsing. Only voluntary contact information (name, email) if you explicitly submit a Privacy Request or community report.
                    </li>
                    <li>
                      <strong>No Sale or Sharing of Personal Information:</strong> FreeStack <strong>does not sell</strong> your personal information for monetary or other valuable consideration and <strong>does not share</strong> your personal information for cross-context behavioral advertising.
                    </li>
                    <li>
                      <strong>Right to Know, Access, Correct &amp; Delete:</strong> Request disclosure of specific pieces of personal information collected, correction of inaccuracies, or permanent deletion within 45 days.
                    </li>
                    <li>
                      <strong>Right to Non-Discrimination &amp; Right to Appeal:</strong> Exercising your privacy rights will never affect your access to FreeStack. If we decline to take action on a request, you may appeal within 45 days via our Privacy Requests center; if an appeal is denied, we provide direct links to your State Attorney General.
                    </li>
                    <li>
                      <strong>COPPA Compliance (15 U.S.C. §§ 6501–6506):</strong> FreeStack does not knowingly collect personal information from children under 13 years of age.
                    </li>
                  </ul>
                </div>
              </article>

              {/* 3. EU/EEA, UK & Global Privacy Notice */}
              <article className="bg-daylight rounded-[20px] p-5 sm:p-6 flex flex-col gap-3 border border-midnight-mouth/8">
                <div className="flex items-center gap-2">
                  <span className="bg-grass-green text-[#101014] font-[var(--font-wallop)] font-bold text-[11.5px] px-2.5 py-0.5 rounded-full">
                    EU / UK / GLOBAL LAW
                  </span>
                  <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                    3. European Union (GDPR), UK GDPR, Brazil (LGPD), Canada (PIPEDA) &amp; Global Laws
                  </h2>
                </div>
                <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.55] text-ink/90">
                  For visitors in the European Economic Area (EEA), the United Kingdom, Switzerland, Brazil, Canada, Singapore, Japan, Australia, and all other international jurisdictions:
                </p>
                <ul className="font-[var(--font-inter)] text-[13px] leading-[1.5] text-ink list-disc pl-5 space-y-1">
                  <li>
                    <strong>Lawful Basis (GDPR Art. 6):</strong> Public directory delivery relies on Legitimate Interests (Art. 6(1)(f)) in providing open technical documentation. Voluntary form submissions rely on Explicit Consent (Art. 6(1)(a)) and Legal Obligation (Art. 6(1)(c)) for statutory privacy compliance.
                  </li>
                  <li>
                    <strong>Data Subject Rights (GDPR Arts. 15–22, LGPD Art. 18, PIPEDA):</strong> Right of access, rectification, erasure (“Right to be Forgotten”), restriction of processing, data portability (machine-readable JSON), objection to processing, and right not to be subject to automated decision-making.
                  </li>
                  <li>
                    <strong>International Data Transfers:</strong> Where any voluntary submission is processed across borders, we rely on European Commission Standard Contractual Clauses (SCCs), the UK International Data Transfer Addendum, and India DPDP Act Section 16 permitted transfer rules.
                  </li>
                </ul>
              </article>
            </div>

            {/* Right Column: Storage Transparency Table & Grievance Officer Card */}
            <aside className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-daylight rounded-[20px] p-5 flex flex-col gap-3 border border-midnight-mouth/8">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-midnight-mouth" aria-hidden="true" />
                  <h2 className="font-[var(--font-wallop)] font-bold text-[16.5px] text-midnight-mouth">
                    Local Storage &amp; Cookie Ledger
                  </h2>
                </div>
                <p className="font-[var(--font-inter)] text-[12.5px] text-ink/80">
                  FreeStack sets <strong>0 third-party tracking cookies</strong>. Only the following transparent browser storage keys are used on your device:
                </p>
                <div className="flex flex-col gap-2">
                  {KNOWN_LOCAL_KEYS.map((item) => (
                    <div
                      key={item.key}
                      className="bg-paper rounded-[12px] p-3 flex flex-col gap-1 border border-midnight-mouth/6"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <code className="font-[var(--font-mono)] font-semibold text-[11.5px] text-midnight-mouth">
                          {item.key}
                        </code>
                        <span className="font-[var(--font-wallop)] text-[10.5px] bg-daylight px-2 py-0.5 rounded-full text-ink/75">
                          {item.storage}
                        </span>
                      </div>
                      <p className="font-[var(--font-inter)] text-[12px] text-ink/85">
                        {item.purpose}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/privacy-requests')}
                  className="mt-1 w-full bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-4 py-2.5 min-h-[38px] cursor-pointer spring-pill"
                >
                  Open Privacy Requests &amp; Storage Eraser
                </button>
              </div>

              <div className="bg-sunshine-yellow rounded-[20px] p-5 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-midnight-mouth">
                  <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h3 className="font-[var(--font-wallop)] font-bold text-[16px]">
                    Operator Privacy &amp; Grievance Contacts
                  </h3>
                </div>
                <div className="font-[var(--font-inter)] text-[12.5px] text-midnight-mouth space-y-1.5">
                  <p>
                    <strong>India Grievance Officer (IT Rules &amp; DPDP Act):</strong>
                    <br />
                    Maintainer: Aniket Kolse (<a href="https://github.com/aniketkolse" target="_blank" rel="noopener noreferrer" className="underline">github.com/aniketkolse</a>)
                    <br />
                    Email: <code className="font-[var(--font-mono)]">aniketkolse07@gmail.com</code>
                    <br />
                    Target SLA: 24h Acknowledgement · 15 Days Resolution
                  </p>
                  <p>
                    <strong>US Privacy &amp; DMCA Contact:</strong>
                    <br />
                    Email: <code className="font-[var(--font-mono)]">aniketkolse07@gmail.com</code>
                    <br />
                    Target SLA: 10 Business Days Ack · 45 Days Resolution
                  </p>
                  <p>
                    <strong>EU / UK / Global Privacy Contact:</strong>
                    <br />
                    Email: <code className="font-[var(--font-mono)]">aniketkolse07@gmail.com</code>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: PRIVACY REQUESTS & GRIEVANCE PORTAL (/privacy-requests)
         ===================================================================== */}
      {activeTab === 'privacy-requests' && (
        <div
          data-testid="privacy-requests-content"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start card-enter"
        >
          {/* Left Column: Statutory Privacy Request & Grievance Submission Form */}
          <div className="lg:col-span-7 bg-daylight rounded-[22px] p-5 sm:p-6 md:p-7 flex flex-col gap-4 border border-midnight-mouth/8">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-midnight-mouth/10">
              <div>
                <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] text-midnight-mouth">
                  Submit a Privacy Request or Statutory Grievance
                </h2>
                <p className="font-[var(--font-inter)] text-[13px] text-ink/80 mt-0.5">
                  Covers India DPDP Act (Sections 11–14), US CCPA/CPRA &amp; State Laws, EU/UK GDPR (Arts. 15–22), and Global Privacy Rights.
                </p>
              </div>
            </div>

            <div className="bg-paper rounded-[14px] p-3.5 text-[12.5px] font-[var(--font-inter)] text-ink/90 border border-midnight-mouth/8">
              <strong>How this portal works (Local-First Architecture):</strong> Submitting this form creates a timestamped receipt in your browser&apos;s <code className="font-[var(--font-mono)]">localStorage</code> and prepares a formatted email to the designated privacy contact (<code className="font-[var(--font-mono)]">{currentSpec.officerEmail}</code>). No personal data from this form is transmitted to FreeStack&apos;s server unless you send the generated email.
            </div>

            {latestTicket && (
              <div
                role="status"
                data-testid="privacy-request-receipt"
                className="bg-grass-green rounded-[16px] p-4 flex flex-col gap-2 text-[#101014]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span className="font-[var(--font-wallop)] font-bold text-[15px]">
                      Local Receipt Generated — Ticket {latestTicket.ticketId}
                    </span>
                  </div>
                  <span className="font-[var(--font-mono)] text-[11.5px] bg-white/80 px-2.5 py-0.5 rounded-full">
                    {JURISDICTION_SPECS[latestTicket.jurisdiction].shortLabel}
                  </span>
                </div>
                <p className="font-[var(--font-inter)] text-[12.5px] leading-[1.45]">
                  Saved locally in your browser under <strong>{latestTicket.applicableLaw}</strong>. Target acknowledgement window:{' '}
                  <strong>{formatDate(latestTicket.ackDueBy)}</strong>; target resolution window:{' '}
                  <strong>{formatDate(latestTicket.resolutionDueBy)}</strong>. To transmit this request to the site operator, click below to send via your email client:
                </p>
                <div>
                  <a
                    href={`mailto:${encodeURIComponent(currentSpec.officerEmail)}?subject=${encodeURIComponent(`[${latestTicket.ticketId}] Privacy Request (${latestTicket.requestType})`)}&body=${encodeURIComponent(`Ticket ID: ${latestTicket.ticketId}\nJurisdiction: ${latestTicket.jurisdiction}\nRequest Type: ${latestTicket.requestType}\nName: ${latestTicket.fullName}\nEmail: ${latestTicket.email}\nDetails: ${latestTicket.details}`)}`}
                    className="inline-flex items-center gap-1.5 bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12px] rounded-full px-3.5 py-1.5"
                  >
                    <Send className="w-3 h-3" aria-hidden="true" />
                    <span>Email Receipt to {currentSpec.officerEmail}</span>
                  </a>
                </div>
              </div>
            )}

            {formErrors.length > 0 && (
              <div
                role="alert"
                className="bg-tangerine/25 border border-tangerine rounded-[14px] p-3.5 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[13.5px] text-midnight-mouth">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Please complete the required statutory fields:</span>
                </div>
                <ul className="font-[var(--font-inter)] text-[12.5px] text-midnight-mouth list-disc pl-5">
                  {formErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="flex flex-col gap-3.5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="pr-jurisdiction"
                    className="font-[var(--font-wallop)] font-semibold text-[13px] text-midnight-mouth"
                  >
                    Applicable Jurisdiction
                  </label>
                  <FilterDropdown
                    id="pr-jurisdiction"
                    label="Applicable Jurisdiction"
                    surface="paper"
                    minMenuWidth={300}
                    menuTitle="Applicable jurisdiction"
                    value={selectedJurisdiction}
                    onChange={(val) => setSelectedJurisdiction(val as LegalJurisdiction)}
                    options={[
                      { value: 'india', label: 'India — DPDP Act 2023 & IT Rules 2021' },
                      { value: 'usa', label: 'United States — CCPA/CPRA, VCDPA, CPA, TDPSA' },
                      { value: 'eu_uk', label: 'EU / EEA / UK — GDPR & UK GDPR' },
                      { value: 'global', label: 'Global — LGPD, PIPEDA, PDPA, APPI' },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="pr-request-type"
                    className="font-[var(--font-wallop)] font-semibold text-[13px] text-midnight-mouth"
                  >
                    Statutory Right / Request Type
                  </label>
                  <FilterDropdown
                    id="pr-request-type"
                    label="Statutory Right / Request Type"
                    surface="paper"
                    minMenuWidth={300}
                    menuTitle="Statutory right / request type"
                    value={requestType}
                    onChange={(val) => setRequestType(val as PrivacyRequestType)}
                    options={(Object.keys(PRIVACY_REQUEST_TYPE_LABELS) as PrivacyRequestType[]).map(
                      (rt) => ({
                        value: rt,
                        label: PRIVACY_REQUEST_TYPE_LABELS[rt].title,
                      })
                    )}
                  />
                </div>
              </div>

              <div className="bg-paper rounded-[12px] px-3.5 py-2.5 text-[12px] font-[var(--font-inter)] text-ink/85 border border-midnight-mouth/6">
                <strong>{PRIVACY_REQUEST_TYPE_LABELS[requestType].badge}:</strong>{' '}
                {PRIVACY_REQUEST_TYPE_LABELS[requestType].subtitle}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="pr-fullname"
                    className="font-[var(--font-wallop)] font-semibold text-[13px] text-midnight-mouth"
                  >
                    Full Name (Data Principal)
                  </label>
                  <input
                    id="pr-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Aarav Sharma / Jane Doe"
                    className="bg-paper text-midnight-mouth font-[var(--font-inter)] text-[13.5px] rounded-[12px] px-3.5 py-2.5 min-h-[40px] border border-midnight-mouth/12"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="pr-email"
                    className="font-[var(--font-wallop)] font-semibold text-[13px] text-midnight-mouth"
                  >
                    Email Address
                  </label>
                  <input
                    id="pr-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-paper text-midnight-mouth font-[var(--font-inter)] text-[13.5px] rounded-[12px] px-3.5 py-2.5 min-h-[40px] border border-midnight-mouth/12"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="pr-region"
                    className="font-[var(--font-wallop)] font-semibold text-[13px] text-midnight-mouth"
                  >
                    State / Country
                  </label>
                  <input
                    id="pr-region"
                    type="text"
                    value={stateOrRegion}
                    onChange={(e) => setStateOrRegion(e.target.value)}
                    placeholder="e.g., Maharashtra, IN or CA, USA"
                    className="bg-paper text-midnight-mouth font-[var(--font-inter)] text-[13.5px] rounded-[12px] px-3.5 py-2.5 min-h-[40px] border border-midnight-mouth/12"
                  />
                </div>
              </div>

              {/* India Section 14 DPDP Nominee Fields when nominate_representative is selected */}
              {requestType === 'nominate_representative' && (
                <div className="bg-sunshine-yellow/35 rounded-[14px] p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 border border-midnight-mouth/10">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="pr-nominee-name"
                      className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
                    >
                      Nominee Full Name (India DPDP Sec. 14)
                    </label>
                    <input
                      id="pr-nominee-name"
                      type="text"
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      placeholder="Full legal name of nominated person"
                      className="bg-paper text-midnight-mouth font-[var(--font-inter)] text-[13px] rounded-[10px] px-3 py-2 min-h-[38px] border border-midnight-mouth/12"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="pr-nominee-contact"
                      className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
                    >
                      Nominee Email / Contact
                    </label>
                    <input
                      id="pr-nominee-contact"
                      type="text"
                      value={nomineeContact}
                      onChange={(e) => setNomineeContact(e.target.value)}
                      placeholder="nominee@example.com"
                      className="bg-paper text-midnight-mouth font-[var(--font-inter)] text-[13px] rounded-[10px] px-3 py-2 min-h-[38px] border border-midnight-mouth/12"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="pr-details"
                  className="font-[var(--font-wallop)] font-semibold text-[13px] text-midnight-mouth"
                >
                  Request or Grievance Details
                </label>
                <textarea
                  id="pr-details"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the data, correction, erasure, opt-out, or grievance you are submitting..."
                  className="bg-paper text-midnight-mouth font-[var(--font-inter)] text-[13.5px] rounded-[12px] p-3.5 border border-midnight-mouth/12"
                />
              </div>

              <label
                htmlFor="pr-verify-checkbox"
                className="flex items-start gap-2.5 bg-paper rounded-[12px] p-3 cursor-pointer border border-midnight-mouth/8"
              >
                <input
                  id="pr-verify-checkbox"
                  type="checkbox"
                  checked={verifiedIdentity}
                  onChange={(e) => setVerifiedIdentity(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-midnight-mouth cursor-pointer"
                />
                <span className="font-[var(--font-inter)] text-[12.5px] leading-[1.45] text-ink/90">
                  I declare under applicable law (including Section 15 of the India DPDP Act 2023—duty not to register a false or frivolous grievance—and US CCPA verification rules) that I am the Data Principal / Consumer or an authorized representative.
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="font-[var(--font-inter)] text-[12px] text-ink/70 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    Target SLA: {currentSpec.ackWindowHours}h Ack · {currentSpec.resolutionDays}d Resolution
                  </span>
                </span>
                <button
                  type="submit"
                  className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-6 py-2.5 min-h-[42px] inline-flex items-center gap-2 spring-pill cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Submit Statutory Request</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Instant Local Data Inspector, One-Click Eraser, Do Not Sell Toggle & Receipt Log */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Instant Self-Service Browser Data Inspector & Erasure */}
            <div className="bg-daylight rounded-[22px] p-5 flex flex-col gap-3.5 border border-midnight-mouth/8">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-[var(--font-wallop)] font-bold text-[17px] text-midnight-mouth">
                  Instant Local Data Inspector &amp; Erasure
                </h3>
                <span className="font-[var(--font-mono)] text-[11px] bg-paper px-2.5 py-0.5 rounded-full text-midnight-mouth">
                  Self-Service
                </span>
              </div>
              <p className="font-[var(--font-inter)] text-[12.5px] leading-[1.45] text-ink/85">
                Because FreeStack stores your preferences locally on your device rather than on a central tracking server, you can inspect, export (GDPR Art. 20 / CCPA Portability), or permanently erase your browser data right now:
              </p>

              {purgedNotice && (
                <div
                  role="status"
                  className="bg-sunshine-yellow text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-[12px] px-3.5 py-2"
                >
                  All FreeStack local &amp; session storage keys have been erased from this browser.
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                {localStorageSnapshot.map((entry) => (
                  <div
                    key={entry.key}
                    className="bg-paper rounded-[11px] px-3 py-2 flex items-center justify-between gap-2 border border-midnight-mouth/6"
                  >
                    <code className="font-[var(--font-mono)] text-[11.5px] text-midnight-mouth truncate">
                      {entry.key}
                    </code>
                    <span
                      className={`font-[var(--font-mono)] text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                        entry.present
                          ? 'bg-grass-green text-[#101014]'
                          : 'bg-daylight text-ink/60'
                      }`}
                    >
                      {entry.present ? entry.valuePreview : 'Empty'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportPortabilityJson}
                  className="bg-paper hover:bg-sunshine-yellow text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3.5 py-2 min-h-[38px] inline-flex items-center justify-center gap-1.5 filter-pill cursor-pointer border border-midnight-mouth/10"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Export JSON (Portability)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePurgeAllLocalData}
                  className="bg-tangerine hover:opacity-90 text-[#101014] font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3.5 py-2 min-h-[38px] inline-flex items-center justify-center gap-1.5 filter-pill cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Erase All Local Data</span>
                </button>
              </div>
            </div>

            {/* US Do Not Sell or Share / Global Privacy Control Status */}
            <div className="bg-daylight rounded-[22px] p-5 flex flex-col gap-2.5 border border-midnight-mouth/8">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-[var(--font-wallop)] font-bold text-[16px] text-midnight-mouth">
                  US “Do Not Sell or Share” &amp; GPC Signal
                </h3>
                <button
                  type="button"
                  role="switch"
                  aria-checked={gpcOptOutActive}
                  onClick={() => setGpcOptOutActive((prev) => !prev)}
                  className={`font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-full px-3 py-1 cursor-pointer ${
                    gpcOptOutActive
                      ? 'bg-grass-green text-[#101014]'
                      : 'bg-paper text-midnight-mouth'
                  }`}
                >
                  {gpcOptOutActive ? 'Opt-Out Enforced' : 'Enable Opt-Out'}
                </button>
              </div>
              <p className="font-[var(--font-inter)] text-[12.5px] leading-[1.45] text-ink/85">
                Under the California Consumer Privacy Act (CCPA/CPRA), Colorado Privacy Act, and Connecticut Data Privacy Act, FreeStack confirms that <strong>0% of user data is sold or shared</strong> with data brokers or ad networks, and Global Privacy Control (<code className="font-[var(--font-mono)]">Sec-GPC: 1</code>) is enforced by default.
              </p>
            </div>

            {/* Submitted Request Receipts */}
            {submittedRequests.length > 0 && (
              <div className="bg-daylight rounded-[22px] p-5 flex flex-col gap-2.5 border border-midnight-mouth/8">
                <h3 className="font-[var(--font-wallop)] font-bold text-[16px] text-midnight-mouth">
                  Your Logged Request Receipts ({submittedRequests.length})
                </h3>
                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
                  {submittedRequests.map((req) => (
                    <div
                      key={req.ticketId}
                      className="bg-paper rounded-[12px] p-3 flex flex-col gap-1 border border-midnight-mouth/6"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-[var(--font-mono)] font-semibold text-[12px] text-midnight-mouth">
                          {req.ticketId}
                        </span>
                        <span className="font-[var(--font-wallop)] text-[11px] bg-grass-green text-[#101014] px-2 py-0.5 rounded-full">
                          Due {formatDate(req.resolutionDueBy)}
                        </span>
                      </div>
                      <p className="font-[var(--font-inter)] text-[12px] text-ink/85">
                        {PRIVACY_REQUEST_TYPE_LABELS[req.requestType].title} · {req.fullName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: TERMS OF SERVICE (/terms)
         ===================================================================== */}
      {activeTab === 'terms' && (
        <div
          data-testid="terms-of-service-content"
          className="flex flex-col gap-5 card-enter"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* 1. Scope & Nature of Service */}
              <article className="bg-daylight rounded-[20px] p-5 sm:p-6 flex flex-col gap-2.5 border border-midnight-mouth/8">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-midnight-mouth" aria-hidden="true" />
                  <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                    1. Acceptance of Terms &amp; Informational Nature of FreeStack
                  </h2>
                </div>
                <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.55] text-ink/90">
                  By accessing or using FreeStack, you agree to be bound by these Terms of Service and our Privacy Policy. FreeStack is an independent, public, source-cited informational directory cataloging free tiers, APIs, Model Context Protocol (MCP) servers, open-source developer tools, learning resources, and academic benefits offered by third-party providers.
                </p>
                <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.55] text-ink/90">
                  <strong>No Billing or Contractual Relationship with Third-Party Providers:</strong> FreeStack is not a cloud reseller, broker, or agent of any listed provider. When you click an external link to an official provider (such as Google Cloud, GitHub, Cloudflare, Supabase, Groq, or Microsoft Azure), your use of that service is governed exclusively by that provider&apos;s own Terms of Service and billing agreements.
                </p>
              </article>

              {/* 2. Verification Disclaimer & "Verify Before Use" Rule */}
              <article className="bg-daylight rounded-[20px] p-5 sm:p-6 flex flex-col gap-2.5 border border-midnight-mouth/8">
                <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                  2. Quotas, Card Policies &amp; “Verify Before Use” Disclaimer
                </h2>
                <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.55] text-ink/90">
                  While every verified record on FreeStack cites official HTTPS documentation and displays a <code className="font-[var(--font-mono)] text-[12.5px] bg-paper px-1.5 py-0.5 rounded">last_verified_at</code> date, third-party providers may modify their free quotas, rate limits, regional restrictions, student eligibility criteria, or credit-card requirements at any time without notice to FreeStack. You are solely responsible for verifying current pricing and billing thresholds on the provider&apos;s official website before deploying workloads or entering payment credentials.
                </p>
              </article>

              {/* 3. Trademarks & Nominative Fair Use */}
              <article className="bg-daylight rounded-[20px] p-5 sm:p-6 flex flex-col gap-2.5 border border-midnight-mouth/8">
                <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                  3. Official Logos, Trademarks &amp; Nominative Fair Use
                </h2>
                <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.55] text-ink/90">
                  All third-party company names, brand marks, and official product logos displayed on FreeStack are the property of their respective trademark owners. They are used strictly for nominative fair-use identification of the respective company&apos;s public developer offering under applicable trademark laws in India (Trade Marks Act, 1999 Section 30), the United States (Lanham Act, 15 U.S.C. § 1115(b)(4)), and international conventions. FreeStack claims no ownership over third-party marks and implies no endorsement or sponsorship by any listed provider.
                </p>
              </article>

              {/* 4. India Specific Legal Terms */}
              <article className="bg-daylight rounded-[20px] p-5 sm:p-6 flex flex-col gap-2.5 border border-midnight-mouth/8">
                <div className="flex items-center gap-2">
                  <span className="bg-tangerine text-[#101014] font-[var(--font-wallop)] font-bold text-[11.5px] px-2.5 py-0.5 rounded-full">
                    INDIA LEGAL PROVISIONS
                  </span>
                  <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                    4. India Law: IT Act 2000, Intermediary Guidelines 2021 &amp; Indian Contract Act 1872
                  </h2>
                </div>
                <ul className="font-[var(--font-inter)] text-[13px] sm:text-[13.5px] leading-[1.55] text-ink/90 list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>Electronic Record (IT Act, 2000):</strong> This document is an electronic record in terms of the Information Technology Act, 2000 and rules thereunder as applicable and does not require any physical or digital signatures.
                  </li>
                  <li>
                    <strong>User Obligations under Rule 3(1)(b) of IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021:</strong> When submitting community corrections or resource links, you shall not host, display, upload, modify, publish, transmit, store, update, or share any information that belongs to another person without right, is defamatory, obscene, invasive of privacy, infringes any patent/trademark/copyright, deceives or misleads the addressee, contains software viruses or malicious code, or threatens the unity, integrity, defence, security or sovereignty of India.
                  </li>
                  <li>
                    <strong>Intermediary Safe Harbour (Section 79, IT Act 2000):</strong> With respect to third-party links and community-submitted correction reports, FreeStack operates as an information curator/intermediary and responds promptly to lawful takedown notices sent to <code className="font-[var(--font-mono)]">aniketkolse07@gmail.com</code> within 24 hours.
                  </li>
                </ul>
              </article>

              {/* 5. United States Specific Legal Terms */}
              <article className="bg-daylight rounded-[20px] p-5 sm:p-6 flex flex-col gap-2.5 border border-midnight-mouth/8">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-blue text-[#101014] font-[var(--font-wallop)] font-bold text-[11.5px] px-2.5 py-0.5 rounded-full">
                    USA LEGAL PROVISIONS
                  </span>
                  <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                    5. United States Law: Section 230 Safe Harbor, DMCA Notice &amp; Warranty Disclaimers
                  </h2>
                </div>
                <ul className="font-[var(--font-inter)] text-[13px] sm:text-[13.5px] leading-[1.55] text-ink/90 list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>47 U.S.C. § 230 Protection:</strong> FreeStack is an interactive computer service cataloging third-party provider offerings and documentation. FreeStack shall not be treated as the publisher or speaker of any information provided by third-party information content providers.
                  </li>
                  <li>
                    <strong>DMCA Copyright Policy (17 U.S.C. § 512):</strong> If you believe any content or metadata on FreeStack infringes your copyright, please send a written notice containing the elements required by 17 U.S.C. § 512(c)(3) to our Designated DMCA Contact at <code className="font-[var(--font-mono)]">aniketkolse07@gmail.com</code>.
                  </li>
                  <li>
                    <strong>“AS-IS” Disclaimer of Warranties &amp; Limitation of Liability:</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW IN THE UNITED STATES, INDIA, AND GLOBALLY, FREESTACK IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. IN NO EVENT SHALL FREESTACK OR ITS CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR UNEXPECTED CLOUD BILLING DAMAGES.
                  </li>
                </ul>
              </article>
            </div>

            {/* Right Column: Governing Law Matrix & Quick Actions */}
            <aside className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-daylight rounded-[20px] p-5 flex flex-col gap-3 border border-midnight-mouth/8">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-midnight-mouth" aria-hidden="true" />
                  <h3 className="font-[var(--font-wallop)] font-bold text-[16.5px] text-midnight-mouth">
                    Governing Law &amp; Venue by Region
                  </h3>
                </div>
                <div className="flex flex-col gap-2.5 font-[var(--font-inter)] text-[12.5px] text-ink/90">
                  <div className="bg-paper rounded-[12px] p-3">
                    <strong className="text-midnight-mouth block mb-0.5">
                      1. Users in the Republic of India
                    </strong>
                    Governed by the laws of the Republic of India (Indian Contract Act, 1872, IT Act, 2000, and DPDP Act, 2023), with statutory access to the India Grievance Officer and Data Protection Board of India.
                  </div>
                  <div className="bg-paper rounded-[12px] p-3">
                    <strong className="text-midnight-mouth block mb-0.5">
                      2. Users in the United States of America
                    </strong>
                    Governed by US Federal Law and the laws of the State of California / Delaware, preserving all mandatory state consumer privacy remedies under CCPA/CPRA, VCDPA, CPA, CTDPA, and TDPSA.
                  </div>
                  <div className="bg-paper rounded-[12px] p-3">
                    <strong className="text-midnight-mouth block mb-0.5">
                      3. Users in the EU/EEA, UK &amp; Rest of World
                    </strong>
                    Nothing in these Terms limits or waives any non-waivable statutory consumer protection or data protection rights under the laws of your country of habitual residence (including EU Rome I Regulation Art. 6 &amp; GDPR).
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/privacy-requests')}
                  className="mt-1 w-full bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-4 py-2.5 min-h-[38px] cursor-pointer spring-pill"
                >
                  File a Privacy Request or Grievance
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
