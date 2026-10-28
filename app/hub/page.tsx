import { redirect } from 'next/navigation';

/** /hub has no screen of its own. The home of the app is the dashboard. */
export default function HubIndexPage() {
  redirect('/hub/dashboard');
}
