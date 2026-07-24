export type Pillar = 'salvation' | 'health' | 'freedom';

export interface ScoreAction {
  id: string;
  type: string;
  pillar: Pillar;
  points: number;
  label: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
}

export interface DailyScore {
  date: string;
  salvation: number;
  health: number;
  freedom: number;
  actions: ScoreAction[];
}

export interface StreakState {
  salvation: number;
  health: number;
  freedom: number;
  lastActive: {
    salvation: string | null;
    health: string | null;
    freedom: string | null;
  };
}

export interface ComputedScores {
  salvation: number;      // 0-100 after multiplier
  health: number;
  freedom: number;
  global: number;         // weighted
  raw: {
    salvation: number;
    health: number;
    freedom: number;
  };
  multipliers: {
    salvation: number;
    health: number;
    freedom: number;
  };
  streaks: StreakState;
  todayActions: ScoreAction[];
}
