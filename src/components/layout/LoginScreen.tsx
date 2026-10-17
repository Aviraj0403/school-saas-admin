'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  Eye,
  EyeOff,
  GraduationCap,
  IndianRupee,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useLogin } from '@/hooks/queries/useAuth';

const FEATURES = [
  {
    icon: Users,
    title: 'Admissions',
    text: 'Enrol students, link parents and keep every document in one place.',
  },
  {
    icon: IndianRupee,
    title: 'Fees & receipts',
    text: 'Fee slabs, collections and instant receipts with clear dues for every family.',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance',
    text: 'Daily class attendance, staff attendance and biometric device sync.',
  },
  {
    icon: Bell,
    title: 'WhatsApp updates',
    text: 'Notices, homework and alerts delivered straight to WhatsApp.',
  },
];

const DEMO_ACCOUNTS = [
  { label: 'School Admin', email: 'admin@demo.com', pass: 'School@123' },
  { label: 'Teacher', email: 'teacher1@demo.com', pass: 'School@123' },
  { label: 'Accountant', email: 'accountant@demo.com', pass: 'School@123' },
  { label: 'Librarian', email: 'librarian@demo.com', pass: 'School@123' },
  { label: 'Student', email: 'student1@demo.com', pass: 'School@123' },
  { label: 'Parent', email: 'parent1@demo.com', pass: 'School@123' },
];

// Platform-wide account: offered only when running locally, never on a public demo
// domain — it controls every school.
const LOCAL_ONLY_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@aviraj.com', pass: 'SuperAdmin@123' },
];

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isDemoHost(hostname: string): boolean {
  const demoDomains = process.env.NEXT_PUBLIC_DEMO_DOMAINS?.split(',') || [
    'localhost',
    '127.0.0.1',
    'schooldemo.jdinfotechsolutions.in',
  ];
  return demoDomains.includes(hostname) || hostname.split('.')[0].includes('demo');
}

