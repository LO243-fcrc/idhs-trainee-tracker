const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seed: checking database...');

  // CLEANUP: Delete today's reports if they exist
  // (This allows trainees to submit fresh reports each day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deleted = await prisma.dailySelfReport.deleteMany({
    where: {
      reportDate: today,
    },
  });
  if (deleted.count > 0) {
    console.log(`Seed: deleted ${deleted.count} report(s) from today to allow fresh submissions`);
  }

  // CREATE METRIC DEFINITIONS (if they don't exist)
  // These are independent of trainees and should always be present
  const metricDefinitions = [
    { key: 'POLICY_EFFICIENCY', name: 'Policy Efficiency', description: 'Knowledge and application of policies' },
    { key: 'IES_EFFICIENCY', name: 'IES Efficiency', description: 'Use of IDHS systems' },
    { key: 'DATA_ENTRY_ACCURACY', name: 'Data Entry Accuracy', description: 'Accuracy of data entry' },
    { key: 'CASE_COMMENTS_QUALITY', name: 'Case Comments Quality', description: 'Quality of case notes' },
    { key: 'INTERVIEWING_IN_PERSON', name: 'Interviewing (In-Person)', description: 'In-person interview skills' },
    { key: 'INTERVIEWING_PHONE', name: 'Interviewing (Phone)', description: 'Phone interview skills' },
    { key: 'TIMELINESS', name: 'Timeliness', description: 'Meeting deadlines' },
    { key: 'ELIGIBILITY_BENEFIT_ACCURACY', name: 'Eligibility & Benefit Accuracy', description: 'Correct eligibility determinations' },
    { key: 'VERIFICATION_THOROUGHNESS', name: 'Verification Thoroughness', description: 'Completeness of verification' },
    { key: 'NOTICE_PROCEDURAL_ACCURACY', name: 'Notice & Procedural Accuracy', description: 'Correct notice procedures' },
  ];

  for (const def of metricDefinitions) {
    await prisma.performanceMetricDefinition.upsert({
      where: { key: def.key },
      update: {}, // Don't change existing definitions
      create: def,
    });
  }
  console.log('Seed: metric definitions ensured (10 total)');

  // CREATE HIGHWAY TRAINING WEEKS (if they don't exist)
  // The 10-week curriculum is shared across all trainees
  const highwayWeeks = [
    { weekNumber: 1, topic: 'Introduction & Orientation', expectation: 'Understand IDHS structure, policies, and systems overview' },
    { weekNumber: 2, topic: 'Case Management Basics', expectation: 'Learn case documentation and file management' },
    { weekNumber: 3, topic: 'SNAP Benefits', expectation: 'Master SNAP eligibility determination and case processing' },
    { weekNumber: 4, topic: 'Medicaid Programs', expectation: 'Understand Medicaid categories and medical verification' },
    { weekNumber: 5, topic: 'Interviews & Client Interaction', expectation: 'Develop interviewing skills and customer service' },
    { weekNumber: 6, topic: 'Case Comments & Documentation', expectation: 'Write clear, complete case notes and comments' },
    { weekNumber: 7, topic: 'Quality Control & Accuracy', expectation: 'Apply QC standards and verify accuracy' },
    { weekNumber: 8, topic: 'Special Circumstances', expectation: 'Handle complex cases and exceptions' },
    { weekNumber: 9, topic: 'Systems & Technology', expectation: 'Master IDHS systems and data entry' },
    { weekNumber: 10, topic: 'Review & Certification Prep', expectation: 'Review coursework and prepare for certification' },
  ];

  for (const week of highwayWeeks) {
    await prisma.highwayTrainingWeek.upsert({
      where: { weekNumber: week.weekNumber },
      update: {}, // Don't change existing curriculum
      create: week,
    });
  }
  console.log('Seed: highway training curriculum ensured (10 weeks total)');

  // IDEMPOTENCY GUARD.
  // This seed runs on every Render build. Both User.email and Trainee.email
  // are @unique, so re-running create() would throw P2002, exit(1), and fail
  // the whole build. If data already exists, skip and let the build continue.
  const existingUsers = await prisma.user.count();
  const existingTrainees = await prisma.trainee.count();

  if (existingUsers > 0 || existingTrainees > 0) {
    console.log(
      `Seed: database has ${existingUsers} user(s) and ` +
      `${existingTrainees} trainee(s). Checking metrics...`
    );
    
    // Still create metrics if they don't exist
    const existingMetrics = await prisma.performanceMetric.count();
    if (existingMetrics === 0) {
      console.log('Seed: no metrics found, creating them...');
      
      const trainees = await prisma.trainee.findMany({ where: { archivedAt: null } });
      const scores = {
        Hercules: 83,
        Simba: 72,
        Ariel: 66,
        Maleficent: 50,
        Cinderella: 73,
        Aladdin: 71,
      };

      const metricsData = [];
      const categories = [
        'POLICY_EFFICIENCY',
        'IES_EFFICIENCY',
        'CASE_COMMENTS_QUALITY',
        'INTERVIEWING_IN_PERSON',
        'INTERVIEWING_PHONE',
        'TIMELINESS',
        'ELIGIBILITY_BENEFIT_ACCURACY',
        'VERIFICATION_THOROUGHNESS',
        'NOTICE_PROCEDURAL_ACCURACY',
        'DATA_ENTRY_ACCURACY',
      ];

      for (const trainee of trainees) {
        const score = scores[trainee.name] || 70;
        for (const category of categories) {
          metricsData.push({
            traineeId: trainee.id,
            category,
            score: score,
            notes: `Performance for ${trainee.name} in ${category}`,
            createdAt: new Date('2026-07-15'),
          });
        }
      }

      await prisma.performanceMetric.createMany({
        data: metricsData,
      });
      console.log(`Seed: created ${metricsData.length} performance metrics`);
    }
    return;
  }

  console.log('Seed: empty database detected, loading demo data...');

  // Create admin user
  const adminHash = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log('Seed: created admin user');

  // Create 6 trainees
  const trainees = await Promise.all([
    prisma.trainee.create({
      data: {
        name: 'Hercules',
        email: 'hercules@example.com',
        employmentStartDate: new Date('2025-12-01'),
        highwayTrainingStartDate: new Date('2025-12-08'),
        highwayTrainingEndDate: new Date('2026-02-16'),
      },
    }),
    prisma.trainee.create({
      data: {
        name: 'Simba',
        email: 'simba@example.com',
        employmentStartDate: new Date('2026-03-01'),
        highwayTrainingStartDate: new Date('2026-03-08'),
        highwayTrainingEndDate: new Date('2026-05-17'),
      },
    }),
    prisma.trainee.create({
      data: {
        name: 'Ariel',
        email: 'ariel@example.com',
        employmentStartDate: new Date('2026-04-01'),
        highwayTrainingStartDate: new Date('2026-04-08'),
        highwayTrainingEndDate: new Date('2026-06-16'),
      },
    }),
    prisma.trainee.create({
      data: {
        name: 'Maleficent',
        email: 'maleficent@example.com',
        employmentStartDate: new Date('2026-02-01'),
        highwayTrainingStartDate: new Date('2026-02-08'),
        highwayTrainingEndDate: new Date('2026-04-19'),
      },
    }),
    prisma.trainee.create({
      data: {
        name: 'Cinderella',
        email: 'cinderella@example.com',
        employmentStartDate: new Date('2026-05-01'),
        highwayTrainingStartDate: new Date('2026-05-08'),
        highwayTrainingEndDate: new Date('2026-07-20'),
      },
    }),
    prisma.trainee.create({
      data: {
        name: 'Aladdin',
        email: 'aladdin@example.com',
        employmentStartDate: new Date('2026-06-01'),
        highwayTrainingStartDate: new Date('2026-06-08'),
        highwayTrainingEndDate: new Date('2026-08-17'),
      },
    }),
  ]);
  console.log('Seed: created 6 trainees');

  // Self-report tokens (32-char hex) so the trainee self-report links work.
  for (const t of trainees) {
    await prisma.trainee.update({
      where: { id: t.id },
      data: { selfReportToken: crypto.randomBytes(16).toString('hex') },
    });
  }
  console.log('Seed: generated self-report tokens');

  // Performance metrics for 8 categories across 6 trainees
  const categories = [
    'POLICY_EFFICIENCY',
    'IES_EFFICIENCY',
    'CASE_COMMENTS_QUALITY',
    'INTERVIEWING_IN_PERSON',
    'INTERVIEWING_PHONE',
    'TIMELINESS',
    'ELIGIBILITY_BENEFIT_ACCURACY',
    'VERIFICATION_THOROUGHNESS',
  ];

  const scores = {
    Hercules: 83,
    Simba: 72,
    Ariel: 66,
    Maleficent: 50,
    Cinderella: 73,
    Aladdin: 71,
  };

  const metricsData = [];
  for (const trainee of trainees) {
    const score = scores[trainee.name];
    for (const category of categories) {
      metricsData.push({
        traineeId: trainee.id,
        category,
        score: score,
        notes: `Performance for ${trainee.name} in ${category}`,
        createdAt: new Date('2026-07-15'),
      });
    }
  }

  await prisma.performanceMetric.createMany({
    data: metricsData,
  });
  console.log(`Seed: created ${metricsData.length} performance metrics`);

  // Create daily self-reports (last 30 days from TODAY, not including today)
  const reportsData = [];
  for (const trainee of trainees) {
    for (let i = 1; i <= 30; i++) {
      const reportDate = new Date(); // Get TODAY
      reportDate.setDate(reportDate.getDate() - i); // Go back i days
      reportDate.setHours(0, 0, 0, 0); // Set to midnight (date only, no time)
      
      reportsData.push({
        traineeId: trainee.id,
        reportDate: reportDate,
        medicalCasesDone: Math.floor(Math.random() * 5) + 2,
        snapCasesDone: Math.floor(Math.random() * 8) + 3,
        casesCertified: Math.floor(Math.random() * 4) + 1,
        casesPending: Math.floor(Math.random() * 3) + 1,
        createdAt: new Date(),
      });
    }
  }

  await prisma.dailySelfReport.createMany({
    data: reportsData,
  });
  console.log(`Seed: created ${reportsData.length} daily self-reports`);

  // Create sample quarterly reviews for demo
  // Scores based on metric data: Hercules 83, Simba 72, Ariel 66, Maleficent 50, Cinderella 73, Aladdin 71
  const baseScores = {
    Hercules: 83,
    Simba: 72,
    Ariel: 66,
    Maleficent: 50,
    Cinderella: 73,
    Aladdin: 71,
  };

  const reviewsData = [];
  // Use the same 10 categories (defined above)
  const allCategories = [
    'POLICY_EFFICIENCY',
    'IES_EFFICIENCY',
    'DATA_ENTRY_ACCURACY',
    'CASE_COMMENTS_QUALITY',
    'INTERVIEWING_IN_PERSON',
    'INTERVIEWING_PHONE',
    'TIMELINESS',
    'ELIGIBILITY_BENEFIT_ACCURACY',
    'VERIFICATION_THOROUGHNESS',
    'NOTICE_PROCEDURAL_ACCURACY',
  ];

  for (const trainee of trainees) {
    const baseScore = baseScores[trainee.name] || 70;
    
    // Create 3-month review (reviewNumber 1)
    const scores3mo = {};
    allCategories.forEach(cat => {
      scores3mo[cat] = Math.max(0, Math.min(100, baseScore + Math.floor(Math.random() * 20 - 10)));
    });
    reviewsData.push({
      traineeId: trainee.id,
      reviewNumber: 1,
      reviewDate: new Date(),
      scores: scores3mo,
      overriddenCategories: null,
      notes: `3-month review for ${trainee.name}. Overall performance trending well.`,
      decision: Object.values(scores3mo).every(s => s >= 70) ? 'PASS' : 'FAIL',
      passed: Object.values(scores3mo).every(s => s >= 70),
    });
  }

  await prisma.quarterlyReview.createMany({
    data: reviewsData,
  });
  console.log(`Seed: created ${reviewsData.length} quarterly reviews`);

  console.log('Seed: complete.');
}

main()
  .catch((e) => {
    console.error('Seed FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
