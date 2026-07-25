'use client';

import { useTextScale } from '@/components/TextScaleProvider';
import { useI18n } from '@/components/I18nProvider';
import { TEXT_SCALE_OPTIONS, type TextScale } from '@/lib/store/text-scale';

/**
 * Accessible text-size control — keeps Salvazion visual system while scaling type.
 */
export default function TextScaleControl() {
  const { scale, setScale } = useTextScale();
  const { t, lang } = useI18n();

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#B7F7AC]/60">
            {t('textScale.accessibility')}
          </p>
          <h3 className="text-base font-semibold text-[#8FD99A] mt-0.5">
            {t('textScale.title')}
          </h3>
          <p className="text-xs text-[#B7F7AC]/55 mt-1 leading-relaxed">
            {t('textScale.hint')}
          </p>
        </div>
        <span
          className="shrink-0 w-11 h-11 rounded-full border border-[#8FD99A]/40 flex items-center justify-center text-[#8FD99A] font-semibold"
          style={{
            fontSize:
              scale === 'md' ? '0.95rem' : scale === 'lg' ? '1.1rem' : scale === 'xl' ? '1.25rem' : '1.4rem',
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
          const active = scale === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setScale(opt.id as TextScale)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-3 px-1 transition-all min-h-[4.5rem] ${
                active
                  ? 'border-[#8FD99A] bg-[#7BC98A]/15 text-[#8FD99A] shadow-[0_0_16px_rgba(143, 217, 154,0.15)]'
                  : 'border-[#6B8F6E]/30 text-[#B7F7AC]/70 hover:border-[#8FD99A]/40'
              }`}
            >
              <span
                className="font-semibold leading-none text-[#8FD99A]"
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
                {lang === 'en' ? opt.labelEn : opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#6B8F6E]/25 bg-[#040404]/50 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-[#B7F7AC]/45 mb-1.5">
          {t('textScale.preview')}
        </p>
        <p className="text-sm text-[#D8E1D9]/90 leading-relaxed">
          {t('textScale.previewLine1')}
        </p>
        <p className="text-xs text-[#B7F7AC]/60 mt-1.5 leading-relaxed">
          {t('textScale.previewLine2')}
        </p>
      </div>
    </div>
  );
}
