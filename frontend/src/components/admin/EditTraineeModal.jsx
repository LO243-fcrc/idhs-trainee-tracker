import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, useDialogContext } from '@/components/ui/dialog';
import { api } from '@/lib/api';

function EditTraineeForm({ trainee, onSaved }) {
  const { setIsOpen } = useDialogContext();
  const [name, setName] = useState(trainee.name);
  const [email, setEmail] = useState(trainee.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await api.updateTrainee(trainee.id, { name, email: email || null });
      onSaved();
      setIsOpen(false);
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
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

// Open to any management account - name/email only. Employment date and
// Highway Training dates are edited on the trainee's own detail page.
export default function EditTraineeModal({ trainee, onSaved }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Trainee</DialogTitle>
        </DialogHeader>
        <EditTraineeForm trainee={trainee} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}
