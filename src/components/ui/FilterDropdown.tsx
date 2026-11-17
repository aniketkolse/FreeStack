import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface FilterDropdownOption {
  value: string;
  label: string;
  count?: number | string;
  description?: string;
  icon?: React.ReactNode;
  iconBgClass?: string;
}

interface FilterDropdownProps {
  id: string;
  label: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  menuTitle?: string;
  menuSubtitle?: string;
  minMenuWidth?: number;
  maxMenuHeight?: number;
  size?: 'md' | 'sm';
}

interface MenuCoords {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'bottom' | 'top';
}

export function FilterDropdown({
  id,
  label,
  value,
  options,
  onChange,
  menuTitle,
  menuSubtitle,
  minMenuWidth = 260,
  maxMenuHeight = 360,
  size = 'md',
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((opt) => opt.value === value);
    return idx >= 0 ? idx : 0;
  }, [options, value]);

  const selectedOption = options[selectedIndex] ?? options[0];

  const computeCoords = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const gap = 8;
    const edgePad = 12;

    const desiredWidth = Math.min(
      Math.max(rect.width, minMenuWidth),
      viewportW - edgePad * 2
    );

    // Center horizontally relative to trigger and clamp within viewport edges
    let left = rect.left + (rect.width - desiredWidth) / 2;
    if (left + desiredWidth > viewportW - edgePad) {
      left = Math.max(edgePad, viewportW - edgePad - desiredWidth);
    }
    if (left < edgePad) {
      left = edgePad;
    }

    const spaceBelow = viewportH - rect.bottom - gap - edgePad;
    const spaceAbove = rect.top - gap - edgePad;

    const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const availableSpace = Math.max(180, openAbove ? spaceAbove : spaceBelow);
    const resolvedMaxHeight = Math.min(maxMenuHeight, availableSpace);

    const top = openAbove
      ? Math.max(edgePad, rect.top - gap)
      : rect.bottom + gap;

    setCoords({
      top,
      left,
      width: desiredWidth,
      maxHeight: resolvedMaxHeight,
      placement: openAbove ? 'top' : 'bottom',
    });
  }, [maxMenuHeight, minMenuWidth]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    computeCoords();

    const handleReposition = () => {
      computeCoords();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, selectedIndex, computeCoords]);

  useEffect(() => {
    if (!open) return;
    const el = optionRefs.current[activeIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      menuRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, coords !== null]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
      } else {
        setActiveIndex((prev) =>
          e.key === 'ArrowDown'
            ? (prev + 1) % options.length
            : (prev - 1 + options.length) % options.length
        );
        menuRef.current?.focus({ preventScroll: true });
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
      } else {
        setOpen(false);
      }
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const activeOpt = options[activeIndex];
      if (activeOpt) {
        handleSelect(activeOpt.value);
      }
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-label={`${label}: ${selectedOption?.label ?? ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              setActiveIndex(selectedIndex);
            }
            return next;
          });
        }}
        onKeyDown={handleTriggerKeyDown}
        className={`w-full flex items-center justify-between gap-2 text-left bg-daylight text-midnight-mouth cursor-pointer transition-all duration-150 border ${
          isSmall
            ? 'rounded-[10px] px-2.5 py-1.5 min-h-[34px]'
            : 'rounded-[12px] px-2.5 py-1.5 min-h-[38px]'
        } ${
          open
            ? 'bg-paper border-midnight-mouth/35 ring-2 ring-midnight-mouth/10 shadow-xs'
            : 'border-midnight-mouth/12 hover:border-midnight-mouth/28 hover:bg-paper/85'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span
              className={`inline-flex items-center justify-center shrink-0 ${
                isSmall ? 'w-5 h-5 rounded-[6px]' : 'w-6 h-6 rounded-[8px]'
              } ${selectedOption.iconBgClass ?? 'bg-paper border border-midnight-mouth/10'}`}
              aria-hidden="true"
            >
              {selectedOption.icon}
            </span>
          )}
          <span
            className={`font-[var(--font-wallop)] font-semibold truncate ${
              isSmall ? 'text-[12px]' : 'text-[12.5px]'
            }`}
          >
            {selectedOption?.label}
          </span>
        </span>

        <span className="inline-flex items-center gap-1.5 shrink-0">
          {selectedOption?.count !== undefined && (
            <span className="font-[var(--font-mono)] text-[10.5px] font-medium text-midnight-mouth/65 bg-paper/90 border border-midnight-mouth/8 rounded-full px-1.5 py-0.5 leading-none tabular-nums">
              {selectedOption.count}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-midnight-mouth/70 transition-transform duration-200 ${
              open ? 'rotate-180 text-midnight-mouth' : ''
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={`${id}-opt-${activeIndex}`}
            onKeyDown={handleMenuKeyDown}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              transform: coords.placement === 'top' ? 'translateY(-100%)' : undefined,
              zIndex: 80,
            }}
            className="bg-paper text-midnight-mouth rounded-[18px] border border-midnight-mouth/14 shadow-[0_20px_50px_-12px_rgba(16,16,20,0.24),0_4px_14px_-4px_rgba(16,16,20,0.08)] dark:shadow-[0_24px_56px_-12px_rgba(0,0,0,0.7)] overflow-hidden outline-none dropdown-enter"
          >
            {(menuTitle || menuSubtitle) && (
              <div className="px-3.5 py-2.5 border-b border-midnight-mouth/8 bg-daylight/55 flex items-center justify-between gap-2">
                {menuTitle && (
                  <span className="font-[var(--font-wallop)] font-bold text-[11.5px] tracking-[-0.01em] text-midnight-mouth">
                    {menuTitle}
                  </span>
                )}
                {menuSubtitle && (
                  <span className="font-[var(--font-mono)] text-[10.5px] text-midnight-mouth/60 tabular-nums">
                    {menuSubtitle}
                  </span>
                )}
              </div>
            )}

            <div
              style={{ maxHeight: coords.maxHeight }}
              className="overflow-y-auto p-1.5 flex flex-col gap-0.5"
            >
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === activeIndex;

                return (
                  <button
                    key={opt.value}
                    id={`${id}-opt-${idx}`}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-[12px] px-2.5 py-1.5 text-left transition-colors duration-120 cursor-pointer ${
                      isSelected
                        ? 'bg-midnight-mouth text-daylight shadow-xs'
                        : isHighlighted
                        ? 'bg-daylight text-midnight-mouth ring-1 ring-midnight-mouth/15'
                        : 'text-midnight-mouth hover:bg-daylight/80'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon && (
                        <span
                          className={`w-7 h-7 rounded-[9px] inline-flex items-center justify-center shrink-0 transition-transform duration-150 ${
                            opt.iconBgClass ??
                            (isSelected
                              ? 'bg-paper/15 text-daylight'
                              : 'bg-daylight border border-midnight-mouth/8 text-midnight-mouth')
                          }`}
                          aria-hidden="true"
                        >
                          {opt.icon}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-[var(--font-wallop)] font-semibold text-[13px] leading-[1.2] truncate">
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span
                            className={`block font-[var(--font-inter)] text-[11px] leading-[1.2] mt-0.5 truncate ${
                              isSelected ? 'text-daylight/75' : 'text-ink/60'
                            }`}
                          >
                            {opt.description}
                          </span>
                        )}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-2 shrink-0">
                      {opt.count !== undefined && (
                        <span
                          className={`font-[var(--font-mono)] text-[11px] tabular-nums ${
                            isSelected ? 'text-daylight/80' : 'text-midnight-mouth/60'
                          }`}
                        >
                          {opt.count}
                        </span>
                      )}
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-grass-green text-[#101014] inline-flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
