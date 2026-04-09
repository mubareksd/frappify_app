import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth-options';

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  return session?.user;
}

export async function getAccessToken() {
  const session = await getCurrentSession();

  return session?.accessToken;
}

export async function getSiteId() {
  const session = await getCurrentSession();

  return session?.user.siteId;
}