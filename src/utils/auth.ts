import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { database } from "../db";
import { privateEnv } from "~/config/privateEnv";

const sesClient = new SESClient({
  region: privateEnv.AWS_REGION,
  credentials: {
    accessKeyId: privateEnv.AWS_ACCESS_KEY_ID,
    secretAccessKey: privateEnv.AWS_SECRET_ACCESS_KEY,
  },
});

export const auth = betterAuth({
  database: drizzleAdapter(database, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async (data) => {
      const { user, url, token } = data;

      const emailParams = {
        Destination: {
          ToAddresses: [user.email],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Verify Your Email Address</h2>
                  <p>Please click the button below to verify your email address:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}"
                       style="background-color: #007cba; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Verify Email
                    </a>
                  </div>
                  <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #666;">${url}</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="font-size: 12px; color: #888;">
                    This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                  </p>
                </div>
              `,
            },
            Text: {
              Charset: "UTF-8",
              Data: `Please verify your email address by clicking this link: ${url}?token=${token}`,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "Verify your email address",
          },
        },
        Source: privateEnv.AWS_SES_FROM_EMAIL,
      };

      try {
        await sesClient.send(new SendEmailCommand(emailParams));
        console.log("Verification email sent successfully to:", user.email);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw new Error("Failed to send verification email");
      }
    },
  },
  socialProviders: {
    google: {
      clientId: privateEnv.GOOGLE_CLIENT_ID,
      clientSecret: privateEnv.GOOGLE_CLIENT_SECRET,
    },
  },
});
