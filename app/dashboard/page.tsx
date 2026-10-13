import { redirect } from 'next/navigation';
import GroupDashboard from '@/components/founders/GroupDashboard';
import { isFounderEmail } from '@/lib/founders/access';
import { loadLiveDashboard } from '@/lib/founders/live';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function FoundersDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/dashboard');
  }

  if (!isFounderEmail(user.email)) {
    return (
      <div className="founders-dash">
        <div className="gate">
          <p className="eyebrow">Salvazion, Inc.</p>
          <h1>Solo fundadores</h1>
          <p className="note">Esta cuenta no abre el tablero del grupo.</p>
          <p>
            <a href="/hub/dashboard">Volver al hub</a>
          </p>
        </div>
      </div>
    );
  }

  const data = await loadLiveDashboard();
  return <GroupDashboard initial={data} />;
}
