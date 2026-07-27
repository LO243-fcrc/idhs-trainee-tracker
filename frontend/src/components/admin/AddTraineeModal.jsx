import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, useDialogContext } from '@/components/ui/dialog';
import { api } from '@/lib/api';

function DateField({ label, value, onChange, hint }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// The form itself lives inside DialogContent so it can call
// useDialogContext() to close the dialog from its own Cancel button.
function AddTraineeForm({ onAdded }) {
  const { setIsOpen } = useDialogContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employmentStartDate, setEmploymentStartDate] = useState('');
  const [highwayTrainingStartDate, setHighwayTrainingStartDate] = useState('');
  const [highwayTrainingEndDate, setHighwayTrainingEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  function resetForm() {
    setName('');
    setEmail('');
    setEmploymentStartDate('');
    setHighwayTrainingStartDate('');
    setHighwayTrainingEndDate('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const trainee = await api.createTrainee({
        name,
        email: email || null,
        employmentStartDate: employmentStartDate || null,
        highwayTrainingStartDate: highwayTrainingStartDate || null,
        highwayTrainingEndDate: highwayTrainingEndDate || null,
      });
      setSuccessMessage(`${trainee.name} added.`);
      resetForm();
      onAdded?.();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />

      <DateField
        label="Start of Employment"
        value={employmentStartDate}
        onChange={setEmploymentStartDate}
        hint="Anchors the 3/6/9/12-month evaluation schedule. Leave blank if not yet started."
      />
      <DateField
        label="Start of Highway Training"
        value={highwayTrainingStartDate}
        onChange={setHighwayTrainingStartDate}
      />
      <DateField
        label="End of Highway Training"
        value={highwayTrainingEndDate}
        onChange={setHighwayTrainingEndDate}
        hint="Leave blank if still in progress or not yet started."
      />

      {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Adding...' : 'Add Trainee'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          {successMessage ? 'Done' : 'Cancel'}
        </Button>
      </div>
    </form>
  );
}

// Admin-only: adds a single trainee. All three dates are optional but
// matter for a trainee who's already partway through their program when
// added - leave them blank only for a trainee starting completely fresh.
export default function AddTraineeModal({ onAdded }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add Trainee</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Trainee</DialogTitle>
        </DialogHeader>
        <AddTraineeForm onAdded={onAdded} />
      </DialogContent>
    </Dialog>
  );
}
