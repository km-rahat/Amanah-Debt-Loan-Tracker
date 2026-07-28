import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const { currentUser, loading, signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validation
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      setError('Full Name is required.');
      return;
    }
    if (trimmedName.length < 3) {
      setError('Full Name must be at least 3 characters.');
      return;
    }

    if (!trimmedEmail) {
      setError('Email address is required.');
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(trimmedName, trimmedEmail, password);
      setSuccessMessage('Registration successful! Account created.');
      setIsLoading(false);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200);
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err?.message || 'Registration failed. Please try again.';
      setError(errMsg);
    }
  };

  return (
    <div className="flex min-h-screen w-screen flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans" id="signup-container">
      {/* Left side: branding pane (visible on large screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-tr from-slate-900 via-teal-950 to-slate-900 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_45%)]" />

        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-800 shadow-xl">
            <span className="font-serif text-xl font-extrabold">A</span>
          </div>
          <div>
            <span className="font-serif text-2xl font-black tracking-tight text-white">Amanah</span>
            <span className="block text-[8px] font-semibold uppercase tracking-widest text-teal-300">Loan Manager</span>
          </div>
        </div>

        {/* Core USP illustration */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="font-serif text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Create your workspace <br />and begin managing.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Join Amanah to track records, generate transparent agreements, monitor borrower balances, and automate notification schedules securely.
          </p>

          <div className="flex gap-6 pt-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/10 text-teal-400">
                <ShieldCheck size={14} />
              </div>
              <span>Encrypted Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/10 text-teal-400">
                <ShieldCheck size={14} />
              </div>
              <span>Audit Logging</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Amanah. Built on React & Tailwind.</p>
        </div>
      </div>

      {/* Right side: Signup form card */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Logo on mobile view */}
          <div className="flex flex-col items-center justify-center text-center lg:hidden mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
              <span className="font-serif text-2xl font-black">A</span>
            </div>
            <h2 className="mt-4 font-serif text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Amanah
            </h2>
            <p className="text-xs text-slate-400">Create Account</p>
          </div>

          <div className="text-left">
            <h2 className="hidden lg:block font-serif text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create Your Account
            </h2>
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-400">
              Register your credentials to start managing records and loans.
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div
              className="rounded-xl bg-teal-50 p-4 text-xs text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 flex flex-col gap-2"
              id="signup-success-alert"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle size={18} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <p className="font-medium whitespace-pre-line leading-relaxed">{successMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="mt-1 self-end text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline"
              >
                Go to Login now →
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="rounded-xl bg-rose-50 p-4 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
              id="signup-error-alert"
            >
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="signup-form">
            {/* Full Name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                  id="signup-fullname-input"
                />
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                  id="signup-email-input"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                  id="signup-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  id="toggle-show-password"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                  id="signup-confirmpassword-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  id="toggle-show-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 active:scale-98 disabled:opacity-50 mt-2"
              id="signup-submit-button"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Register</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-teal-600 hover:underline dark:text-teal-400 ml-1 transition-colors"
                id="signup-login-link"
              >
                Login
              </Link>
            </p>
          </div>

          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-2">
            Authorized workspace access only. Protected by Supabase Auth.
          </p>
        </div>
      </div>
    </div>
  );
}
