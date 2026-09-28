import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins/magic-link";
import { createElement } from "react";
import { SignInEmail } from "@/emails/sign-in";
import { sendEmail } from "./email";
import { prisma } from "./prisma";
import { siteUrl } from "./site-url";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const sent = await sendEmail({
          to: email,
          subject: "Votre lien de connexion — Feuilles et épines",
          react: createElement(SignInEmail, { baseUrl: siteUrl(), url }),
        });
        // Better an honest error than a "check your inbox" for a mail that never left.
        if (!sent) throw new Error("Impossible d'envoyer l'e-mail de connexion");
      },
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "CUSTOMER",
        input: false,
      },
      totalSpentCents: {
        type: "number",
        defaultValue: 0,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
});