export default function LoginScreen() {
  const [schoolCode, setSchoolCode] = useState('');
  const [identifier, setIdentifier] = useState(''); // email for staff, admission no for students
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [detectedSchool, setDetectedSchool] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [isLocal, setIsLocal] = useState(false);

  const loginMutation = useLogin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Auto-detect school from subdomain (placeholder until tenants resolve by host)
    const hostname = window.location.hostname;
    if (hostname.includes('satysaiprep')) {
      setDetectedSchool('Satyasai Prep Academy');
      setSchoolCode('SATYASAI');
    } else if (hostname.includes('demo')) {
      setDetectedSchool('EduNexus Demo School');
      setSchoolCode('DEMO');
    }
    setShowDemo(isDemoHost(hostname));
    setIsLocal(isLocalHost(hostname));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { email: identifier, password, schoolCode },
      {
        onSuccess: () => {
          if (pathname !== '/dashboard') router.replace('/dashboard');
        },
      }
    );
  };

  const errorMessage =
    (loginMutation.error as any)?.response?.data?.message ||
    'We couldn’t sign you in. Check your details and try again.';

  const fieldClass =
    'w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all hover:border-zinc-300 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/12';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0819] font-sans text-white">
      {/* Aurora + grid backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-aurora absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-brand/45 blur-[140px]" />
        <div className="animate-aurora absolute -bottom-48 left-1/3 h-[520px] w-[620px] rounded-full bg-brand-2/35 blur-[150px] [animation-delay:-5s]" />
        <div className="animate-aurora absolute -right-32 top-1/4 h-[420px] w-[420px] rounded-full bg-sky-500/25 blur-[130px] [animation-delay:-9s]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-[1320px] items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_minmax(0,460px)] lg:gap-16">
        {/* Story */}
        <section className="hidden lg:block">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
              <GraduationCap className="size-6" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">EduNexus</span>
          </div>

          <span className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <Sparkles className="size-3.5 text-amber-300" />
            The all-in-one operating system for schools
          </span>
          <h1 className="mt-5 font-display text-[56px] font-semibold leading-[1.02] tracking-[-0.035em] xl:text-[64px]">
            Run your whole school
            <br />
            <span className="bg-gradient-to-r from-[#c4b5ff] via-[#ff9bd0] to-[#ffd29b] bg-clip-text text-transparent">
              beautifully simple.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/65">
            Admissions, fees, attendance, exams, transport and parent updates — one calm, connected
            workspace for your office, teachers and families.
          </p>

          {/* Floating product preview */}
          <div className="relative mt-12 h-[250px] max-w-[560px]">
            <div className="glass animate-float absolute left-0 top-2 w-[270px] rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-400/90 text-[#0b0819]">
                  <CalendarCheck className="size-[18px]" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold">Attendance marked</p>
                  <p className="text-xs text-white/55">Class 9 · Section A · 8:42 am</p>
                </div>
              </div>
              <div className="mt-3 flex -space-x-2">
                {['AK', 'RS', 'PM', 'NV', 'SJ'].map((n, i) => (
                  <span
                    key={n}
                    className="flex size-7 items-center justify-center rounded-full border-2 border-[#1d1838] text-[10px] font-bold"
                    style={{
                      background: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'][i],
                    }}
                  >
                    {n}
                  </span>
                ))}
                <span className="flex size-7 items-center justify-center rounded-full border-2 border-[#1d1838] bg-white/15 text-[10px] font-semibold">
                  +34
                </span>
              </div>
            </div>

            <div className="glass animate-float absolute right-0 top-0 w-[250px] rounded-2xl p-4 shadow-2xl [animation-delay:-2s]">
              <p className="text-xs text-white/55">Fee collection</p>
              <div className="mt-3 flex h-20 items-end gap-1.5">
                {[38, 52, 44, 68, 59, 82, 74, 96].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-brand to-brand-2"
                    style={{ height: `${h}%`, opacity: 0.55 + i * 0.06 }}
                  />
                ))}
              </div>
            </div>

            <div className="glass animate-float absolute bottom-0 left-[140px] w-[290px] rounded-2xl p-4 shadow-2xl [animation-delay:-4s]">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#25d366] text-[#0b0819]">
                  <MessageCircle className="size-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">Receipt sent to parent</p>
                  <p className="truncate text-xs text-white/55">via WhatsApp · Term 2 tuition</p>
                </div>
                <IndianRupee className="ml-auto size-4 text-white/50" />
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/60">
            {FEATURES.map(({ icon: Icon, title }) => (
              <span key={title} className="flex items-center gap-2">
                <Icon className="size-4 text-white/80" />
                {title}
              </span>
            ))}
          </div>
        </section>

        {/* Sign-in card */}
        <main className="mx-auto w-full max-w-[460px]">
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-xl font-semibold">EduNexus</span>
          </div>

          <div className="animate-slide-up rounded-[28px] bg-white p-7 text-zinc-900 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)] sm:p-9">
            <h2 className="font-display text-[28px] font-semibold leading-tight tracking-tight">
              {detectedSchool ? `Welcome to ${detectedSchool}` : 'Welcome back 👋'}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">Sign in to your school workspace.</p>

            <form onSubmit={handleLogin} className="mt-7 flex flex-col gap-4">
              {loginMutation.isError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {errorMessage}
                </div>
              )}

              {!detectedSchool && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="schoolCode"
                    className="flex justify-between text-[13px] font-medium text-zinc-700"
                  >
                    School code
                    <span className="font-normal text-zinc-400">Optional</span>
                  </label>
                  <input
                    id="schoolCode"
                    type="text"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    className={`${fieldClass} uppercase placeholder:normal-case`}
                    placeholder="e.g. SATYASAI"
                    autoComplete="organization"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="identifier" className="text-[13px] font-medium text-zinc-700">
                  Email or admission number
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className={fieldClass}
                  placeholder="you@school.com"
                  autoComplete="username"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-medium text-zinc-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`${fieldClass} pr-12`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  Forgot your password? Your school administrator can reset it.
                </p>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-gradient text-[15px] font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {showDemo && (
              <div className="mt-8">
                <div className="flex items-center gap-3 text-xs font-medium text-zinc-400">
                  <span className="h-px flex-1 bg-zinc-200" />
                  Try a demo account
                  <span className="h-px flex-1 bg-zinc-200" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[...(isLocal ? LOCAL_ONLY_ACCOUNTS : []), ...DEMO_ACCOUNTS].map((demo) => (
                    <button
                      key={demo.label}
                      type="button"
                      onClick={() => {
                        setIdentifier(demo.email);
                        setPassword(demo.pass);
                      }}
                      className={`h-9 rounded-xl border text-xs font-semibold transition-all ${
                        identifier === demo.email
                          ? 'border-transparent bg-brand-gradient text-white shadow-glow'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-white/50">
            <ShieldCheck className="size-3.5" />
            Each school’s data is kept separate and private.
          </p>
        </main>
      </div>
    </div>
  );
}
