import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/lib/auth';

function Section({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
      <div className="space-y-2 text-sm text-slate-600">{children}</div>
    </div>
  );
}

function Step({ number, children }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
        {number}
      </span>
      <p className="pt-0.5">{children}</p>
    </div>
  );
}

function ManagerGuide({ isAdmin }) {
  return (
    <div className="space-y-4">
      <Section title="Dashboard">
        <p>
          The Dashboard shows every active trainee as a row, with their timeline (Month N of 12, computed from
          their Start of Employment date) and their status in each training program. Click a trainee's name to
          open their detail page. Use <strong>Create Course</strong> to add a new training program with modules.
        </p>
      </Section>

      <Section title="Trainee Detail Page">
        <p>Everything about one trainee lives here:</p>
        <Step number={1}><strong>Training Timeline</strong> — set or correct the Start of Employment date. For a trainee who joined the program before being added to this system, set their real start date so their 3/6/9/12-month schedule is correct.</Step>
        <Step number={2}><strong>10 Week Highway Training</strong> — record the start and end dates. The training counts as completed once an end date is set.</Step>
        <Step number={3}><strong>Case-Type Authorization &amp; Review Status</strong> — for Medical and SNAP separately, record the steps of the pipeline: trainer recommends → direct manager approves, both for case-type authorization and, later, for second-party-review independence.</Step>
        <Step number={4}><strong>Second-Party Reviews</strong> — log each review outcome (Certified or Returned for Corrections) with the case type and optional case action. Never enter client names or case numbers anywhere.</Step>
        <Step number={5}><strong>Performance Metrics</strong> — score any of the ten categories from 0–100 with optional notes and a case-action tag. Every score is kept as history, so trends stay visible. Certification at month 12 requires above 70% in <em>every</em> category.</Step>
        <Step number={6}><strong>Program Progress</strong> — assign training courses to the trainee using the "Assign Course" button. Once assigned, each course shows its current status: Not Started, In Progress, or Completed. Use the "Mark Complete" button to update the course status as the trainee works through modules. Courses always start as "Not Started" when first assigned.</Step>
      </Section>

      <Section title="Manage Trainees">
        <p>
          Add and manage trainees, and configure the 10-week Highway Training curriculum.
        </p>
        <p className="mt-2">
          <strong>Trainees:</strong> Add new trainees (with employment and Highway Training dates), edit a trainee's name or email. Archive trainees who need to leave the program temporarily (hides them from Dashboard but keeps all history) — or permanently delete a trainee if the record was entered by mistake. You can restore archived trainees anytime from the same table.
        </p>
        <p className="mt-2">
          <strong>10 Week Highway Training (Admin only):</strong> Edit the curriculum for all 10 weeks — add the topic and training expectations for each week so trainees can see what to expect.
        </p>
      </Section>

      <Section title="Reports">
        <p>
          Aggregate numbers across trainees: certification rate, case-type authorization counts, performance
          averages, and program completion. Use the filter bar to narrow everything by trainee, trainer, direct
          manager, program, case type, or a date range — in any combination.
        </p>
        <p className="mt-2">
          <strong>Performance Averages:</strong> When you filter by a specific trainee, you'll see both the trainee's individual performance scores and the overall average performance of all trainees — making it easy to compare one trainee's performance to the group. Export to Spreadsheet to download all report data as a file you can use in Excel.
        </p>
      </Section>

      <Section title="Progress Analytics">
        <p>
          Real-time dashboard showing course completion metrics and trends. Track overall completion rate, see which courses have the highest and lowest completion rates, monitor each manager's team progress, and view completion trends over the last 30 days.
        </p>
        <p className="mt-2">
          <strong>Key Metrics:</strong>
        </p>
        <Step number={1}><strong>Overall Completion Rate</strong> — percentage of all assigned courses that have been completed</Step>
        <Step number={2}><strong>Completion by Course</strong> — stacked bar chart showing completed, in-progress, and not-started for each course</Step>
        <Step number={3}><strong>Completion by Manager</strong> — table showing each manager's team progress and completion rate</Step>
        <Step number={4}><strong>Status Distribution</strong> — pie chart showing total breakdown of all assignments by status</Step>
        <Step number={5}><strong>Timeline Chart</strong> — line chart showing completions over the last 30 days to identify trends</Step>
        <Step number={6}><strong>Top Performing Courses</strong> — ranked list of courses by completion percentage</Step>
      </Section>

      <Section title="Users">
        <p>
          View all trainees, managers, and administrators in one place. Trainees are listed with their employment and Highway Training start dates. Managers and Administrators show their account email and creation date.
        </p>
        <p className="mt-2">
          <strong>Create Management Accounts (Admin only):</strong> Click "Create or Manage Users" to add new trainer/manager accounts. Accounts can be archived temporarily or permanently deleted. Administrators and Management have identical access to trainee data; only account and assignment administration is admin-only.
        </p>
      </Section>

      <Section title="Courses">
        <p>
          View all created training courses. Each course shows its title, description, and module count. Click any course to expand it and see full details.
        </p>
        <p className="mt-2">
          <strong>Edit Course Title/Description:</strong> Click "Edit" to change the course name or description.
        </p>
        <p className="mt-2">
          <strong>Edit Course Modules:</strong> Click "Edit Modules" to add, edit, or remove individual modules. Each module needs a title, content type (VIDEO, PDF, or TEXT), and a URL link to the content.
        </p>
        <p className="mt-2">
          <strong>Delete Course:</strong> Click "Delete Course" to remove it entirely from the system. This action cannot be undone.
        </p>
      </Section>

      {isAdmin && (
        <Section title="Administrator Functions">
          <Step number={1}><strong>Management accounts</strong> — create trainer/manager accounts from the Users page. Administrators and Management have identical access to trainee data; only account and assignment administration is admin-only.</Step>
          <Step number={2}><strong>Course assignment</strong> — on a trainee's detail page, scroll to "Program Progress" and click "Assign Course" to assign training courses to that trainee. Each course starts with status "Not Started" — you can change it to "In Progress" or "Completed" using the "Mark Complete" button as the trainee works through the training. Each trainee can have multiple courses assigned. The trainee will see all assigned courses when they log in via their self-report link.</Step>
          <Step number={3}><strong>Self-report logins</strong> — from a trainee's detail page, click "Generate Link" to create a unique token link for the trainee. Copy and share this link — they can visit it anytime to submit daily case reports and view their assigned courses. No username or password needed.</Step>
        </Section>
      )}
    </div>
  );
}

