// Absolute URL of this site, for links that leave it (Stripe returns, e-mails).
export function siteUrl() {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
