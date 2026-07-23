// Manual/optional: the running server now creates this account automatically
// on every boot from the same ADMIN_* env vars (see src/startup/bootstrap.js)
// - nobody needs to run this by hand for a normal deployment. Kept for
// anyone with local access who wants to run it directly, e.g. to reset the
// admin's password without redeploying.
// Run with: npm run seed
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const name = process.env.ADMIN_NAME || 'Admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('Set ADMIN_PASSWORD in your environment before seeding.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: 'ADMIN' },
    create: { email, name, passwordHash, role: 'ADMIN' },
  });

  console.log(`Admin account ready: ${user.email} (id: ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
