import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserRound, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { validateEmail, validateRequired, validateMinLength } from '../utils/validation.js';

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors = {
      name: validateRequired(form.name, 'Name') || validateMinLength(form.name.trim(), 2, 'Name'),
      email: validateEmail(form.email),
      password:
        validateRequired(form.password, 'Password') ||
        validateMinLength(form.password, 8, 'Password'),
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Your LinkPulse account is ready');
      navigate('/app', { replace: true });
    } catch (error) {
      setErrors({ form: error.message });
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Create account</h1>
      <p className="mt-1.5 text-sm text-ink-400">
        Start shortening links and measuring performance.
      </p>

      {errors.form && (
        <div className="mt-5 rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Full name"
          icon={UserRound}
          placeholder="Ada Lovelace"
          autoComplete="name"
          value={form.name}
          error={errors.name}
          onChange={(event) => update('name', event.target.value)}
        />
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={form.password}
          error={errors.password}
          hint="Use at least 8 characters."
          onChange={(event) => update('password', event.target.value)}
        />

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          iconRight={ArrowRight}
          className="w-full"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-400 hover:text-accent-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
