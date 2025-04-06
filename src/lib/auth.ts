import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import NextAuth from "next-auth";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { User } from "next-auth";

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Missing credentials");
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string
            },
            include: {
              factory: {
                select: {
                  name: true
                }
              }
            }
          });

          if (!user) {
            throw new Error("User not found");
          }

          // Check if the user is disabled
          if (user.status === "DISABLED") {
            throw new Error("Your account has been disabled. Please contact an administrator.");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            factoryId: user.factoryId,
            factoryName: user.factory?.name || null,
            fieldType: user.fieldType,
            status: user.status
          } as User;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/auth/error",
    signOut: "/auth/signout"
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith('/login');
      
      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        return false; // Redirect to login page
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id as string,
          role: user.role,
          factoryId: user.factoryId,
          factoryName: user.factoryName,
          fieldType: user.fieldType,
          status: user.status,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          factoryId: token.factoryId,
          factoryName: token.factoryName,
          fieldType: token.fieldType,
          status: token.status,
        },
      };
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;

// Export the handlers
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

// Export a method to get the session
export const getServerAuthSession = async (context: {
  req: NextApiRequest | Request;
  res?: NextApiResponse;
}) => {
  // @ts-ignore - Context typing issue with NextAuth
  return await auth(context);
}; 