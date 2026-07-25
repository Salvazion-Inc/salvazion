'use client';

import { useI18n } from '@/components/I18nProvider';
import type { Language } from '@/lib/types';

/**
 * Global language switcher (Spanish / English) for the whole app.
 */
export default function LanguageControl({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();

  const options: { id: Language; flag: string; label: string }[] = [
    { id: 'es', flag: '🇪🇸', label: t('common.spanish') },
    { id: 'en', flag: '🇺🇸', label: t('common.english') },
  ];

  if (compact) {
    return (
      <div className="flex gap-1.5" role="group" aria-label={t('common.language')}>
        {options.map((opt) => {
          const active = lang === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLang(opt.id)}
              className={`px-2.5 py-1.5 rounded-full text-xs border transition-all ${
                active
                  ? 'border-[#00F511] bg-[#00F511]/15 text-[#00F511]'
                  : 'border-[#00B10C]/35 text-[#B7F7AC]/70 hover:border-[#00F511]/40'
              }`}
              aria-pressed={active}
            >
              {opt.flag} {opt.id.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-[#B7F7AC]/60">
          {t('common.language')}
        </p>
        <h3 className="text-base font-semibold text-[#00F511] mt-0.5">
          {t('common.chooseLanguage')}
        </h3>
        <p className="text-xs text-[#B7F7AC]/55 mt-1 leading-relaxed">
          {t('common.languageHint')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('common.language')}>
        {options.map((opt) => {
          const active = lang === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLang(opt.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border py-4 px-2 transition-all ${
                active
                  ? 'border-[#00F511] bg-[#00F511]/15 text-[#00F511] shadow-[0_0_16px_rgba(0,245,17,0.15)]'
                  : 'border-[#00B10C]/30 text-[#B7F7AC]/70 hover:border-[#00F511]/40'
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {opt.flag}
              </span>
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="text-[10px] opacity-70">{opt.id.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
