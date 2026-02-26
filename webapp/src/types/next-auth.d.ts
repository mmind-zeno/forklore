import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: string;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    role?: string;
  }
}
