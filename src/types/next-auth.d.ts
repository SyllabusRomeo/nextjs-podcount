import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      factoryId?: string | null;
      factoryName?: string | null;
      fieldType?: string;
    } & Omit<DefaultSession["user"], "email" | "name">;
  }

  interface User extends DefaultUser {
    role: string;
    factoryId?: string | null;
    factoryName?: string | null;
    fieldType?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    role: string;
    factoryId?: string | null;
    factoryName?: string | null;
    fieldType?: string;
  }
} 