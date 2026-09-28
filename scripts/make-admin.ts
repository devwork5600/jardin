// Gives an account the ADMIN role (or takes it back with --remove).
//   npx tsx scripts/make-admin.ts you@example.com [--remove]
// The role is what /admin and its server actions check, server side.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const email = process.argv[2];
const remove = process.argv.includes("--remove");

async function main() {
  if (!email || email.startsWith("--")) throw new Error("Usage: make-admin.ts <email> [--remove]");
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user) throw new Error("No account with this e-mail (sign in on the site once first).");
  const role = remove ? "CUSTOMER" : "ADMIN";
  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`${email}: ${user.role} -> ${role}`);
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
