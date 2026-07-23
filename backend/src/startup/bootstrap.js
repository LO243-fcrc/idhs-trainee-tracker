// Runs automatically every time the server starts. Makes the whole
// deployment self-sufficient: no seed script needs to be run by hand, from
// any machine, ever - the running server ensures the admin account and
// starter content exist, using only environment variables Render already
// has. Every step is idempotent (checks before creating), so this is safe
// to run on every single boot, not just the first one.
const prisma = require('../config/db');
const { hashPassword } = require('../utils/password');
const { FCS_COURSES, HIGHWAY_TRAINING_WEEKS } = require('../config/seedData');

async function ensureAdminAccount() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    // Normal and expected: the administrator account is created in the app
    // itself on first visit. These variables are an optional convenience
    // only, not a requirement.
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[bootstrap] Admin account already exists: ${email}`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { email, name, passwordHash, role: 'ADMIN' } });
  console.log(`[bootstrap] Created admin account: ${email}`);
}

async function ensureFcsCourses() {
  // Needs an admin to attribute course creation to - skip quietly if none
  // exists yet (e.g. ADMIN_EMAIL/ADMIN_PASSWORD weren't set this boot).
  const anyAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!anyAdmin) return;

  for (const courseData of FCS_COURSES) {
    const existing = await prisma.course.findFirst({ where: { title: courseData.title } });
    if (existing) continue;

    await prisma.course.create({
      data: {
        title: courseData.title,
        description: courseData.description,
        createdBy: anyAdmin.id,
        modules: {
          create: [{ title: 'Program Overview', contentType: 'TEXT', contentUrl: courseData.overview, order: 0 }],
        },
      },
    });
    console.log(`[bootstrap] Created course: ${courseData.title}`);
  }
}

async function ensureHighwayTrainingWeeks() {
  for (const week of HIGHWAY_TRAINING_WEEKS) {
    await prisma.highwayTrainingWeek.upsert({
      where: { weekNumber: week.weekNumber },
      update: {},
      create: week,
    });
  }
}

// Never lets a bootstrap failure prevent the server from starting - logs
// and continues. A half-seeded database is recoverable; a server that
// refuses to boot because a seed step hiccuped is not.
async function runStartupBootstrap() {
  try {
    await ensureAdminAccount();
  } catch (err) {
    console.error('[bootstrap] Admin account step failed:', err.message);
  }
  try {
    await ensureFcsCourses();
  } catch (err) {
    console.error('[bootstrap] FCS courses step failed:', err.message);
  }
  try {
    await ensureHighwayTrainingWeeks();
  } catch (err) {
    console.error('[bootstrap] Highway Training weeks step failed:', err.message);
  }
}

// Exported so the very first in-app signup can seed starter content
// immediately, without waiting for the next server restart.
async function seedStarterContent() {
  try {
    await ensureFcsCourses();
  } catch (err) {
    console.error('[bootstrap] FCS courses step failed:', err.message);
  }
  try {
    await ensureHighwayTrainingWeeks();
  } catch (err) {
    console.error('[bootstrap] Highway Training weeks step failed:', err.message);
  }
}

module.exports = { runStartupBootstrap, seedStarterContent };
