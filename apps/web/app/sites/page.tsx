import { redirect } from 'next/navigation';

export default function SitesPage() {
  redirect('/headquarters?scope=assigned');
}
