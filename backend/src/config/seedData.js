// Shared seed data - used both by the manual `npm run seed:*` scripts (for
// anyone with local access who wants to run them by hand) and by the
// automatic startup bootstrap (so a fully web-managed deployment, with
// nobody ever running a command on any machine, still ends up with an
// admin account and starter content).

// FCS program courses. Content is a short placeholder description, not
// authoritative training material - replace before real use.
const FCS_COURSES = [
  {
    title: 'SNAP (Supplemental Nutrition Assistance Program)',
    description: 'Helps low-income households buy food via the Illinois Link Card.',
    overview:
      'SNAP helps low-income households buy food via the Illinois Link Card. Expedited services are available for immediate food needs.',
  },
  {
    title: 'TANF (Temporary Assistance for Needy Families)',
    description: 'Financial aid for food, shelter, and utilities to pregnant individuals and families with children.',
    overview:
      'TANF provides financial aid for food, shelter, and utilities to pregnant individuals and families with children.',
  },
  {
    title: 'AABD Medical (Aid to the Aged, Blind, and Disabled)',
    description: 'Medical assistance component of AABD for low-income seniors and individuals with disabilities.',
    overview: 'AABD Medical provides medical assistance coverage for low-income seniors and individuals with disabilities.',
  },
  {
    title: 'AABD Cash (Aid to the Aged, Blind, and Disabled)',
    description: 'Monthly cash assistance component for low-income seniors and individuals with disabilities.',
    overview: 'AABD Cash provides monthly cash assistance for low-income seniors and individuals with disabilities.',
  },
  {
    title: 'Medicaid Overview',
    description: 'Illinois Medicaid healthcare coverage administered in part by IDHS.',
    overview: 'IDHS manages Medicaid alongside behavioral health and disability rehabilitation services.',
  },
  {
    title: 'Emergency & Crisis Assistance',
    description: 'Short-term aid for immediate shelter, utility, or clothing crises.',
    overview: 'Emergency & Crisis Assistance provides short-term aid for immediate shelter, utility, or clothing crises.',
  },
];

// 10 Week Highway Training placeholder weeks. This curriculum is set by an
// outside training authority, not IDHS - replace this placeholder content
// with the real week-by-week material once it's supplied.
const HIGHWAY_TRAINING_WEEKS = Array.from({ length: 10 }, (_, i) => ({
  weekNumber: i + 1,
  topic: `Week ${i + 1} - TBD`,
  expectation: 'Content not yet supplied. Replace with the real 10 Week Highway Training curriculum for this week.',
}));

module.exports = { FCS_COURSES, HIGHWAY_TRAINING_WEEKS };
