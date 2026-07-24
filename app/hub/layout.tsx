export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#040404]">
      {children}
    </div>
  );
}
