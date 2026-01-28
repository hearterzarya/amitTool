import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Helper to check if Google OAuth is configured
function isGoogleOAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  return !!(
    clientId && 
    clientSecret && 
    clientId.trim() !== '' && 
    clientSecret.trim() !== '' &&
    !clientId.includes('your-client-id') &&
    !clientSecret.includes('your-client-secret') &&
    !clientId.includes('placeholder') &&
    !clientSecret.includes('placeholder')
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  debug: process.env.NODE_ENV === 'development', // Enable debug logging in development
  providers: [
    // Only add Google Provider if credentials are configured
    ...(isGoogleOAuthConfigured() ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true, // Allow linking Google account to existing email
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase(),
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        // Check if email is verified (use emailVerified DateTime as source of truth)
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Always return true to allow sign-in
      // PrismaAdapter will handle user/account creation
      // We'll update emailVerified in jwt callback after user is created
      
      // For Google OAuth, we can do some pre-processing but don't block on errors
      if (account?.provider === 'google' && user.email) {
        try {
          // Try to update existing user's emailVerified status
          // This is non-critical - if it fails, we'll handle it in jwt callback
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
          });

          if (existingUser && (!existingUser.emailVerified || !existingUser.isEmailVerified)) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                emailVerified: new Date(),
                isEmailVerified: true,
                name: user.name || existingUser.name,
              },
            }).catch((err) => {
              // Non-critical error, log but don't throw
              console.warn('Could not update existing user in signIn callback:', err.message);
            });
          }
        } catch (error: any) {
          // Non-critical - log but don't block sign-in
          console.warn('Error in Google signIn callback (non-blocking):', error.message);
        }
      }
      
      // Always return true - let PrismaAdapter handle the rest
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
        // Store provider info
        if (account) {
          token.provider = account.provider;
          
          // For new Google users, ensure emailVerified is set
          if (account.provider === 'google' && user.email) {
            try {
              // Wait a bit for PrismaAdapter to create the user
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const dbUser = await prisma.user.findUnique({
                where: { email: user.email.toLowerCase() },
              });
              
              if (dbUser && (!dbUser.emailVerified || !dbUser.isEmailVerified)) {
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: {
                    emailVerified: new Date(),
                    isEmailVerified: true,
                  },
                });
              }
            } catch (error: any) {
              console.error('Error updating emailVerified in jwt callback:', error);
              // Don't block token creation - this is a non-critical update
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).provider = token.provider;
        (session.user as any).email = token.email;
      }
      return session;
    },
    // Redirect after sign-in based on user role
    async redirect({ url, baseUrl }) {
      // Handle callback URLs from OAuth
      // The url might be the callbackUrl we set, or it might be the default
      // We'll check the user's role in a middleware or on the callback page
      
      // If redirecting to a relative URL, use it
      if (url.startsWith('/')) {
        // Check if it's dashboard - we'll handle admin redirect in middleware
        return `${baseUrl}${url}`;
      }
      // If redirecting to an external URL from same origin, use it
      if (new URL(url).origin === baseUrl) return url;
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
