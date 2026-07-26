// Manual/optional: the running server now seeds this automatically on
// every boot (see src/startup/bootstrap.js) - nobody needs to run this by
// hand for a normal deployment. Kept for anyone with local access.
// Run with: npm run seed:highway-training
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { HIGHWAY_TRAINING_WEEKS } = require('../src/config/seedData');

const prisma = new PrismaClient();

async function main() {
  for (const week of HIGHWAY_TRAINING_WEEKS) {
    await prisma.highwayTrainingWeek.upsert({
      where: { weekNumber: week.weekNumber },
      update: week,
      create: week,
    });
  }
  console.log(`Seeded ${HIGHWAY_TRAINING_WEEKS.length} placeholder Highway Training weeks.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
