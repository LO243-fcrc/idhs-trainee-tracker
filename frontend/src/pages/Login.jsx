import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// One screen, two modes. On a brand-new database no account exists yet, so
// this shows first-run setup: whoever creates that first account becomes
// the administrator. Once an account exists it is a plain sign-in, and
// further accounts are created by the admin in Settings.
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [needsSetup, setNeedsSetup] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    api
      .getSetupStatus()
      .then((data) => {
        if (isMounted) setNeedsSetup(data.needsSetup);
      })
      .catch(() => {
        // If the check fails, fall back to the sign-in form rather than
        // blocking the page.
        if (isMounted) setNeedsSetup(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const result = needsSetup
        ? await api.register(name, email, password)
        : await api.login(email, password);
      // The auth provider derives the signed-in user from the token itself.
      login(result.token);
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white shadow-sm">
            IL
          </div>
          <h1 className="text-xl font-bold text-slate-900">IDHS Trainee Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">Illinois Department of Human Services</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {needsSetup === null ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <>
              {needsSetup ? (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700">Create the administrator account</p>
                  <p className="mt-1 text-xs text-slate-500">
                    No accounts exist yet. This first account becomes the administrator, who can then create
                    accounts for everyone else in Settings.
                  </p>
                </div>
              ) : (
                <p className="mb-4 text-sm font-medium text-slate-700">Management sign-in</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {needsSetup && (
                  <Input
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                )}
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Input
                  type="password"
                  placeholder={needsSetup ? 'Password (at least 8 characters)' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={needsSetup ? 'new-password' : 'current-password'}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting
                    ? needsSetup
                      ? 'Creating account...'
                      : 'Signing in...'
                    : needsSetup
                      ? 'Create Administrator Account'
                      : 'Sign In'}
                </Button>
                {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Trainee? Your daily report form is at <span className="font-medium text-slate-500">/report</span>
        </p>
      </div>
    </div>
  );
}