function TraineeGuide() {
  return (
    <div className="space-y-4">
      <Section title="What trainees can access">
        <p>
          Trainees access the system through a special link their manager creates. They do not need a username or password — their link automatically logs them in. The link takes them to a portal with two tabs: one for submitting daily case reports, and one for viewing their assigned training courses.
        </p>
      </Section>

      <Section title="Instructions to give your trainees">
        <Step number={1}>Click the link your manager sent you. This automatically logs you in — no password needed.</Step>
        <Step number={2}>You'll see two tabs: "Daily Case Report" and "My Assigned Courses".</Step>
        <Step number={3}>In the "Daily Case Report" tab, at the end of each workday, enter: the number of SNAP cases you worked on, the number of Medical cases you worked on, how many cases were certified (approved), and how many are still waiting for second-party review.</Step>
        <Step number={4}>Click <strong>Submit Daily Report</strong>. You can submit one report per day — if you submit again the same day, it replaces that day's numbers so you can correct any mistakes.</Step>
        <Step number={5}>Go to the "My Assigned Courses" tab to see the training courses your manager assigned to you. Click any module link to open the training content (videos, PDFs, documents, etc.).</Step>
        <Step number={6}>After you've completed all modules for a course, click the <strong>"Mark Course Complete"</strong> button to let your manager know you've finished. Once marked complete, the course status will show as "✓ Course Completed".</Step>
        <Step number={7}>Log out when you're done, especially on a shared computer.</Step>
      </Section>

      <Section title="Note for managers">
        <p>
          Trainees see these same instructions on their portal page under "How to use this page." To enable trainee access:
        </p>
        <Step number={1}>Click the trainee's name from Dashboard to open their detail page.</Step>
        <Step number={2}>Scroll to "Program Progress" and click "Assign Course" to assign the training courses they need.</Step>
        <Step number={3}>Scroll down and click "Generate Link" (in the Self-Report Login section) to create their unique login link.</Step>
        <Step number={4}>Copy the link and share it with the trainee via email or message.</Step>
      </Section>
    </div>
  );
}

export default function HowToUse() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState('managers');

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">How to Use</h1>
          <p className="text-sm text-slate-500">A quick guide to the Trainee Tracker, for managers and for trainees.</p>
        </div>

        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('managers')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'managers' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            For Managers
          </button>
          <button
            onClick={() => setActiveTab('trainees')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'trainees' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            For Trainees
          </button>
        </div>

        {activeTab === 'managers' ? <ManagerGuide isAdmin={isAdmin} /> : <TraineeGuide />}
      </div>
    </AppLayout>
  );
}
