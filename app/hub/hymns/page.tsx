'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import PillarHubHeader from '@/components/hub/PillarHubHeader';
import HymnBrowser from '@/components/salvation/HymnBrowser';
import SalvationTabs from '@/components/salvation/SalvationTabs';
import { computeScores } from '@/lib/scoring/engine';

export default function HymnsPage() {
  const [salvationScore, setSalvationScore] = useState(0);

  useEffect(() => {
    setSalvationScore(computeScores().salvation);
  }, []);

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <PillarHubHeader pillar="salvation" score={salvationScore} sticky>
        <SalvationTabs active="hymns" />
      </PillarHubHeader>
      <main className="flex-1 px-4 sm:px-5 pt-4 pb-8 overflow-y-auto max-w-lg mx-auto w-full">
        <HymnBrowser />
      </main>
      <BottomNav />
    </div>
  );
}
