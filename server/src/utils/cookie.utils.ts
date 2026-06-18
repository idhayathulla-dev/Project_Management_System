import { CookieOptions } from 'express';

export const getCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd, // True forces HTTPS, false is fine for localhost
    sameSite: isProd ? 'none' : 'lax', // 'none' for cross-site cookies in production (e.g., Vercel to Render), 'lax' for local development
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds (matches typical token expiry)
  };
};
