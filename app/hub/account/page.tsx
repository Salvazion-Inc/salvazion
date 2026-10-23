import { redirect } from 'next/navigation';

/** Account details live on the profile screen. */
export default function HubAccountPage() {
  redirect('/hub/profile');
}
