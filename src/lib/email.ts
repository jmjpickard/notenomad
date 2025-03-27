import { Resend } from "resend";
import MagicLinkEmail from "../emails/magic-link-email";
import VerificationEmail from "../emails/verification-email";
import { env } from "../env";

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Sends a magic link email to the specified email address
 */
export const sendMagicLinkEmail = async (email: string, magicLink: string) => {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Your NoteMomad Magic Link",
    react: MagicLinkEmail({
      magicLink,
      _host: env.AUTH_URL,
    }),
  });

  if (error) {
    console.error("Failed to send magic link email:", error);
    throw new Error("Failed to send magic link email");
  }
};

/**
 * Sends a verification email to the specified email address
 */
export const sendVerificationEmail = async (
  email: string,
  verificationLink: string,
) => {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Verify your NoteMomad account",
    react: VerificationEmail({
      verificationLink,
      _host: env.AUTH_URL,
    }),
  });

  if (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
};
