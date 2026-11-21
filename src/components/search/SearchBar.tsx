import React, { useEffect, useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  initialQuery?: string;
  onSubmitQuery: (query: string) => void;
  onChangeQuery?: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  suggestions?: string[];
  label?: string;
  inputId?: string;
}

const EXAMPLE_QUERIES = [
  'Free LLM API for Python',
  'Official MCP servers',
  'Free PostgreSQL hosting',
  'Frontend & Tailwind UI tools',
  'Student cloud credits',
  'No credit card hosting',
];

export function SearchBar({
  initialQuery = '',
  onSubmitQuery,
  onChangeQuery,
  placeholder = 'Search AI models, MCP servers, APIs, frontend tools, databases...',
  showSuggestions = false,
  suggestions,
  label = 'Search FreeStack resources',
  inputId = 'freestack-search-input',
}: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue((prev) => (prev.trim() === initialQuery.trim() ? prev : initialQuery));
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitQuery(value.trim());
  };

  const handleChange = (nextVal: string) => {
    setValue(nextVal);
    if (onChangeQuery) {
      onChangeQuery(nextVal);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    const next = value === suggestion ? '' : suggestion;
    setValue(next);
    if (onChangeQuery) {
      onChangeQuery(next);
    }
    onSubmitQuery(next);
  };

  const suggestionList = suggestions && suggestions.length > 0 ? suggestions : EXAMPLE_QUERIES;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="w-full bg-daylight rounded-full p-1 sm:p-1.5 pl-3 sm:pl-5 flex items-center gap-1.5 sm:gap-2 border border-midnight-mouth/12 focus-within:border-midnight-mouth/35 shadow-xs transition-all"
      >
        <Search className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-midnight-mouth shrink-0" aria-hidden="true" />
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <input
          id={inputId}
          type="search"
          enterKeyHint="search"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-midnight-mouth placeholder:text-ink/55 font-[var(--font-inter)] text-[13px] sm:text-[14.5px] leading-[1.2] py-1 sm:py-2 focus:outline-none"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setValue('');
              if (onChangeQuery) onChangeQuery('');
              onSubmitQuery('');
            }}
            aria-label="Clear search query"
            className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-full bg-paper text-midnight-mouth inline-flex items-center justify-center shrink-0 hover:bg-sunshine-yellow transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13.5px] leading-none rounded-full px-3 sm:px-5 py-1.5 sm:py-2.5 min-h-[32px] sm:min-h-[38px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 spring-pill cursor-pointer"
        >
          <span>Search</span>
          <ArrowRight className="hidden sm:block w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </form>

      {showSuggestions && suggestionList.length > 0 && (
        <div
          aria-label="Suggested searches"
          className="mt-2 sm:mt-2.5 flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-1.5 overflow-x-auto sm:overflow-visible no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 py-0.5"
        >
          <span className="font-[var(--font-inter)] font-medium text-[11px] sm:text-[12px] text-midnight-mouth/75 mr-0.5 shrink-0">
            Quick search:
          </span>
          {suggestionList.map((example) => {
            const isSelected = value.toLowerCase() === example.toLowerCase();
            return (
              <button
                key={example}
                type="button"
                onClick={() => handleSuggestion(example)}
                className={`font-[var(--font-wallop)] font-semibold text-[11px] sm:text-[12.5px] rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 min-h-[26px] sm:min-h-[28px] filter-pill whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-midnight-mouth text-daylight shadow-xs'
                    : 'bg-daylight/90 hover:bg-sunshine-yellow text-midnight-mouth'
                }`}
              >
                {example}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
