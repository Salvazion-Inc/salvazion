import { loadProfile, calculateAge, getLifeStage, LifeStage } from '@/lib/store/profile';
import { getPointsForAction } from '@/lib/scoring/engine';

export interface HealthActionDef {
  id: string;
  category: 'exercise' | 'nutrition' | 'sleep';
  label: string;
  description: string;
  actionType: string; // key in ACTION_CATALOG
  icon: string;
  sensorHint?: string;
}

/** Acciones de Health adaptadas por etapa */
export function getHealthActionsForStage(stage: LifeStage): HealthActionDef[] {
  const all: HealthActionDef[] = [
    {
      id: 'hit',
      category: 'exercise',
      label: stage === 'infancia' ? 'Moverte / jugar' : stage === 'senior' ? 'Movimiento activo' : 'HIT / Entrenamiento',
      description:
        stage === 'infancia'
          ? 'Juego activo o movimiento intenso al menos 15 min'
          : stage === 'senior'
            ? 'Ejercicio adaptado (fuerza suave, movilidad) ≥ 15 min'
            : 'Entrenamiento de alta intensidad o deporte ≥ 15 min',
      actionType: 'hit_15min',
      icon: '⚡',
      sensorHint: 'Acelerómetro / GPS (Capacitor)'
    },
    {
      id: 'outdoor',
      category: 'exercise',
      label: stage === 'infancia' ? 'Aire libre y sol' : 'Aire libre + sol',
      description:
        stage === 'infancia'
          ? 'Jugar o estar afuera bajo el sol ≥ 20 min'
          : stage === 'senior'
            ? 'Caminar al aire libre con sol ≥ 20 min'
            : 'Actividad al aire libre expuesta al sol ≥ 20 min',
      actionType: 'outdoor_sun_20min',
      icon: '☀️',
      sensorHint: 'GPS + luz ambiental'
    },
    {
      id: 'hydration',
      category: 'nutrition',
      label: 'Hidratación',
      description: 'Completar tu meta de agua del día',
      actionType: 'hydration_daily',
      icon: '💧'
    },
    {
      id: 'fasting',
      category: 'nutrition',
      label: 'Ayuno',
      description:
        stage === 'infancia' || stage === 'juventud'
          ? 'Solo con supervisión adulta / no prioritario'
          : 'Registrar un período de ayuno consciente',
      actionType: 'fasting',
      icon: '🕊️'
    },
    {
      id: 'sleep',
      category: 'sleep',
      label: 'Sueño circadiano',
      description:
        stage === 'infancia'
          ? 'Horario de sueño estable y suficiente'
          : 'Dormir dentro de tu ventana circadiana ideal',
      actionType: 'sleep_ideal',
      icon: '🌙',
      sensorHint: 'Horario de sueño / wearable'
    }
  ];

  // Filtrar ayuno en infancia
  return all.filter(a => {
    if (a.actionType === 'fasting' && (stage === 'infancia' || stage === 'juventud')) {
      return false;
    }
    return true;
  });
}

export function getCurrentHealthStage(): LifeStage {
  const profile = loadProfile();
  if (!profile?.birthDate) return 'adult';
  return getLifeStage(calculateAge(profile.birthDate));
}

export function getHealthPointsPreview(actionType: string): number {
  return getPointsForAction(actionType, getCurrentHealthStage());
}
