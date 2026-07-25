'use client';

import { useTextScale } from '@/components/TextScaleProvider';
import { TEXT_SCALE_OPTIONS, type TextScale } from '@/lib/store/text-scale';

/**
 * Accessible text-size control — keeps Salvazion visual system while scaling type.
 */
export default function TextScaleControl({ lang = 'es' }: { lang?: 'es' | 'en' }) {
  const { scale, setScale } = useTextScale();

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#B7F7AC]/60">
            {lang === 'en' ? 'Accessibility' : 'Accesibilidad'}
          </p>
          <h3 className="text-base font-semibold text-[#00F511] mt-0.5">
            {lang === 'en' ? 'Text size' : 'Tamaño de letra'}
          </h3>
          <p className="text-xs text-[#B7F7AC]/55 mt-1 leading-relaxed">
            {lang === 'en'
              ? 'Increases text across the whole app. Layout and buttons stay usable.'
              : 'Aumenta el texto en toda la app. El diseño y los botones siguen siendo usables.'}
          </p>
        </div>
        <span
          className="shrink-0 w-11 h-11 rounded-full border border-[#00F511]/40 flex items-center justify-center text-[#00F511] font-semibold"
          style={{ fontSize: scale === 'md' ? '0.95rem' : scale === 'lg' ? '1.1rem' : scale === 'xl' ? '1.25rem' : '1.4rem' }}
          aria-hidden
        >
          Aa
        </span>
      </div>

      <div
        className="grid grid-cols-4 gap-2"
        role="radiogroup"
        aria-label={lang === 'en' ? 'Text size' : 'Tamaño de letra'}
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
                  ? 'border-[#00F511] bg-[#00F511]/15 text-[#00F511] shadow-[0_0_16px_rgba(0,245,17,0.15)]'
                  : 'border-[#00B10C]/30 text-[#B7F7AC]/70 hover:border-[#00F511]/40'
              }`}
            >
              <span
                className="font-semibold leading-none text-[#00F511]"
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

      {/* Live preview */}
      <div className="rounded-xl border border-[#00B10C]/25 bg-[#040404]/50 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-[#B7F7AC]/45 mb-1.5">
          {lang === 'en' ? 'Preview' : 'Vista previa'}
        </p>
        <p className="text-sm text-[#D8E1D9]/90 leading-relaxed">
          {lang === 'en'
            ? 'Make Salvation, Health and Freedom Great Again.'
            : 'Make Salvation, Health and Freedom Great Again.'}
        </p>
        <p className="text-xs text-[#B7F7AC]/60 mt-1.5 leading-relaxed">
          {lang === 'en'
            ? 'The Word of God lights the path of the Phalanx.'
            : 'La Palabra de Dios ilumina el camino de la Phalanx.'}
        </p>
      </div>
    </div>
  );
}
