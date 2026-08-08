import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';
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

  // Lamp state and DOM refs
  const [isLampOn, setIsLampOn] = useState(false);
  const isAnimatingRef = useRef(false);

  const roomRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const lightConeRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<SVGGElement>(null);
  const bulbRef = useRef<SVGCircleElement>(null);
  const cordRef = useRef<SVGLineElement>(null);
  const pullRef = useRef<SVGCircleElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  const handleLampToggle = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const nextState = !isLampOn;
    setIsLampOn(nextState);

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    if (nextState) {
      // TURNING ON
      // 1. Pull cord animation (stretch down & elastic bounce)
      tl.to([cordRef.current, pullRef.current], {
        y: 16,
        duration: 0.12,
        ease: 'power1.in',
      });
      tl.to([cordRef.current, pullRef.current], {
        y: 0,
        duration: 0.45,
        ease: 'elastic.out(1, 0.4)',
      });

      // 2. Shade tilt (+6deg -> 0deg elastic bounce)
      tl.to(
        shadeRef.current,
        {
          rotation: 6,
          duration: 0.12,
          ease: 'power1.out',
        },
        '<'
      );
      tl.to(shadeRef.current, {
        rotation: 0,
        duration: 0.35,
        ease: 'elastic.out(1.2, 0.4)',
      });

      // 3. Bulb glow fill color change
      tl.to(
        bulbRef.current,
        {
          fill: '#fff3d0',
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.3'
      );

      // 4. Room glow & light cone
      tl.to(
        glowRef.current,
        {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
        },
        '<'
      );
      tl.to(
        lightConeRef.current,
        {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
        },
        '<'
      );

      // 5. Background transition to warm gradient
      tl.to(
        roomRef.current,
        {
          background: 'linear-gradient(180deg, #241d12 0%, #171410 100%)',
          duration: 0.8,
          ease: 'power2.out',
        },
        '<'
      );

      // 6. Login form entrance (fade in + rise + soft scale + glow)
      tl.to(
        formRef.current,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          boxShadow: '0 0 28px rgba(201,162,74,0.3)',
          duration: 0.7,
          ease: 'back.out(1.2)',
        },
        '-=0.6'
      );
    } else {
      // TURNING OFF
      // 1. Pull cord animation (stretch down & elastic bounce)
      tl.to([cordRef.current, pullRef.current], {
        y: 16,
        duration: 0.12,
        ease: 'power1.in',
      });
      tl.to([cordRef.current, pullRef.current], {
        y: 0,
        duration: 0.45,
        ease: 'elastic.out(1, 0.4)',
      });

      // 2. Shade tilt (-5deg -> 0deg elastic bounce)
      tl.to(
        shadeRef.current,
        {
          rotation: -5,
          duration: 0.12,
          ease: 'power1.out',
        },
        '<'
      );
      tl.to(shadeRef.current, {
        rotation: 0,
        duration: 0.35,
        ease: 'elastic.out(1.2, 0.4)',
      });

      // 3. Bulb off fill color change
      tl.to(
        bulbRef.current,
        {
          fill: '#8a8478',
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.3'
      );

      // 4. Room glow & light cone off
      tl.to(
        glowRef.current,
        {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
        },
        '<'
      );
      tl.to(
        lightConeRef.current,
        {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
        },
        '<'
      );

      // 5. Background transition back to dark
      tl.to(
        roomRef.current,
        {
          background: '#101216',
          duration: 0.8,
          ease: 'power2.out',
        },
        '<'
      );

      // 6. Login form exit
      tl.to(
        formRef.current,
        {
          opacity: 0,
          y: 14,
          scale: 0.96,
          boxShadow: 'none',
          duration: 0.6,
          ease: 'power2.in',
        },
        '-=0.6'
      );
    }
  };

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
    <div
      ref={roomRef}
      className="relative flex min-h-screen w-screen flex-col items-center justify-center p-4 sm:p-8 font-sans overflow-hidden transition-colors"
      style={{ background: '#101216' }}
      id="login-container"
    >
      {/* Background ambient glow */}
      <div
        ref={glowRef}
        id="glow"
        className="absolute pointer-events-none opacity-0 rounded-full blur-3xl transition-opacity"
        style={{
          top: '10%',
          width: '500px',
          height: '500px',
          background:
            'radial-gradient(circle, rgba(255, 243, 208, 0.22) 0%, rgba(201, 162, 74, 0.08) 55%, transparent 75%)',
        }}
      />

      {/* Light cone shining down from lamp */}
      <div
        ref={lightConeRef}
        className="absolute pointer-events-none opacity-0 transition-opacity"
        style={{
          top: '160px',
          width: '380px',
          height: '460px',
          background:
            'linear-gradient(180deg, rgba(247,230,184,0.08) 0%, rgba(201,162,74,0.02) 70%, transparent 100%)',
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Lamp Interactive Section */}
      <div className="relative z-20 flex flex-col items-center mb-6">
        <div
          role="button"
          tabIndex={0}
          onClick={handleLampToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLampToggle();
            }
          }}
          aria-label="Toggle lamp switch to sign in"
          className="group flex flex-col items-center cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 rounded-2xl p-2 transition-transform active:scale-98"
        >
          <svg
            width={150}
            height={180}
            viewBox="0 0 150 180"
            className="drop-shadow-2xl overflow-visible"
          >
            {/* Ground shadow beneath base */}
            <ellipse cx="75" cy="165" rx="42" ry="6" fill="#000000" opacity="0.35" />

            {/* Base */}
            <ellipse cx="75" cy="154" rx="32" ry="8" fill="#1a1a1a" />
            <ellipse cx="75" cy="152" rx="24" ry="4" fill="#282828" />

            {/* Stand */}
            <rect x="71" y="68" width="8" height="85" rx="4" fill="#232323" />

            {/* Pull Cord & Knob */}
            <line
              ref={cordRef}
              id="cord"
              x1="92"
              y1="68"
              x2="92"
              y2="114"
              stroke="#5a5a5a"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              ref={pullRef}
              id="pull"
              cx="92"
              cy="118"
              r="5"
              fill="#c9a24a"
              stroke="#8c6a23"
              strokeWidth="1"
              className="group-hover:scale-110 transition-transform origin-center"
            />

            {/* Shade Group (contains Shade dome, rim & Bulb) */}
            <g
              ref={shadeRef}
              id="shadeGroup"
              style={{ transformOrigin: '75px 45px' }}
            >
              {/* Bulb */}
              <circle
                ref={bulbRef}
                id="bulb"
                cx="75"
                cy="68"
                r="10"
                fill="#8a8478"
              />

              {/* Ivory/cream Dome Shade */}
              <path
                d="M 25,65 C 25,24 125,24 125,65 Z"
                fill="#f2e8d8"
              />
              {/* Bottom Edge Rim Stripe */}
              <rect
                x="25"
                y="63"
                width="100"
                height="5"
                rx="2"
                fill="#e4d5bd"
              />
            </g>
          </svg>

          {/* Hint text */}
          <p className="mt-1 text-xs font-medium text-[#7a7d82] tracking-wide transition-colors group-hover:text-amber-200/90">
            {isLampOn ? 'Click lamp to turn off' : 'Pull the switch to sign in'}
          </p>
        </div>
      </div>

      {/* Login Form (Always present in DOM, animated via GSAP) */}
      <div
        ref={formRef}
        className={`relative z-20 w-full max-w-md p-8 rounded-2xl border border-white/10 backdrop-blur-md transition-all ${
          isLampOn ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
          opacity: 0,
          transform: 'translateY(14px) scale(0.96)',
        }}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-serif text-2xl font-black shadow-lg shadow-amber-500/20">
            A
          </div>
          <div>
            <h2 className="font-serif text-2xl font-extrabold tracking-tight text-white">
              Amanah
            </h2>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/90">
              Loan & Debt Orchestration
            </p>
          </div>
        </div>

        <div className="text-left mb-6">
          <h3 className="font-serif text-lg font-bold tracking-tight text-slate-100">
            Sign In to Your Workspace
          </h3>
          <p className="mt-1 text-xs text-slate-300">
            Enter your credentials to manage records, agreements, and disbursements.
          </p>
        </div>

        {successMessage && (
          <div
            className="rounded-xl bg-teal-950/40 p-4 text-xs text-teal-300 border border-teal-800/60 flex items-start gap-2.5 mb-4"
            id="login-success-alert"
          >
            <CheckCircle size={16} className="text-teal-400 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{successMessage}</p>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl bg-rose-950/40 p-4 text-xs text-rose-300 border border-rose-800/60 mb-4"
            id="login-error-alert"
          >
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">
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
                placeholder="Enter your email"
                autoComplete="off"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                id="login-email-input"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 block">
                Password
              </label>
              <a href="#" className="text-xs text-amber-400 hover:underline">
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
                placeholder="Enter your password"
                autoComplete="new-password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                id="login-password-input"
              />
            </div>
          </div>

          {/* Remember Me checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-400"
                id="login-remember-checkbox"
              />
              <span className="text-xs text-slate-300">Remember Me</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-500 hover:to-amber-700 active:scale-98 disabled:opacity-50 mt-3"
            id="login-submit-button"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Navigation to Signup */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-amber-400 hover:underline ml-1 transition-colors"
              id="goto-signup-link"
            >
              Create Account
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-500 pt-3">
          Authorized workspace access only. Protected by Supabase Auth.
        </p>
      </div>
    </div>
  );
}


