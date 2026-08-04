'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import LanguageFlagSwitch from '@/components/ui/LanguageFlagSwitch';
import FlatFlag from '@/components/ui/FlatFlag';
import type { Language } from '@/lib/types';
import { useFlashToast } from '@/components/ui/FlashToast';

/**
 * Global language switcher (Spanish / English) for auth + app settings.
 * Compact (login/signup): applies immediately (auth needs instant switch).
 * Full (settings): draft + Guardar so the user confirms the change was saved.
 */
export default function LanguageControl({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const { flash, toast: saveToast } = useFlashToast();
  const [draft, setDraft] = useState<Language>(lang);

  useEffect(() => {
    setDraft(lang);
  }, [lang]);

  const dirty = draft !== lang;

  const options: { id: Language; label: string }[] = [
    { id: 'en', label: t('common.english') },
    { id: 'es', label: t('common.spanish') },
  ];

  if (compact) {
    return (
      <LanguageFlagSwitch
        value={lang}
        onChange={setLang}
        ariaLabel={t('common.language')}
        size="md"
      />
    );
  }

  const apply = () => {
    if (!dirty) return;
    setLang(draft);
    // Flash after lang switch — dictionary updates to new language
    window.setTimeout(() => {
      flash(
        draft === 'es' ? 'Cambios guardados' : 'Changes saved'
      );
    }, 0);
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {saveToast}
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--sage)]/80">
          {t('common.language')}
        </p>
        <h3 className="text-base font-semibold text-[var(--accent)] mt-0.5">
          {t('common.chooseLanguage')}
        </h3>
        <p className="text-xs text-[var(--sage)]/70 mt-1 leading-relaxed">
          {t('common.languageHint')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('common.language')}>
        {options.map((opt) => {
          const active = draft === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setDraft(opt.id)}
              className={[
                'flex flex-col items-center gap-2.5 rounded-xl border py-4 px-2 transition-all',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] shadow-[0_0_16px_rgba(143,217,154,0.15)]'
                  : 'border-[var(--border-soft)] text-[var(--sage)] hover:border-[var(--border-strong)] hover:text-[var(--off-white)]',
              ].join(' ')}
            >
              {/* Match landing LanguageFlagSwitch frame (≈ 3:2, object-contain) */}
              <span
                className={[
                  'relative inline-flex h-10 w-16 shrink-0 items-center justify-center',
                  'overflow-hidden rounded-lg bg-[#0a0a0a] p-[3px]',
                  active
                    ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[#040404]'
                    : 'ring-1 ring-white/10',
                ].join(' ')}
              >
                <FlatFlag
                  lang={opt.id}
                  size="lg"
                  className="!h-full !w-full !max-w-none object-contain object-center rounded-md"
                />
              </span>
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                {opt.id}
              </span>
            </button>
          );
        })}
      </div>

      {dirty && (
        <p className="text-[11px] text-[var(--accent)]">{t('common.unsavedChanges')}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn-secondary text-sm py-2.5"
          disabled={!dirty}
          onClick={() => setDraft(lang)}
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
