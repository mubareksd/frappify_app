import { authOptions } from '@/lib/auth-options';
import { env } from '@/lib/env';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';

interface ProtectedLayoutProps {
  children?: React.ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(authOptions?.pages?.signIn || `${env.PUBLIC_APP_URL}/login`);
  }

  return (
    <div className="min-h-screen bg-background">
          {children}
    </div>
  );
}