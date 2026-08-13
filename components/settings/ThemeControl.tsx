'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useI18n } from '@/components/I18nProvider';
import { THEME_PRESETS, type ThemeId } from '@/lib/store/theme';
import { useFlashToast } from '@/components/ui/FlashToast';

/**
 * Aesthetic / color palette picker — keeps Salvazion essence (dark, tech, soft glow).
 * Draft selection + explicit Guardar so the user knows the theme was applied.
 */
export default function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const { t, lang } = useI18n();
  const { flash, toast: saveToast } = useFlashToast();
  const [draft, setDraft] = useState<ThemeId>(theme);

  useEffect(() => {
    setDraft(theme);
  }, [theme]);

  const active =
    THEME_PRESETS.find((p) => p.id === draft) ||
    THEME_PRESETS.find((p) => p.id === theme) ||
    THEME_PRESETS[0];
  const dirty = draft !== theme;

  const apply = () => {
    if (!dirty) return;
    setTheme(draft);
    flash(t('common.changesSaved'));
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {saveToast}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--sage)]/60">
            {t('theme.section')}
          </p>
          <h3 className="text-base font-semibold text-[var(--accent)] mt-0.5">
            {t('theme.title')}
          </h3>
          <p className="text-xs text-[var(--sage)]/55 mt-1 leading-relaxed">
            {t('theme.hint')}
          </p>
        </div>
        <span
          className="shrink-0 w-11 h-11 rounded-full border border-[var(--border-strong)] flex items-center justify-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${active.swatch} 0%, ${active.swatchSecondary} 55%, #040404 100%)`,
          }}
          aria-hidden
          title={lang === 'en' ? active.labelEn : lang === 'pt' ? active.labelPt : active.label}
        />
      </div>

      <div
        className="grid grid-cols-2 gap-2"
        role="radiogroup"
        aria-label={t('theme.title')}
      >
        {THEME_PRESETS.map((opt) => {
          const isActive = draft === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setDraft(opt.id as ThemeId)}
              className={`text-left rounded-xl border px-3 py-3 transition-all min-h-[4.75rem] ${
                isActive
                  ? 'border-[var(--accent)] bg-[var(--surface-active)] shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_22%,transparent)]'
                  : 'border-[var(--border-soft)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span
                  className="w-7 h-7 rounded-full border border-[var(--border-strong)] shrink-0"
                  style={{
                    background: `linear-gradient(145deg, ${opt.swatch}, ${opt.swatchSecondary})`,
                    boxShadow: isActive
                      ? `0 0 12px ${opt.swatch}55`
                      : 'none',
                  }}
                  aria-hidden
                />
                <span
                  className={`text-sm font-semibold ${
                    isActive ? 'text-[var(--accent)]' : 'text-white'
                  }`}
                >
                  {lang === 'en' ? opt.labelEn : lang === 'pt' ? opt.labelPt : opt.label}
                </span>
              </div>
              <p className="text-[10px] text-[var(--sage)]/75 leading-snug pl-0.5">
                {lang === 'en' ? opt.hintEn : lang === 'pt' ? opt.hintPt : opt.hint}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--true-black)]/50 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/45 mb-1.5">
          {t('theme.preview')}
        </p>
        <p className="text-sm text-[var(--off-white)] leading-relaxed">
          {t('theme.previewLine1')}
        </p>
        <p className="text-xs text-[var(--sage)] mt-1.5 leading-relaxed">
          {t('theme.previewLine2')}
        </p>
        <div className="mt-3 flex gap-2">
          <span className="flex-1 h-8 rounded-lg bg-[var(--accent-fill)]" />
          <span className="flex-1 h-8 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-active)]" />
          <span className="flex-1 h-8 rounded-lg bg-[var(--sage-dim)]/40" />
        </div>
      </div>

      {dirty && (
        <p className="text-[11px] text-[var(--accent)]">{t('common.unsavedChanges')}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn-secondary text-sm py-2.5"
          disabled={!dirty}
          onClick={() => setDraft(theme)}
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
