
import { redirect } from 'next/navigation';
import AdminDashboard from '../../ui-pages/AdminDashboard';
import { getServerSessionUser } from '../../server/adminSession';

export default async function Page() {
  const user = await getServerSessionUser();
  const isAdmin = user && user.claims?.admin === true;
  if (!isAdmin) redirect('/login');
  return <AdminDashboard />;
}
