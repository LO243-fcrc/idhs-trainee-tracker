// Manual/optional: the running server now seeds this automatically on
// every boot (see src/startup/bootstrap.js) - nobody needs to run this by
// hand for a normal deployment. Kept for anyone with local access who wants
// to re-run it directly, or reset a course after deleting it.
// Run with: npm run seed:courses
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { FCS_COURSES } = require('../src/config/seedData');

const prisma = new PrismaClient();

async function main() {
  const attributedToEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const creator = await prisma.user.findUnique({ where: { email: attributedToEmail } });

  if (!creator) {
    console.error(
      `No management account found for ${attributedToEmail}. Run "npm run seed" first to create one.`
    );
    process.exit(1);
  }

  for (const courseData of FCS_COURSES) {
    const existing = await prisma.course.findFirst({ where: { title: courseData.title } });
    if (existing) {
      console.log(`Skipped (already exists): ${courseData.title}`);
      continue;
    }

    await prisma.course.create({
      data: {
        title: courseData.title,
        description: courseData.description,
        createdBy: creator.id,
        modules: {
          create: [
            {
              title: 'Program Overview',
              contentType: 'TEXT',
              contentUrl: courseData.overview,
              order: 0,
            },
          ],
        },
      },
    });
    console.log(`Created: ${courseData.title}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
