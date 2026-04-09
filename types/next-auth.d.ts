import { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    accessTokenExpires?: number;
    error?: 'AccessTokenExpired';
    user: DefaultSession['user'] & {
      username?: string;
      siteId?: string;
    };
  }

  interface User {
    accessToken: string;
    accessTokenExpires: number;
    username?: string;
    siteId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    accessTokenExpires?: number;
    error?: 'AccessTokenExpired';
    siteId?: string;
    username?: string;
  }
}