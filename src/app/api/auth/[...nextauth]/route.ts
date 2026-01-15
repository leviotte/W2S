// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail } from "@/lib/server/actions/user-actions";
import { authOptions } from "@/lib/auth-options";

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        // 🔹 Haal user op uit Firebase / custom action
        const userFromDb = await getUserByEmail(credentials.email);

        if (!userFromDb) return null;

        // 🔹 Check wachtwoord (je gebruikt plaintext in Firebase)
        // Als je later hashed wachtwoorden gebruikt, pas hier hashing aan
        const passwordMatches =
          credentials.password === userFromDb.password;
        if (!passwordMatches) return null;

        // 🔹 Return altijd een string-safe object (no nulls)
        return {
          id: userFromDb.id,
          email: userFromDb.email,
          name: userFromDb.name ?? userFromDb.email.split("@")[0],
          role: userFromDb.role ?? "user",
          password: userFromDb.password ?? "",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
