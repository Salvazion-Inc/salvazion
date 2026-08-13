'use client';

import { useEffect, useState } from 'react';
import { useTextScale } from '@/components/TextScaleProvider';
import { useI18n } from '@/components/I18nProvider';
import { TEXT_SCALE_OPTIONS, type TextScale } from '@/lib/store/text-scale';
import { useFlashToast } from '@/components/ui/FlashToast';

/**
 * Accessible text-size control — draft + Guardar so size changes are intentional.
 */
export default function TextScaleControl() {
  const { scale, setScale } = useTextScale();
  const { t, lang } = useI18n();
  const { flash, toast: saveToast } = useFlashToast();
  const [draft, setDraft] = useState<TextScale>(scale);

  useEffect(() => {
    setDraft(scale);
  }, [scale]);

  const dirty = draft !== scale;

  const apply = () => {
    if (!dirty) return;
    setScale(draft);
    flash(t('common.changesSaved'));
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {saveToast}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--sage)]/70">
            {t('textScale.accessibility')}
          </p>
          <h3 className="text-base font-semibold text-[var(--accent)] mt-0.5">
            {t('textScale.title')}
          </h3>
          <p className="text-xs text-[var(--sage)]/70 mt-1 leading-relaxed">
            {t('textScale.hint')}
          </p>
        </div>
        <span
          className="shrink-0 w-11 h-11 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent)] font-semibold"
          style={{
            fontSize:
              draft === 'md'
                ? '0.95rem'
                : draft === 'lg'
                  ? '1.1rem'
                  : draft === 'xl'
                    ? '1.25rem'
                    : '1.4rem',
          }}
          aria-hidden
        >
          Aa
        </span>
      </div>

      <div
        className="grid grid-cols-4 gap-2"
        role="radiogroup"
        aria-label={t('textScale.title')}
      >
        {TEXT_SCALE_OPTIONS.map((opt) => {
          const active = draft === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setDraft(opt.id as TextScale)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-3 px-1 transition-all min-h-[4.5rem] ${
                active
                  ? 'border-[var(--border-strong)] bg-[var(--surface-active)] text-[var(--accent)] shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
                  : 'border-[var(--border-soft)] text-[var(--sage)] hover:border-[var(--border-strong)]'
              }`}
            >
              <span
                className="font-semibold leading-none text-[var(--accent)]"
                style={{
                  fontSize:
                    opt.id === 'md'
                      ? '0.95rem'
                      : opt.id === 'lg'
                        ? '1.15rem'
                        : opt.id === 'xl'
                          ? '1.35rem'
                          : '1.55rem',
                }}
              >
                {opt.sample}
              </span>
              <span className="text-[10px] text-center leading-tight px-0.5">
                {lang === 'en' ? opt.labelEn : lang === 'pt' ? opt.labelPt : opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/60 mb-1.5">
          {t('textScale.preview')}
        </p>
        <p className="text-sm text-[var(--off-white)]/90 leading-relaxed">
          {t('textScale.previewLine1')}
        </p>
        <p className="text-xs text-[var(--sage)]/70 mt-1.5 leading-relaxed">
          {t('textScale.previewLine2')}
        </p>
      </div>

      {dirty && (
        <p className="text-[11px] text-[var(--accent)]">{t('common.unsavedChanges')}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn-secondary text-sm py-2.5"
          disabled={!dirty}
          onClick={() => setDraft(scale)}
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="btn-primary text-sm py-2.5"
          disabled={!dirty}
          onClick={apply}
        >
          {dirty ? t('common.saveChanges') : t('common.saved')}
        </button>
      </div>
    </div>
  );
}
