import type { Metadata } from 'next';
import CoachFab from '@/components/coach/CoachFab';
import BiometricLock from '@/components/auth/BiometricLock';
import BiometricEnrollPrompt from '@/components/auth/BiometricEnrollPrompt';
import HubSignOut from '@/components/auth/HubSignOut';

/** Private app shell — never index hub routes. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <BiometricLock>
      <div className="hub-shell pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <HubSignOut />
        {children}
        <CoachFab />
      </div>
      <BiometricEnrollPrompt />
    </BiometricLock>
  );
}
