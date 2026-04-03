import { authOptions } from '@/lib/auth-options';
import { env } from '@/lib/env';
import { getCurrentSession } from '@/lib/session';
import { redirect } from 'next/navigation';

interface ProtectedLayoutProps {
  children?: React.ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await getCurrentSession();
  const user = session?.user;

  if (!user) {
    redirect(authOptions?.pages?.signIn || `${env.PUBLIC_APP_URL}/login`);
  }

  if (session?.error === 'AccessTokenExpired') {
    const params = new URLSearchParams();
    if (user.siteId) params.set('siteId', user.siteId);
    if (user.username) params.set('username', user.username);
    params.set('expired', '1');
    redirect(`${env.PUBLIC_APP_URL}/login?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-background">
          {children}
    </div>
  );
}