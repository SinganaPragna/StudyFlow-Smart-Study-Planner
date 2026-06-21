import { Link } from "wouter";
import {
  BookOpen, Zap, BarChart3, Target, Clock, Shield,
  ChevronRight, ArrowRight, UserPlus, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: BookOpen,
    title: "Smart Subject Management",
    description: "Add subjects with priorities, exam dates, and topics. Stay organized with searchable, filterable lists.",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: Zap,
    title: "Auto-Generated Timetable",
    description: "One click generates a full study schedule tailored to your exam dates and priority levels.",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Visualize your overall progress with completion percentages across all subjects and sessions.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Target,
    title: "Priority Scheduling",
    description: "High priority subjects get daily sessions. Medium every 2 days. Low every 3 days — automatically.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Clock,
    title: "Exam Countdown",
    description: "Always know how many days are left. Urgent exams are flagged so you never miss a deadline.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Shield,
    title: "Persistent Data",
    description: "All your subjects and progress are saved to a database. Everything survives app restarts.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-pink-600/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-600/8 blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <h1 className="mb-6 max-w-4xl text-5xl font-heading font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-foreground">Study </span>
          <span className="gradient-text">Smarter</span>
          <span className="text-foreground">,</span>
          <br />
          <span className="text-foreground">Not </span>
          <span className="gradient-text">Harder</span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          StudyFlow auto-generates personalized study timetables based on your exam dates and priorities.
          Track progress, manage subjects, and walk into every exam confident and prepared.
        </p>

        {/* Auth CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {user ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                data-testid="button-go-to-dashboard"
                className="group h-14 px-8 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:shadow-violet-500/50 hover:scale-[1.02]"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <Button
                  size="lg"
                  data-testid="button-get-started"
                  className="group h-14 px-8 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:shadow-violet-500/50 hover:scale-[1.02]"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Sign Up Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/signin">
                <Button
                  size="lg"
                  variant="outline"
                  data-testid="button-signin"
                  className="h-14 px-8 text-base font-semibold border-border/60 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-violet-500/15 text-violet-400 border-violet-500/30 hover:bg-violet-500/20">
              Everything you need
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold mb-4">
              Built for <span className="gradient-text">serious students</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Every feature is designed around one goal: helping you spend your study time where it matters most.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative rounded-2xl border p-6 transition-all duration-300 card-hover cursor-default ${f.bg} backdrop-blur-sm`}
                data-testid={`feature-card-${i}`}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${f.bg}`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="mb-2 font-heading font-semibold text-lg text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-heading font-bold mb-4">
              Up and running in <span className="gradient-text">3 steps</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              No complicated setup. Just sign up and start studying smarter.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-8 left-[33%] right-[33%] h-px bg-gradient-to-r from-violet-500/30 to-pink-500/30" />
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up with your name, email, and password. Takes under 30 seconds.", icon: UserPlus },
              { step: "02", title: "Add Your Subjects", desc: "Enter your subjects with exam dates, priorities, and daily study hours.", icon: BookOpen },
              { step: "03", title: "Generate & Track", desc: "Click once to create your timetable. Mark sessions done and watch your progress grow.", icon: Zap },
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
                  <step.icon className="h-7 w-7 text-violet-400" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  data-testid="button-bottom-dashboard"
                  className="group h-12 px-8 font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                >
                  Open Dashboard
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button
                  size="lg"
                  data-testid="button-bottom-signup"
                  className="group h-12 px-8 font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                >
                  Get Started Free
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 py-8 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading font-semibold text-foreground">StudyFlow</span>
            <span>— Your intelligent study companion</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/signin" className="hover:text-foreground transition-colors" data-testid="footer-link-signin">Sign In</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors" data-testid="footer-link-signup">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
