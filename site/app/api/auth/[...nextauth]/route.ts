/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
import CredentialsProvider from 'next-auth/providers/credentials';
import { SIWS } from '@web3auth/sign-in-with-solana';
import NextAuth from 'next-auth';
import jwt from 'jsonwebtoken';

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
const handler = async function auth(req: any, res: any) {
  const providers = [
    CredentialsProvider({
      name: 'Solana',
      credentials: {
        message: {
          label: 'Message',
          type: 'text',
        },
        signature: {
          label: 'Signature',
          type: 'text',
        },
      },
      async authorize(credentials) {
        try {
          const partialMessage : SIWS = JSON.parse(credentials?.message as string);
          const message = new SIWS(partialMessage);

          const response = await message.verify({
            payload: message.payload,
            signature: {
              t: 'sip99',
              s: credentials?.signature as string,
            },
          });

          if (response.success) {
            return {
              id: message.payload.address,
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      },
    }),
  ];

  return NextAuth(req, res, {
    providers,
    session: {
      strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.sub = jwt.sign({ issuer: process.env.NEXTAUTH_URL as string, sub: user.id }, process.env.NEXTAUTH_SECRET as string, { algorithm: 'HS256' });
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.name = token.sub;
        }
        return session;
      },
    },
  });
};

export { handler as GET, handler as POST };
