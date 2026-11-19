import React from 'react';
import {
  Check,
  Code2,
  Cpu,
  CreditCard,
  Globe,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react';
import type {
  Category,
  CategorySlug,
  PricingModel,
  RequirementState,
} from '../../types/resource';
import { formatPricingModel } from '../../lib/utils/formatters';
import { FilterDropdown } from '../ui/FilterDropdown';
import {
  AI_CONTEXT_FILTER_OPTIONS,
  AI_MODALITY_OPTIONS,
  type AiModalityId,
} from '../../lib/ai/aiModelMetadata';

export interface PrimaryTypeGroupItem {
  id: string;
  label: string;
  subcategories: string[];
  count: number;
  populatedSubcategories: Array<{ slug: string; name: string; count: number }>;
}

export interface TagSubtypeItem {
  tag: string;
  label: string;
  count: number;
}

export interface McpFilterCounts {
  officialCount: number;
  scopes: Map<string, number>;
  langs: Map<string, number>;
  os: Map<string, number>;
}

export const MCP_LANGUAGE_OPTIONS = [
  { value: 'typescript', label: 'TypeScript / JS', tag: 'lang:typescript' },
  { value: 'python', label: 'Python', tag: 'lang:python' },
  { value: 'go', label: 'Go', tag: 'lang:go' },
  { value: 'rust', label: 'Rust', tag: 'lang:rust' },
  { value: 'java', label: 'Java', tag: 'lang:java' },
  { value: 'csharp', label: 'C#', tag: 'lang:csharp' },
  { value: 'cpp', label: 'C/C++', tag: 'lang:cpp' },
  { value: 'ruby', label: 'Ruby', tag: 'lang:ruby' },
] as const;

export const MCP_SCOPE_OPTIONS = [
  { value: 'all', label: 'All Scopes', tag: '' },
  { value: 'local', label: 'Local', tag: 'scope:local' },
  { value: 'cloud', label: 'Cloud', tag: 'scope:cloud' },
  { value: 'embedded', label: 'Embedded', tag: 'scope:embedded' },
] as const;

export const MCP_OS_OPTIONS = [
  { value: 'macos', label: 'macOS', tag: 'os:macos' },
  { value: 'windows', label: 'Windows', tag: 'os:windows' },
  { value: 'linux', label: 'Linux', tag: 'os:linux' },
] as const;

const CATEGORY_FOCUS_LABEL: Record<CategorySlug, string> = {
  'ai-ml': 'Model Category',
  mcp: 'Use Case & Category',
  'apis-integrations': 'API Domain',
  'design-creative': 'Design Area',
  'cloud-hosting': 'Cloud Service',
  'databases-backend': 'Database & Backend',
  'developer-tools': 'Tooling Area',
  learning: 'Learning Format',
  'student-benefits': 'Benefit Area',
  'security-networking': 'Security Domain',
  'productivity-collaboration': 'Workflow Area',
};

export interface CategoryFilterSidebarProps {
  idPrefix: string;
  category: Category;
  totalInCategoryCount: number;
  usesMacroGroups: boolean;
  primaryTypeGroups: PrimaryTypeGroupItem[];
  activePrimaryGroup?: PrimaryTypeGroupItem;
  allPopulatedSubcategories: Array<{ slug: string; name: string; count: number }>;
  standardCategoryTagSubtypes: TagSubtypeItem[];
  categoryPricingOptions: Array<{ model: PricingModel; count: number }>;
  mcpFilterCounts: McpFilterCounts;
  studentVerificationCounts: { exclusive: number; eligible: number; total: number };
  // Current state
  selectedTypeGroup: string;
  selectedSubcategory: string;
  selectedTagSubtype: string;
  cardFilter: RequirementState | 'all';
  selectedPricing: PricingModel[];
  studentFriendlyOnly: boolean;
  studentVerificationFilter: 'all' | 'exclusive' | 'eligible';
  mcpOfficialOnly: boolean;
  mcpScope: string;
  mcpLang: string;
  mcpOs: string;
  aiModality: AiModalityId | 'all';
  aiMinContext: string;
  // Handlers
  onSelectTypeGroup: (typeId: string) => void;
  onSelectSubcategory: (subName: string) => void;
  onSelectTagSubtype: (tag: string) => void;
  onSelectCardFilter: (card: RequirementState | 'all') => void;
  onTogglePricing: (model: PricingModel) => void;
  onClearPricing: () => void;
  onToggleStudentFriendly: () => void;
  onSelectStudentVerification: (val: 'all' | 'exclusive' | 'eligible') => void;
  onToggleMcpOfficial: () => void;
  onSelectMcpScope: (scope: string) => void;
  onSelectMcpLang: (lang: string) => void;
  onSelectMcpOs: (os: string) => void;
  onSelectAiModality: (modality: AiModalityId | 'all') => void;
  onSelectAiMinContext: (ctx: string) => void;
}

export function CategoryFilterSidebar({
  idPrefix,
  category,
  totalInCategoryCount,
  usesMacroGroups,
  primaryTypeGroups,
  activePrimaryGroup,
  allPopulatedSubcategories,
  standardCategoryTagSubtypes,
  categoryPricingOptions,
  mcpFilterCounts,
  studentVerificationCounts,
  selectedTypeGroup,
  selectedSubcategory,
  selectedTagSubtype,
  cardFilter,
  selectedPricing,
  studentFriendlyOnly,
  studentVerificationFilter,
  mcpOfficialOnly,
  mcpScope,
  mcpLang,
  mcpOs,
  aiModality,
  aiMinContext,
  onSelectTypeGroup,
  onSelectSubcategory,
  onSelectTagSubtype,
  onSelectCardFilter,
  onTogglePricing,
  onClearPricing,
  onToggleStudentFriendly,
  onSelectStudentVerification,
  onToggleMcpOfficial,
  onSelectMcpScope,
  onSelectMcpLang,
  onSelectMcpOs,
  onSelectAiModality,
  onSelectAiMinContext,
}: CategoryFilterSidebarProps) {
  const isMcpCategory = category.slug === 'mcp';
  const isAiCategory = category.slug === 'ai-ml';
  const isStudentCategory = category.slug === 'student-benefits';

  const focusLabel = CATEGORY_FOCUS_LABEL[category.slug] ?? 'Subcategories';
  const activeSubtypes = usesMacroGroups
    ? activePrimaryGroup
      ? activePrimaryGroup.populatedSubcategories
      : allPopulatedSubcategories
    : [];

  return (
    <div className="flex flex-col gap-3">
      {/* Section 1: Category-Specific Subcategories / Focus */}
      <div className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2.5 border border-midnight-mouth/6">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`${idPrefix}-subcategory-select`}
            className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth"
          >
            <Layers className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
            <span>{focusLabel}</span>
          </label>
          {(selectedTypeGroup !== 'all' || selectedSubcategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                onSelectTypeGroup('all');
                onSelectSubcategory('all');
              }}
              className="font-[var(--font-wallop)] font-semibold text-[11px] text-midnight-mouth/70 hover:text-midnight-mouth underline cursor-pointer"
            >
              All
            </button>
          )}
        </div>

        {usesMacroGroups ? (
          <>
            <FilterDropdown
              id={`${idPrefix}-subcategory-select`}
              label={isMcpCategory ? 'Use case' : 'API domain'}
              value={selectedSubcategory}
              active={selectedSubcategory !== 'all'}
              size="sm"
              minMenuWidth={258}
              maxMenuHeight={320}
              menuTitle={isMcpCategory ? 'Jump to use case' : 'Jump to API domain'}
              menuSubtitle={`${allPopulatedSubcategories.length} options`}
              onChange={(val) => onSelectSubcategory(val)}
              options={[
                {
                  value: 'all',
                  label: isMcpCategory ? 'All use cases' : 'All API domains',
                  count: totalInCategoryCount,
                },
                ...allPopulatedSubcategories.map((sub) => ({
                  value: sub.name,
                  label: sub.name,
                  count: sub.count,
                })),
              ]}
            />

            {activeSubtypes.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-0.5">
                <span className="font-[var(--font-inter)] text-[11px] text-ink/65">
                  {activePrimaryGroup
                    ? `Top in ${activePrimaryGroup.label}:`
                    : isMcpCategory
                      ? 'Popular use cases:'
                      : 'Popular domains:'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeSubtypes.slice(0, 8).map((sub) => {
                    const active = selectedSubcategory === sub.name;
                    return (
                      <button
                        key={sub.slug}
                        type="button"
                        onClick={() => onSelectSubcategory(active ? 'all' : sub.name)}
                        className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-1 min-h-[25px] filter-pill cursor-pointer inline-flex items-center gap-1 ${
                          active
                            ? 'bg-midnight-mouth text-daylight shadow-xs'
                            : 'bg-daylight text-midnight-mouth/85 hover:bg-sunshine-yellow/55'
                        }`}
                      >
                        <span className="truncate max-w-[155px]">{sub.name}</span>
                        <span className="text-[10px] opacity-65 tabular-nums">{sub.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <FilterDropdown
              id={`${idPrefix}-subcategory-select`}
              label={focusLabel}
              value={selectedSubcategory}
              active={selectedSubcategory !== 'all'}
              size="sm"
              minMenuWidth={258}
              maxMenuHeight={320}
              menuTitle={focusLabel}
              menuSubtitle={`${primaryTypeGroups.length} areas`}
              onChange={(val) => onSelectSubcategory(val)}
              options={[
                {
                  value: 'all',
                  label: `All ${category.shortName}`,
                  count: totalInCategoryCount,
                },
                ...primaryTypeGroups.map((group) => ({
                  value: group.label,
                  label: group.label,
                  count: group.count,
                })),
              ]}
            />

            {standardCategoryTagSubtypes.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-midnight-mouth/8">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-[var(--font-inter)] font-semibold text-[11px] text-ink/70">
                    Focus tags:
                  </span>
                  {selectedTagSubtype !== 'all' && (
                    <button
                      type="button"
                      onClick={() => onSelectTagSubtype('all')}
                      className="font-[var(--font-wallop)] font-semibold text-[10.5px] text-midnight-mouth/70 hover:text-midnight-mouth underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {standardCategoryTagSubtypes.slice(0, 8).map((item) => {
                    const active = selectedTagSubtype === item.tag;
                    return (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => onSelectTagSubtype(active ? 'all' : item.tag)}
                        className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-1 min-h-[25px] filter-pill cursor-pointer inline-flex items-center gap-1 ${
                          active
                            ? 'bg-midnight-mouth text-daylight shadow-xs'
                            : 'bg-daylight text-midnight-mouth/85 hover:bg-sunshine-yellow/55'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] opacity-65 tabular-nums">{item.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Section 2A: AI Models Specialist Card — Modality & Context Window */}
      {isAiCategory && (
        <div className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2.5 border border-midnight-mouth/6">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={`${idPrefix}-ai-modality`}
              className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth"
            >
              <Sparkles className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
              <span>Model Capabilities</span>
            </label>
            {(aiModality !== 'all' || aiMinContext !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  onSelectAiModality('all');
                  onSelectAiMinContext('all');
                }}
                className="font-[var(--font-wallop)] font-semibold text-[11px] text-midnight-mouth/70 hover:text-midnight-mouth underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <FilterDropdown
            id={`${idPrefix}-ai-modality`}
            testId={idPrefix === 'desktop' ? 'ai-modality-select' : undefined}
            label="AI Modality"
            value={aiModality}
            active={aiModality !== 'all'}
            size="sm"
            minMenuWidth={240}
            menuTitle="Model modality"
            menuSubtitle="Input & output type"
            onChange={(val) => onSelectAiModality(val as AiModalityId | 'all')}
            options={AI_MODALITY_OPTIONS.map((opt) => ({
              value: opt.id,
              label: opt.label,
            }))}
          />

          <div className="flex flex-col gap-1.5 pt-1 border-t border-midnight-mouth/8">
            <label
              htmlFor={`${idPrefix}-ai-context`}
              className="inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[11.5px] text-midnight-mouth/85"
            >
              <Cpu className="w-3 h-3 text-midnight-mouth/75" aria-hidden="true" />
              <span>Minimum Context</span>
            </label>
            <FilterDropdown
              id={`${idPrefix}-ai-context`}
              testId={idPrefix === 'desktop' ? 'ai-context-select' : undefined}
              label="Minimum context window"
              value={aiMinContext}
              active={aiMinContext !== 'all'}
              size="sm"
              minMenuWidth={220}
              menuTitle="Context window"
              menuSubtitle="Minimum token capacity"
              onChange={(val) => onSelectAiMinContext(val)}
              options={AI_CONTEXT_FILTER_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>
        </div>
      )}

      {/* Section 2B: MCP Specialist Card — Official, Scope, Language & OS */}
      {isMcpCategory && (
        <div className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2.5 border border-midnight-mouth/6">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth">
              <Globe className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
              <span>MCP Environment</span>
            </span>
            {(mcpOfficialOnly || mcpScope !== 'all' || mcpLang !== 'all' || mcpOs !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  if (mcpOfficialOnly) onToggleMcpOfficial();
                  onSelectMcpScope('all');
                  onSelectMcpLang('all');
                  onSelectMcpOs('all');
                }}
                className="font-[var(--font-wallop)] font-semibold text-[11px] text-midnight-mouth/70 hover:text-midnight-mouth underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Official Servers Toggle */}
          <button
            type="button"
            data-testid={idPrefix === 'desktop' ? 'mcp-official-filter' : undefined}
            aria-pressed={mcpOfficialOnly}
            onClick={onToggleMcpOfficial}
            className={`flex items-center justify-between gap-2 rounded-[10px] px-2.5 py-1.5 min-h-[34px] text-left filter-pill cursor-pointer border ${
              mcpOfficialOnly
                ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                : 'bg-daylight text-midnight-mouth border-midnight-mouth/8 hover:bg-sunshine-yellow/40'
            }`}
          >
            <span className="inline-flex items-center gap-1.5 font-[var(--font-inter)] font-medium text-[12px]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Official servers only</span>
            </span>
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <span className="font-[var(--font-mono)] text-[10.5px] opacity-65 tabular-nums">
                {mcpFilterCounts.officialCount}
              </span>
              <span
                className={`w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0 transition-transform ${
                  mcpOfficialOnly
                    ? 'bg-grass-green text-[#101014] scale-100'
                    : 'border border-midnight-mouth/25 scale-90'
                }`}
              >
                {mcpOfficialOnly && <Check className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />}
              </span>
            </span>
          </button>

          {/* Execution Scope 2x2 Grid */}
          <div className="flex flex-col gap-1.5">
            <span className="font-[var(--font-inter)] font-semibold text-[11px] text-ink/70">
              Execution scope
            </span>
            <div className="grid grid-cols-2 gap-1 bg-daylight p-1 rounded-[12px] border border-midnight-mouth/8">
              {MCP_SCOPE_OPTIONS.map((opt) => {
                const active = mcpScope === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelectMcpScope(opt.value)}
                    className={`font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-[9px] py-1.5 px-2 min-h-[30px] filter-pill cursor-pointer ${
                      active
                        ? 'bg-midnight-mouth text-daylight shadow-xs'
                        : 'text-midnight-mouth/80 hover:bg-paper'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language / SDK Dropdown */}
          <div className="flex flex-col gap-1 pt-1 border-t border-midnight-mouth/8">
            <label
              htmlFor={`${idPrefix}-mcp-lang`}
              className="inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[11.5px] text-midnight-mouth/85"
            >
              <Code2 className="w-3 h-3 text-midnight-mouth/75" aria-hidden="true" />
              <span>Language / SDK</span>
            </label>
            <FilterDropdown
              id={`${idPrefix}-mcp-lang`}
              testId={idPrefix === 'desktop' ? 'mcp-lang-select' : undefined}
              label="Codebase language"
              value={mcpLang}
              active={mcpLang !== 'all'}
              size="sm"
              minMenuWidth={230}
              menuTitle="Codebase language"
              menuSubtitle="Runtime or SDK"
              onChange={(val) => onSelectMcpLang(val)}
              options={[
                { value: 'all', label: 'All Languages' },
                ...MCP_LANGUAGE_OPTIONS.map((lang) => ({
                  value: lang.value,
                  label: lang.label,
                  count: mcpFilterCounts.langs.get(lang.value) ?? 0,
                })),
              ]}
            />
          </div>

          {/* Operating System Pills */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-midnight-mouth/8">
            <span className="font-[var(--font-inter)] font-semibold text-[11px] text-ink/70">
              Operating system
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => onSelectMcpOs('all')}
                className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-1 min-h-[25px] filter-pill cursor-pointer ${
                  mcpOs === 'all'
                    ? 'bg-midnight-mouth text-daylight shadow-xs'
                    : 'bg-daylight text-midnight-mouth/85 hover:bg-sunshine-yellow/55'
                }`}
              >
                All OS
              </button>
              {MCP_OS_OPTIONS.map((opt) => {
                const active = mcpOs === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelectMcpOs(active ? 'all' : opt.value)}
                    className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-1 min-h-[25px] filter-pill cursor-pointer ${
                      active
                        ? 'bg-midnight-mouth text-daylight shadow-xs'
                        : 'bg-daylight text-midnight-mouth/85 hover:bg-sunshine-yellow/55'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section 2C: Student Benefits Specialist Card — Verification Requirement */}
      {isStudentCategory && (
        <div
          role="group"
          aria-label="Student ID requirement filter"
          data-testid={idPrefix === 'desktop' ? 'student-verification-filter-group' : undefined}
          className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2 border border-midnight-mouth/6"
        >
          <span className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth">
            <GraduationCap className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
            <span>Student Verification</span>
          </span>
          <div className="flex flex-col gap-1">
            {[
              {
                val: 'all' as const,
                label: 'All Verification',
                count: studentVerificationCounts.total,
              },
              {
                val: 'exclusive' as const,
                label: 'Student ID / .edu Req.',
                count: studentVerificationCounts.exclusive,
              },
              {
                val: 'eligible' as const,
                label: 'No Student ID Req.',
                count: studentVerificationCounts.eligible,
              },
            ].map((opt) => {
              const active = studentVerificationFilter === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  data-testid={
                    idPrefix === 'desktop' ? `student-verify-filter-${opt.val}` : undefined
                  }
                  onClick={() => onSelectStudentVerification(opt.val)}
                  className={`flex items-center justify-between gap-2 rounded-[10px] px-2.5 py-1.5 min-h-[33px] text-left filter-pill cursor-pointer border ${
                    active
                      ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                      : 'bg-daylight text-midnight-mouth border-midnight-mouth/8 hover:bg-sunshine-yellow/40'
                  }`}
                >
                  <span className="font-[var(--font-inter)] font-medium text-[12px] truncate">
                    {opt.label}
                  </span>
                  <span className="font-[var(--font-mono)] text-[10.5px] opacity-65 tabular-nums shrink-0">
                    {opt.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Payment Card Rule (2x2 Grid — Explore-style) */}
      {!isMcpCategory && (
        <div className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2 border border-midnight-mouth/6">
          <label
            htmlFor={`${idPrefix}-cat-card-filter`}
            className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth"
          >
            <CreditCard className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
            <span>Payment Card Rule</span>
          </label>
          <div className="grid grid-cols-2 gap-1 bg-daylight p-1 rounded-[12px] border border-midnight-mouth/8">
            {[
              { val: 'all', label: 'Any Rule' },
              { val: 'not_required', label: 'No Card' },
              { val: 'required', label: 'Card Req.' },
              { val: 'unknown', label: 'Unknown' },
            ].map((opt) => {
              const active = cardFilter === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => onSelectCardFilter(opt.val as RequirementState | 'all')}
                  className={`font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-[9px] py-1.5 px-2 min-h-[30px] filter-pill cursor-pointer ${
                    active
                      ? 'bg-midnight-mouth text-daylight shadow-xs'
                      : 'text-midnight-mouth/80 hover:bg-paper'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <select
            id={`${idPrefix}-cat-card-filter`}
            value={cardFilter}
            onChange={(e) => onSelectCardFilter(e.target.value as RequirementState | 'all')}
            className="sr-only"
          >
            <option value="all">Any card policy</option>
            <option value="not_required">No credit card required</option>
            <option value="required">Card required</option>
            <option value="unknown">Card rule unknown</option>
          </select>
        </div>
      )}

      {/* Section 4: Access Model / Pricing Checklist (Only models present in this category) */}
      {categoryPricingOptions.length > 0 && (
        <fieldset className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2 border border-midnight-mouth/6">
          <div className="flex items-center justify-between gap-2">
            <legend className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth">
              <Tag className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
              <span>Access Model</span>
            </legend>
            {selectedPricing.length > 0 && (
              <button
                type="button"
                onClick={onClearPricing}
                className="font-[var(--font-wallop)] font-semibold text-[11px] text-midnight-mouth/70 hover:text-midnight-mouth underline cursor-pointer"
              >
                Clear ({selectedPricing.length})
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1">
            {categoryPricingOptions.map(({ model, count }) => {
              const checked = selectedPricing.includes(model);
              return (
                <button
                  key={model}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => onTogglePricing(model)}
                  className={`flex items-center justify-between gap-2 rounded-[10px] px-2.5 py-1.5 min-h-[33px] text-left filter-pill cursor-pointer border ${
                    checked
                      ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                      : 'bg-daylight text-midnight-mouth border-midnight-mouth/8 hover:bg-sunshine-yellow/40'
                  }`}
                >
                  <span className="font-[var(--font-inter)] font-medium text-[12px] truncate">
                    {formatPricingModel(model)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    <span className="font-[var(--font-mono)] text-[10.5px] opacity-65 tabular-nums">
                      {count}
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0 transition-transform ${
                        checked
                          ? 'bg-grass-green text-[#101014] scale-100'
                          : 'border border-midnight-mouth/25 scale-90'
                      }`}
                    >
                      {checked && <Check className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Section 5: Student Eligibility Toggle (for non-student, non-MCP categories) */}
      {!isStudentCategory && !isMcpCategory && (
        <div className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2 border border-midnight-mouth/6">
          <span className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth">
            <GraduationCap className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
            <span>Student Eligibility</span>
          </span>
          <button
            type="button"
            aria-pressed={studentFriendlyOnly}
            onClick={onToggleStudentFriendly}
            className={`flex items-center justify-between gap-2 rounded-[10px] px-2.5 py-1.5 min-h-[34px] text-left filter-pill cursor-pointer border ${
              studentFriendlyOnly
                ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                : 'bg-daylight text-midnight-mouth border-midnight-mouth/8 hover:bg-grass-green/35'
            }`}
          >
            <span className="font-[var(--font-inter)] font-medium text-[12px]">
              Student-friendly only
            </span>
            <span
              className={`w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0 transition-transform ${
                studentFriendlyOnly
                  ? 'bg-grass-green text-[#101014] scale-100'
                  : 'border border-midnight-mouth/25 scale-90'
              }`}
            >
              {studentFriendlyOnly && <Check className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
