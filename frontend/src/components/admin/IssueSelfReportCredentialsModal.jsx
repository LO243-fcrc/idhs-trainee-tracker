import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, useDialogContext } from '@/components/ui/dialog';
import { api } from '@/lib/api';

function LinkDisplay({ token, traineeId, onClose }) {
  const [copied, setCopied] = useState(false);
  const reportLink = `${window.location.origin}/report?token=${token}`;

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border-2 border-green-300 bg-green-50 p-4">
        <p className="mb-3 text-sm font-semibold text-green-900">✓ Self-Report Link Generated</p>
        
        <div className="space-y-3">
          <p className="text-sm text-green-800">
            Share this link with the trainee. They can visit it anytime to submit daily self-reports.
          </p>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Self-Report Link</p>
            <div className="flex gap-2">
              <code className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-mono text-blue-600 break-all">
                {reportLink}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(reportLink)}
                className="shrink-0"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-md p-3 border border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-2">Instructions for trainee:</p>
            <p className="text-xs text-slate-600">
              "Go to the website address your manager gave you, ending in <code className="bg-slate-100 px-1">/report</code>. You can submit your daily self-reports there."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerateForm({ traineeId, onGenerated }) {
  const { setIsOpen } = useDialogContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [token, setToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleGenerate() {
    setIsGenerating(true);
    setErrorMessage('');
    try {
      const result = await api.generateSelfReportCredentials(traineeId);
      setToken(result.token);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  if (token) {
    return (
      <>
        <LinkDisplay token={token} traineeId={traineeId} onClose={() => setIsOpen(false)} />
        <div className="flex gap-2">
          <Button onClick={() => setIsOpen(false)} className="flex-1">
            Done
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="text-xs text-slate-500 mb-3">
        Generate a self-report link for this trainee. They'll use this link to access the daily self-report form at <strong>/report</strong>.
      </p>
      {errorMessage && <p className="text-sm text-red-600 mb-3">{errorMessage}</p>}
      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
          {isGenerating ? 'Generating...' : 'Generate Link'}
        </Button>
        <Button variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </>
  );
}

export default function IssueSelfReportCredentialsModal({ traineeId, onIssued }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Self-Report Login</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Self-Report Link</DialogTitle>
        </DialogHeader>
        <GenerateForm traineeId={traineeId} onGenerated={onIssued} />
      </DialogContent>
    </Dialog>
  );
}
