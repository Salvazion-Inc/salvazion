'use client';

import { useI18n } from '@/components/I18nProvider';
import FlatFlag from '@/components/ui/FlatFlag';
import type { Language } from '@/lib/types';

/**
 * Global language switcher (Spanish / English) for the whole app.
 * Flat Chile (ES) and USA (EN) flags — no photo wrinkles.
 */
export default function LanguageControl({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();

  const options: { id: Language; label: string }[] = [
    { id: 'es', label: t('common.spanish') },
    { id: 'en', label: t('common.english') },
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border transition-all ${
                active
                  ? 'border-[#8FD99A] bg-[#7BC98A]/15 text-[#8FD99A]'
                  : 'border-[#6B8F6E]/35 text-[#B7F7AC]/70 hover:border-[#8FD99A]/40'
              }`}
              aria-pressed={active}
              aria-label={opt.label}
            >
              <span className="inline-flex h-5 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black/40 p-px ring-1 ring-black/20">
                <FlatFlag
                  lang={opt.id}
                  size="sm"
                  className="!h-full !w-full object-contain"
                />
              </span>
              <span>{opt.id.toUpperCase()}</span>
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
        <h3 className="text-base font-semibold text-[#8FD99A] mt-0.5">
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
              className={`flex flex-col items-center gap-2 rounded-xl border py-4 px-2 transition-all ${
                active
                  ? 'border-[#8FD99A] bg-[#7BC98A]/15 text-[#8FD99A] shadow-[0_0_16px_rgba(143,217,154,0.15)]'
                  : 'border-[#6B8F6E]/30 text-[#B7F7AC]/70 hover:border-[#8FD99A]/40'
              }`}
            >
              <span className="inline-flex h-10 w-16 items-center justify-center overflow-hidden rounded-lg bg-black/40 p-0.5 ring-1 ring-white/10 shadow-sm">
                <FlatFlag
                  lang={opt.id}
                  size="lg"
                  className="!h-full !w-full object-contain"
                />
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
