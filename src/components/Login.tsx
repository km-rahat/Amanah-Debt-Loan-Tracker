import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { currentUser, loading, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      setIsLoading(false);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err?.message || 'Invalid email or password.';
      setError(errMsg);
    }
  };

  return (
    <div className="flex min-h-screen w-screen flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans" id="login-container">
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
            Ethical, transparent <br />debt & loan orchestration.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Manage personal advances, corporate allocations, and structured agreements on a cohesive SaaS platform. Built for absolute transparency, peace of mind, and financial clarity.
          </p>
          
          <div className="flex gap-6 pt-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/10 text-teal-400">
                <ShieldCheck size={14} />
              </div>
              <span>Secure Agreements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/10 text-teal-400">
                <ShieldCheck size={14} />
              </div>
              <span>Systematic Reminders</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Amanah. Built on React & Tailwind.</p>
        </div>
      </div>

      {/* Right side: Login form */}
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
            <p className="text-xs text-slate-400">Debt & Loan Tracker</p>
          </div>

          <div className="text-left">
            <h2 className="hidden lg:block font-serif text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sign In to Your Workspace
            </h2>
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-400">
              Enter your credentials to manage records, print agreements, and disburse alerts.
            </p>
          </div>

          {successMessage && (
            <div className="rounded-xl bg-teal-50 p-4 text-xs text-teal-800 dark:bg-teal-950/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 flex items-start gap-2.5" id="login-success-alert">
              <CheckCircle size={16} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 p-4 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50" id="login-error-alert">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
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
                  placeholder="rahatboss015@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                  id="login-email-input"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                  Password
                </label>
                <a href="#" className="text-xs text-teal-600 hover:underline dark:text-teal-400">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                  id="login-password-input"
                />
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 dark:bg-slate-950 dark:border-slate-800"
                  id="login-remember-checkbox"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">Remember Me</span>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 active:scale-98 disabled:opacity-50 mt-2"
              id="login-submit-button"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Signup */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-teal-600 hover:underline dark:text-teal-400 ml-1 transition-colors"
                id="goto-signup-link"
              >
                Create Account
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

