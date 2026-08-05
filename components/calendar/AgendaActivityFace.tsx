'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import {
  agendaBlockLayout,
  formatDurationHours,
  type AgendaBlockLayout,
  type CalendarPillar,
} from '@/lib/calendar/engine';
import type { CalendarPillarPalette } from '@/lib/calendar/colors';

type Props = {
  layout: AgendaBlockLayout;
  title: string;
  timeLabel: string;
  /** Secondary time range / end, e.g. "07:15" or "07:00–07:15" */
  rangeLabel?: string;
  durationMin: number;
  pillar: CalendarPillar;
  pal: CalendarPillarPalette;
  done?: boolean;
  isNow?: boolean;
  nowBadge?: ReactNode;
  /** Sí/No controls */
  actions: ReactNode;
  /**
   * Preferred: navigate to activity destination (Bible, Health tab, etc.).
   * Renders as a real link for accessibility + open-in-new-tab.
   */
  openHref?: string;
  /** Fallback / secondary open when no href (legacy) */
  onOpen?: () => void;
  /** Optional edit affordance (schedule) — shown next to actions when set */
  onEdit?: () => void;
  editLabel?: string;
  openLabel?: string;
  /** Optional leading stripe (caller can also put outside) */
  showStripe?: boolean;
  className?: string;
  style?: CSSProperties;
};

const PILLAR_MARK: Record<CalendarPillar, string> = {
  salvation: 'S',
  health: 'H',
  freedom: 'F',
};

/**
 * Adaptive activity face for calendar/agenda rows.
 * Tapping the main body opens the linked activity (Bible, Devotional, Health…).
 */
