import CoachFab from '@/components/coach/CoachFab';

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--true-black)]">
      {children}
      <CoachFab />
    </div>
  );
}
