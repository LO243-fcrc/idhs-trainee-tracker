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

      <Section title="Daily Submissions">
        <p>
          View the submission rate of daily case reports from trainees. This tab shows real-time engagement metrics: how many trainees submitted today, this week, and this month.
        </p>
        <p className="mt-2">
          <strong>Submission Status:</strong> See each trainee's submission status (submitted today, submitted this week, or overdue). The 30-day trend chart shows engagement over time.
        </p>
      </Section>

      <Section title="Bottleneck Analysis">
        <p>
          Identify which performance categories are struggling across your team. This page shows the percentage of trainees scoring below 70% in each metric category, ranked from most to least problematic.
        </p>
        <p className="mt-2">
          <strong>Use This To:</strong> Pinpoint team-wide training gaps (e.g., "80% of our trainees are below 70% in Case Comments Quality"). Target your coaching efforts where they'll have the most impact.
        </p>
      </Section>

      <Section title="Quarterly Reviews">
        <p>
          Conduct formal performance reviews at 3-month, 6-month, 9-month, and 12-month checkpoints. Only the 12-month review counts for final certification, but all reviews help track progress.
        </p>
        <Step number={1}><strong>Navigate to Quarterly Reviews</strong> — Click the <strong>Quarterly Reviews</strong> tab in the sidebar navigation.</Step>
        <Step number={2}><strong>Create a Review</strong> — For each trainee, click the "Create" button for the checkpoint you want (3M, 6M, 9M, or 12M). The system auto-populates scores from the trainee's most recent metric recordings in each of the 10 categories.</Step>
        <Step number={3}><strong>Review & Edit Scores</strong> — The modal shows all 10 performance categories with auto-populated scores (0–100). Edit any score as needed. Scores are color-coded: <span className="inline-block h-2 w-2 rounded-full bg-green-600"></span> Green (≥70) = Passing, <span className="inline-block h-2 w-2 rounded-full bg-red-600"></span> Red (&lt;70) = Needs Improvement.</Step>
        <Step number={4}><strong>Add Manager Notes</strong> — Include comments about overall performance, areas of strength, or recommended development areas.</Step>
        <Step number={5}><strong>Set Decision</strong> — Choose PASS (only if all scores ≥70), FAIL, or PENDING. The PASS button is only enabled when all categories score 70 or above.</Step>
        <Step number={6}><strong>Save Review</strong> — Click "Save Review" to record the evaluation. Changes are immediately reflected on the trainee's detail page.</Step>
        <Step number={7}><strong>Edit Anytime</strong> — Click "Edit" on any existing review to modify scores, notes, or decision as needed.</Step>
        <p className="mt-2 text-xs text-slate-500">
          <strong>12-Month Certification:</strong> A PASS at the 12-month review certifies the trainee, and the certification date is recorded automatically.
        </p>
      </Section>

      <Section title="Quarterly Evaluation Snapshot">
        <p>
          Each trainee's detail page includes a <strong>Quarterly Evaluation Snapshot</strong> table showing a side-by-side view of all scores across all completed reviews (3M, 6M, 9M, 12M).
        </p>
        <p className="mt-2">
          <strong>How to Read It:</strong> Each row is a metric category. Each column is a review checkpoint with its decision badge (PASS/FAIL/PENDING). <span className="inline-block h-2 w-2 rounded-full bg-green-600"></span> Green scores pass, <span className="inline-block h-2 w-2 rounded-full bg-red-600"></span> red scores fail. Cells with "—" mean that checkpoint hasn't been reviewed yet.
        </p>
        <p className="mt-2">
          <strong>Review Details Below Table:</strong> Each completed review shows its decision, notes, and review date. Certified reviews (12M PASS) display the certification date.
        </p>
      </Section>

      <Section title="Progress">
        <p>
          Real-time dashboard tracking course completion metrics and team progress. See overall completion rates, identify top and bottom performing courses, monitor each manager's team progress, and view completion trends over the last 30 days.
        </p>
        <p className="mt-2">
          <strong>Key Metrics Displayed:</strong>
        </p>
        <Step number={1}><strong>Overall Completion Rate</strong> — Percentage of all assigned courses that have been completed across your entire team</Step>
        <Step number={2}><strong>Completion by Course</strong> — Stacked bar chart showing for each course how many are completed (green), in progress (yellow), or not started (gray)</Step>
        <Step number={3}><strong>Completion by Manager</strong> — Table showing each manager's team completion rate and assignment status</Step>
        <Step number={4}><strong>Status Distribution</strong> — Pie chart showing the total breakdown of all course assignments: completed, in-progress, vs not-started</Step>
        <Step number={5}><strong>Timeline Chart</strong> — Line chart showing course completions over the last 30 days to identify engagement trends</Step>
        <Step number={6}><strong>Top Performing Courses</strong> — Ranked list of courses by completion percentage, so you can see which courses trainees complete most reliably</Step>
        <p className="mt-2 text-xs text-slate-500">
          <strong>Use This To:</strong> Identify high-performing courses worth replicating, find courses that need redesign (low completion), and spot managers whose teams are lagging behind.
        </p>
      </Section>

      <Section title="Metrics Settings">
        <p>
          <strong>(Admin only)</strong> Manage the 10 performance metric categories that trainees are evaluated on. View all metrics, create new custom categories, edit existing ones, or delete metrics you no longer need.
        </p>
        <p className="mt-2">
          <strong>Default Metrics (Built-in — Cannot be deleted):</strong>
        </p>
        <div className="ml-4 space-y-1 text-sm text-slate-600">
          <p>• Policy Efficiency</p>
          <p>• IES Efficiency</p>
          <p>• Data Entry Accuracy</p>
          <p>• Case Comments Quality</p>
          <p>• Interviewing (In-Person)</p>
          <p>• Interviewing (Phone)</p>
          <p>• Timeliness</p>
          <p>• Eligibility &amp; Benefit Accuracy</p>
          <p>• Verification Thoroughness</p>
          <p>• Notice &amp; Procedural Accuracy</p>
        </div>
        <p className="mt-3">
          <strong>How to Add a Custom Metric:</strong>
        </p>
        <Step number={1}>Click <strong>"Create New Metric"</strong> button</Step>
        <Step number={2}>Enter metric <strong>name</strong> (e.g., "Customer Service Skills")</Step>
        <Step number={3}>Enter metric <strong>description</strong> (optional — helps managers understand what to score)</Step>
        <Step number={4}>Click <strong>"Create Metric"</strong></Step>
        <Step number={5}>New metric appears in the list and is available for scoring trainees immediately</Step>
        <p className="mt-3">
          <strong>How to Edit a Metric:</strong>
        </p>
        <Step number={1}>Find the metric in the list</Step>
        <Step number={2}>Click <strong>"Edit"</strong> button</Step>
        <Step number={3}>Update name and/or description</Step>
        <Step number={4}>Click <strong>"Save"</strong></Step>
        <p className="mt-3">
          <strong>How to Delete a Metric:</strong>
        </p>
        <Step number={1}>Find the metric in the list</Step>
        <Step number={2}>Click <strong>"Delete"</strong> button</Step>
        <Step number={3}>Confirm deletion (cannot be undone)</Step>
        <Step number={4}>Metric is removed and no longer available for scoring</Step>
        <p className="mt-3 text-xs text-slate-500">
          <strong>Note:</strong> Only custom metrics you create can be deleted. The 10 built-in metrics are locked and protected.
        </p>
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