export default function AgendaActivityFace({
  layout,
  title,
  timeLabel,
  rangeLabel,
  durationMin,
  pillar,
  pal,
  done,
  isNow,
  nowBadge,
  actions,
  openHref,
  onOpen,
  onEdit,
  editLabel = 'Edit',
  openLabel,
  showStripe = true,
  className = '',
  style,
}: Props) {
  const dur = formatDurationHours(durationMin);
  const mark = PILLAR_MARK[pillar];
  const compact = layout === 'compact';
  const cozy = layout === 'cozy';
  const canOpen = !!(openHref || onOpen);
  const a11yOpen = openLabel || title;

  const typeChip = (
    <span
      className={`inline-flex items-center gap-1 shrink-0 rounded-md font-bold uppercase tracking-wide ${
        compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[9px] px-1.5 py-0.5'
      }`}
      style={{
        color: pal.lightPlate ? pal.text : pal.solid,
        background: pal.lightPlate
          ? 'rgba(18, 20, 18, 0.08)'
          : `color-mix(in srgb, ${pal.solid} 22%, transparent)`,
        border: `1px solid ${
          pal.lightPlate
            ? 'rgba(18, 20, 18, 0.14)'
            : `color-mix(in srgb, ${pal.solid} 40%, transparent)`
        }`,
        maxWidth: compact ? '42%' : '100%',
      }}
      title={title}
    >
      <span className="opacity-80 tabular-nums" aria-hidden>
        {mark}
      </span>
      <span className="truncate normal-case tracking-normal font-semibold">
        {title}
      </span>
    </span>
  );

  const openChevron = canOpen ? (
    <span
      className="text-[11px] font-semibold shrink-0 opacity-55 group-hover/open:opacity-100 group-hover/open:translate-x-0.5 transition-all"
      style={{ color: pal.text }}
      aria-hidden
    >
      →
    </span>
  ) : null;

  const openInteractiveClass = canOpen
    ? 'group/open min-w-0 flex-1 text-left rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] active:scale-[0.99] transition cursor-pointer'
    : 'min-w-0 flex-1 text-left';

  const wrapOpen = (inner: ReactNode, classNameInner: string) => {
    if (openHref) {
      return (
        <Link
          href={openHref}
          className={`${openInteractiveClass} ${classNameInner}`}
          aria-label={a11yOpen}
          title={a11yOpen}
        >
          {inner}
        </Link>
      );
    }
    return (
      <button
        type="button"
        className={`${openInteractiveClass} ${classNameInner}`}
        onClick={onOpen}
        disabled={!onOpen}
        aria-label={a11yOpen}
        title={a11yOpen}
      >
        {inner}
      </button>
    );
  };

  const editBtn =
    onEdit != null ? (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }}
        className="shrink-0 w-8 h-8 rounded-lg border text-[12px] font-semibold flex items-center justify-center transition-colors hover:opacity-100 opacity-80"
        style={{
          borderColor: pal.border,
          color: pal.muted,
          background: pal.lightPlate
            ? 'rgba(18,20,18,0.06)'
            : 'rgba(0,0,0,0.2)',
        }}
        aria-label={editLabel}
        title={editLabel}
      >
        ✎
      </button>
    ) : null;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 w-full min-h-0 h-full px-0.5 ${className}`}
        style={style}
      >
        {showStripe && (
          <span
            className={`self-stretch rounded-full shrink-0 w-1 ${
              isNow ? 'now-block-stripe w-1.5' : ''
            }`}
            style={
              {
                '--now-glow': pal.lightPlate
                  ? 'color-mix(in srgb, #121412 55%, #F5F7F5)'
                  : pal.solid,
                background: pal.lightPlate
                  ? 'color-mix(in srgb, #121412 55%, #F5F7F5)'
                  : pal.solid,
              } as CSSProperties
            }
            aria-hidden
          />
        )}
        {wrapOpen(
          <>
            <span
              className="text-[11px] font-semibold tabular-nums shrink-0 leading-none"
              style={{ color: pal.text }}
            >
              {timeLabel}
            </span>
            {typeChip}
            {isNow && nowBadge ? (
              <span className="shrink-0 scale-90 origin-left">{nowBadge}</span>
            ) : (
              <span
                className="text-[9px] tabular-nums shrink-0 opacity-75 ml-auto"
                style={{ color: pal.muted }}
              >
                {dur}
              </span>
            )}
            {openChevron}
          </>,
          'flex items-center gap-1.5'
        )}
        {editBtn}
        <div className="shrink-0 scale-[0.92] origin-right">{actions}</div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-stretch gap-2 w-full min-h-0 h-full ${className}`}
      style={style}
    >
      {showStripe && (
        <span
          className={`self-stretch rounded-full shrink-0 ${
            isNow ? 'w-1.5 now-block-stripe' : 'w-1'
          }`}
          style={
            {
              '--now-glow': pal.lightPlate
                ? 'color-mix(in srgb, #121412 55%, #F5F7F5)'
                : pal.solid,
              background: pal.lightPlate
                ? 'color-mix(in srgb, #121412 55%, #F5F7F5)'
                : pal.solid,
            } as CSSProperties
          }
          aria-hidden
        />
      )}

      {wrapOpen(
        <>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span
              className={`font-semibold tabular-nums shrink-0 leading-none ${
                cozy ? 'text-[11px]' : 'text-[12px]'
              }`}
              style={{ color: pal.text }}
            >
              {timeLabel}
            </span>
            {rangeLabel ? (
              <span
                className="text-[9px] tabular-nums opacity-75 shrink-0"
                style={{ color: pal.muted }}
              >
                {rangeLabel}
              </span>
            ) : null}
            <span
              className="text-[9px] tabular-nums opacity-75 shrink-0"
              style={{ color: pal.muted }}
            >
              · {dur}
            </span>
            {isNow && nowBadge ? (
              <span className="shrink-0">{nowBadge}</span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-extrabold shrink-0"
              style={{
                color: pal.lightPlate ? '#F5F7F5' : '#0a120c',
                background: pal.lightPlate ? '#121412' : pal.solid,
              }}
              aria-hidden
            >
              {mark}
            </span>
            <p
              className={`font-semibold leading-snug truncate min-w-0 ${
                done ? 'line-through opacity-65' : ''
              } ${isNow ? 'text-[13px]' : cozy ? 'text-[12px]' : 'text-[13px]'}`}
              style={{ color: pal.text }}
            >
              {title}
            </p>
            {openChevron}
          </div>
        </>,
        `flex flex-col ${cozy ? 'justify-center gap-0.5' : 'justify-center gap-1 py-0.5'}`
      )}

      <div className="shrink-0 self-center flex items-center gap-1.5">
        {editBtn}
        {actions}
      </div>
    </div>
  );
}

export function useAgendaLayout(durationMin: number): AgendaBlockLayout {
  return agendaBlockLayout(durationMin);
}
