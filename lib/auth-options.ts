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
        password: { label: 'Password', type: 'password' },
        // Fields used for account switching (no password required)
        accessToken: { label: 'Access Token', type: 'text' },
        accessTokenExpires: { label: 'Expires', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.siteId || !credentials?.username) {
          throw new Error('MissingCredentials');
        }

        // ── Account switch: validate an existing token ──────────────
        if (credentials.accessToken && !credentials.password) {
          try {
            const res = await fetch(
              `${env.API_URL}/method/frappe.auth.get_logged_user`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${credentials.accessToken}`,
                  'X-Frappe-Site': credentials.siteId,
                },
              },
            );

            if (!res.ok) {
              throw new Error('Stored token is no longer valid');
            }

            return {
              id: `${credentials.siteId}:${credentials.username}`,
              username: credentials.username,
              accessToken: credentials.accessToken,
              accessTokenExpires: Number(credentials.accessTokenExpires) || Date.now() + 3600_000,
              siteId: credentials.siteId,
            };
          } catch (error) {
            console.error('Account switch error:', error);
            return null;
          }
        }

        // ── Normal login: username + password ───────────────────────
        if (!credentials.password) {
          throw new Error('MissingPassword');
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
            if (res.status === 401) {
              throw new Error('InvalidCredentials');
            }

            if (res.status === 403) {
              throw new Error('AccessDenied');
            }

            if (res.status === 423) {
              throw new Error('AccountLocked');
            }

            if (res.status === 429) {
              throw new Error('TooManyRequests');
            }

            if (res.status >= 500) {
              throw new Error('AuthServiceUnavailable');
            }

            throw new Error('CredentialsSignin');
          }

          const data = await res.json();

          if (!data?.access_token || typeof data?.expires_in !== 'number') {
            throw new Error('InvalidAuthResponse');
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

          if (error instanceof Error) {
            throw error;
          }

          throw new Error('AuthServiceUnavailable');
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/error',
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
