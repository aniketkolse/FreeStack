import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Flag } from 'lucide-react';
import type { OutdatedReport } from '../../types/resource';
import { FilterDropdown } from '../ui/FilterDropdown';

interface ReportOutdatedFormProps {
  defaultOfferSlug?: string | null;
  defaultOfferName?: string;
  defaultType?: OutdatedReport['reportType'];
  onClose?: () => void;
}

export function ReportOutdatedForm({
  defaultOfferSlug = null,
  defaultOfferName = '',
  defaultType = 'outdated_limit',
  onClose,
}: ReportOutdatedFormProps) {
  const [offerName, setOfferName] = useState(defaultOfferName);
  const [reportType, setReportType] = useState<OutdatedReport['reportType']>(defaultType);
  const [details, setDetails] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<OutdatedReport | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerSlug: defaultOfferSlug,
          offerName,
          reportType,
          details,
          sourceUrl: sourceUrl.trim() ? sourceUrl.trim() : null,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not save your report. Please check your inputs.');
        return;
      }
      setSubmitted(data.report);
      setDetails('');
      setSourceUrl('');
    } catch {
      setError('Network error while submitting report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        data-testid="report-success-state"
        className="bg-grass-green rounded-[24px] p-6 sm:p-8 flex flex-col items-start gap-4"
      >
        <div className="flex items-center gap-2.5 text-midnight-mouth">
          <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
          <h3 className="font-[var(--font-wallop)] font-bold text-[24px]">
            Correction received
          </h3>
        </div>
        <p className="font-[var(--font-inter)] text-[16px] leading-[1.45] text-ink">
          Thank you for keeping FreeStack accurate. Your report for{' '}
          <strong>{submitted.offerName}</strong> has been queued for human review before any pricing or card policy changes go live.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => setSubmitted(null)}
            className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[16px] rounded-full px-5 py-2.5 cursor-pointer spring-pill"
          >
            Submit another
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[16px] rounded-full px-5 py-2.5 cursor-pointer spring-pill"
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div
          role="alert"
          className="bg-tangerine text-midnight-mouth font-[var(--font-inter)] font-medium text-[14px] rounded-[16px] px-4 py-3"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="report-offer-name"
          className="font-[var(--font-wallop)] font-semibold text-[15px] text-midnight-mouth"
        >
          Resource name
        </label>
        <input
          id="report-offer-name"
          type="text"
          required
          minLength={2}
          maxLength={160}
          value={offerName}
          onChange={(e) => setOfferName(e.target.value)}
          placeholder="e.g., Supabase Free Plan"
          className="w-full bg-paper text-midnight-mouth font-[var(--font-inter)] text-[16px] sm:text-[15px] rounded-[16px] px-4 py-3 min-h-[44px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="report-type"
          className="font-[var(--font-wallop)] font-semibold text-[15px] text-midnight-mouth"
        >
          What changed or needs review?
        </label>
        <FilterDropdown
          id="report-type"
          label="What changed or needs review?"
          surface="paper"
          minMenuWidth={300}
          menuTitle="Select report type"
          value={reportType}
          onChange={(val) => setReportType(val as OutdatedReport['reportType'])}
          options={[
            { value: 'outdated_limit', label: 'Free-tier quota or limit changed' },
            { value: 'card_changed', label: 'Credit card requirement changed' },
            { value: 'broken_link', label: 'Broken official or pricing link' },
            { value: 'new_resource', label: 'Suggest a new free resource' },
            { value: 'other', label: 'Other correction' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="report-details"
          className="font-[var(--font-wallop)] font-semibold text-[15px] text-midnight-mouth"
        >
          Details (plain facts)
        </label>
        <textarea
          id="report-details"
          required
          minLength={8}
          maxLength={2000}
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe what the official pricing or docs page currently states..."
          className="w-full bg-paper text-midnight-mouth font-[var(--font-inter)] text-[16px] sm:text-[15px] rounded-[16px] px-4 py-3"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="report-source-url"
          className="font-[var(--font-wallop)] font-semibold text-[15px] text-midnight-mouth"
        >
          Official HTTPS source URL (optional)
        </label>
        <input
          id="report-source-url"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://provider.com/pricing"
          className="w-full bg-paper text-midnight-mouth font-[var(--font-inter)] text-[16px] sm:text-[15px] rounded-[16px] px-4 py-3 min-h-[44px]"
        />
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="report-website-hp">Leave this field blank</label>
        <input
          id="report-website-hp"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[16px] rounded-full px-5 py-3 min-h-[44px] cursor-pointer spring-pill"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[16px] rounded-full px-6 py-3 min-h-[44px] inline-flex items-center gap-2 cursor-pointer spring-pill disabled:opacity-60"
        >
          <Flag className="w-4 h-4" aria-hidden="true" />
          <span>{submitting ? 'Submitting...' : 'Submit report'}</span>
        </button>
      </div>
    </form>
  );
}

interface ReportOutdatedModalProps {
  open: boolean;
  onClose: () => void;
  offerSlug: string;
  offerName: string;
}

export function ReportOutdatedModal({
  open,
  onClose,
  offerSlug,
  offerName,
}: ReportOutdatedModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 bg-[#101014]/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-daylight rounded-t-[28px] sm:rounded-[32px] p-5 sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-lg w-full max-h-[90dvh] overflow-y-auto flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="report-modal-title"
              className="font-[var(--font-wallop)] font-bold text-[24px] sm:text-[26px] leading-[1.15] tracking-[-0.8px] text-midnight-mouth"
            >
              Report outdated info
            </h2>
            <p className="font-[var(--font-inter)] text-[14px] text-ink/80 mt-1">
              Help keep {offerName} factual and verified against official terms.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-11 h-11 rounded-full bg-paper text-midnight-mouth inline-flex items-center justify-center shrink-0 cursor-pointer hover:bg-sunshine-yellow"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ReportOutdatedForm
          defaultOfferSlug={offerSlug}
          defaultOfferName={offerName}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
