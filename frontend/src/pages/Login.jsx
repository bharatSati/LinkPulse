import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { validateEmail, validateRequired } from '../utils/validation.js';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/app';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors = {
      email: validateEmail(form.email),
      password: validateRequired(form.password, 'Password'),
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      toast.success('Welcome back to LinkPulse');
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrors({ form: error.message });
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-400">
        Access your LinkPulse workspace and analytics.
      </p>

      {errors.form && (
        <div className="mt-5 rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@company.com"
          autoComplete="email"
          value={form.email}
          error={errors.email}
          onChange={(event) => update('email', event.target.value)}
        />
        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="Enter your password"
          autoComplete="current-password"
          value={form.password}
          error={errors.password}
          onChange={(event) => update('password', event.target.value)}
        />

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          iconRight={ArrowRight}
          className="w-full"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-accent-400 hover:text-accent-300">
          Create one
        </Link>
      </p>
    </div>
  );
}
