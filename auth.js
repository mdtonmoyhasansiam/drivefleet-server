import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

console.log("AUTH FILE LOADED");

export const createAuth = (database) => {
  console.log("CREATE AUTH CALLED");

  console.log({
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
  });

  return betterAuth({
    database: mongodbAdapter(database),

    secret: process.env.BETTER_AUTH_SECRET,

    baseURL: "https://drivefleet-server-zqxb.onrender.com",

    emailAndPassword: {
      enabled: true,
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret:
          process.env.GOOGLE_CLIENT_SECRET,
      },
    },

    trustedOrigins: [
      "http://localhost:3000",
      "https://drivefleet-rouge.vercel.app",
    ],
  });
};