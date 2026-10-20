import { redirect } from 'next/navigation';

/** Settings live on the profile screen. */
export default function HubSettingsPage() {
  redirect('/hub/profile?settings=1');
}
