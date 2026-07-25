import AppLayout from '@/components/AppLayout';

const METRICS = [
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

export default function MetricsSettings() {
  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Metrics Settings</h1>
          <p className="mt-1 text-slate-500">Manage performance metrics. View, edit, and configure metric categories.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Metric Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Key</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Description</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric, idx) => (
                <tr key={metric.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{metric.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono text-xs">{metric.key}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{metric.description}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button className="rounded bg-blue-100 px-3 py-1 text-xs text-blue-700 hover:bg-blue-200">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            <strong>{METRICS.length} metrics</strong> currently defined. Edit names and descriptions, or delete metrics that are no longer needed.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
