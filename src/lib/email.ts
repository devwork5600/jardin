import type { ReactElement } from "react";
import { after } from "next/server";
import { render } from "react-email";
import { Resend } from "resend";

// What callers hand over: the message as a react-email template.
export type EmailMessage = { to: string; subject: string; react: ReactElement };

// What actually goes out: the template rendered to HTML and plain text.
export type SentEmail = { to: string; subject: string; html: string; text: string };

// Test seam: with EMAIL_TRANSPORT=memory nothing is sent, messages pile up here.
export const outbox: SentEmail[] = [];

// "onboarding@resend.dev" (Resend's shared test sender) only delivers to the
// e-mail of the Resend account itself; a verified domain lifts that.
function sender() {
  const raw = process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";
  return raw.includes("<") ? raw : `Feuilles et épines <${raw}>`;
}

// Demo / test setups: EMAIL_REDIRECT_TO sends every message to that one address
// (the Resend account's own, with the shared test sender), and the subject says
// who it was really for. Unset in production.
function redirected(message: EmailMessage): EmailMessage {
  const target = process.env.EMAIL_REDIRECT_TO?.trim();
  if (!target) return message;
  return { ...message, to: target, subject: `[pour ${message.to}] ${message.subject}` };
}

// Never throws: an e-mail that can't leave must not fail an order or a payment.
// Returns whether it was accepted for delivery.
export async function sendEmail(original: EmailMessage): Promise<boolean> {
  const message = redirected(original);
  const memory = process.env.EMAIL_TRANSPORT === "memory";
  const apiKey = process.env.RESEND_API_KEY;
  if (!memory && !apiKey) {
    console.warn("email not sent (RESEND_API_KEY missing):", message.subject);
    return false;
  }
  try {
    // Both parts: mail clients (and spam filters) like a plain-text alternative.
    const [html, text] = await Promise.all([
      render(message.react),
      render(message.react, { plainText: true }),
    ]);
    if (memory) {
      outbox.push({ to: message.to, subject: message.subject, html, text });
      return true;
    }
    const { error } = await new Resend(apiKey).emails.send({
      from: sender(),
      to: message.to,
      subject: message.subject,
      html,
      text,
    });
    if (error) {
      console.error("email rejected by Resend:", message.subject, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("email failed:", message.subject, error);
    return false;
  }
}

// Runs `task` once the response has gone out, so the customer never waits for
// (nor sees a failure from) the mail provider. Outside a request (scripts,
// tests) `after` is unavailable: just run it in the background.
export function afterResponse(task: () => Promise<unknown>) {
  const safe = () => task().catch((error) => console.error("background task failed:", error));
  try {
    after(safe);
  } catch {
    void safe();
  }
}
