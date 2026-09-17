import { useState } from 'react';
import { signInWithGoogle } from '../lib/auth';

interface SignInGateProps {
  configured: boolean;
  title: string;
  description: string;
}

export function SignInGate({ configured, title, description }: SignInGateProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <div className="jt-signin-gate">
      <div className="jt-signin-card">
        <h1 className="gj-h3">{title}</h1>
        {!configured ? (
          <p>Firebase isn't configured for this environment.</p>
        ) : (
          <>
            <p>{description}</p>
            <button type="button" className="gj-btn gj-btn-primary" onClick={() => void handleGoogle()} disabled={busy}>
              {busy ? 'Opening Google…' : 'Continue with Google'}
            </button>
            {error ? <p className="jt-modal-error">{error}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
