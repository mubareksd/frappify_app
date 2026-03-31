import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { env } from '@/lib/env';

export const authOptions: NextAuthOptions = {
    providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        ipAddress: { label: 'IP Address', type: 'text' },
        siteId: { label: 'Site ID', type: 'text' },
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.siteId || !credentials?.username || !credentials?.password) {
          throw new Error('Site ID, username, and password required');
        }

        const forwardedHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Frappe-Site': credentials.siteId,
        };

        if (credentials.ipAddress?.trim()) {
          forwardedHeaders['X-Forwarded-For'] = credentials.ipAddress.trim();
        }

        try {
          const res = await fetch(`${env.API_URL}/method/login`, {
            method: 'POST',
            body: JSON.stringify({
              usr: credentials.username,
              pwd: credentials.password,
            }),
            headers: forwardedHeaders,
          });

          if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new Error(error?.error || error?.message || 'Authentication failed');
          }

          const data = await res.json();

          if (!data?.access_token || typeof data?.expires_in !== 'number') {
            throw new Error('Invalid authentication response');
          }

          return {
            id: `${credentials.siteId}:${credentials.username}`,
            username: credentials.username,
            accessToken: data.access_token,
            accessTokenExpires: Date.now() + Number(data.expires_in ?? 0) * 1000,
            siteId: credentials.siteId,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: `${env.PUBLIC_APP_URL}/login`,
    error: `${env.PUBLIC_APP_URL}/error`,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.siteId = user.siteId;
        token.username = user.username;
      }

      const now = Date.now();
      if (typeof token.accessTokenExpires === 'number' && now < token.accessTokenExpires) {
        return token;
      }

      token.error = 'AccessTokenExpired';
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.user.siteId = token.siteId;
      session.user.username = token.username;
      session.error = token.error;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: env.NEXTAUTH_SECRET,
};
