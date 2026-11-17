import React, { useEffect, useMemo, useState } from 'react';
import { Home } from 'lucide-react';
import { CATEGORIES, getCategoryCounts } from '../lib/data/resources';
import type { NavigateOptions } from '../lib/router/useRouter';
import { CategoryTile } from '../components/categories/CategoryTile';
import { SearchBar } from '../components/search/SearchBar';

interface CategoriesPageProps {
  searchParams?: URLSearchParams;
  onNavigate: (path: string, options?: NavigateOptions) => void;
}

export function CategoriesPage({ searchParams, onNavigate }: CategoriesPageProps) {
  const counts = getCategoryCounts();
  const [query, setQuery] = useState<string>(searchParams?.get('q') || '');

  useEffect(() => {
    setQuery(searchParams?.get('q') || '');
  }, [searchParams]);

  const syncCategoriesUrl = (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    onNavigate(trimmed ? `/categories?q=${encodeURIComponent(trimmed)}` : '/categories', {
      replace: true,
      scrollTop: false,
    });
  };

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.shortName.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.subcategories.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 flex flex-col gap-5 sm:gap-7">
      <section className="bg-bubblegum-pink rounded-[22px] sm:rounded-[26px] p-4 sm:p-7 md:p-8 text-center flex flex-col items-center gap-3">
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
        <h1 className="font-[var(--font-wallop)] font-extrabold text-[26px] sm:text-[36px] lg:text-[44px] leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
          All categories
        </h1>
        <p className="font-[var(--font-inter)] text-[14px] sm:text-[15px] leading-[1.45] text-ink max-w-xl">
          Browse {CATEGORIES.length} structured resource categories covering AI Models, MCP servers, APIs, Frontend &amp; Design Tools, Cloud Hosting, Databases, Dev Tools, Learning, and Student Benefits.
        </p>
        <div className="w-full pt-1">
          <SearchBar
            inputId="categories-search-input"
            initialQuery={query}
            onChangeQuery={(nextQ) => {
              setQuery(nextQ);
              syncCategoriesUrl(nextQ);
            }}
            onSubmitQuery={(nextQ) => {
              setQuery(nextQ);
              syncCategoriesUrl(nextQ);
            }}
            placeholder="Search categories or subcategories (e.g., AI Models, MCP, Frontend, Cloud)..."
            label="Search categories"
            showSuggestions={true}
            suggestions={['AI Models', 'MCP', 'APIs', 'Frontend & Design', 'PostgreSQL', 'Students']}
          />
        </div>
      </section>

      {filteredCategories.length === 0 ? (
        <div className="bg-daylight rounded-[20px] p-7 text-center flex flex-col items-center gap-3">
          <p className="font-[var(--font-inter)] text-[14px] text-ink/80">
            No categories matched &ldquo;{query}&rdquo;. Try searching all resources directly.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuery('')}
              className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 cursor-pointer"
            >
              Show all categories
            </button>
            <button
              type="button"
              onClick={() => onNavigate(`/explore?q=${encodeURIComponent(query.trim())}`)}
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 cursor-pointer"
            >
              Search &ldquo;{query.trim()}&rdquo; in Explore
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredCategories.map((category, idx) => (
            <CategoryTile
              key={category.slug}
              category={category}
              count={counts[category.slug] ?? 0}
              onNavigate={onNavigate}
              showWave={idx % 3 === 0}
              detailed
            />
          ))}
        </div>
      )}
    </div>
  );
}
