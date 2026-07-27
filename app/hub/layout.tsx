import CoachFab from '@/components/coach/CoachFab';

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#040404]">
      {children}
      <CoachFab />
    </div>
  );
}
