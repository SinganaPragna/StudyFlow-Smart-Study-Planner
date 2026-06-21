import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { BookOpen, Calendar as CalendarIcon, CheckCircle2, Clock, Target, AlertCircle, PieChart, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetDashboard({
    query: { queryKey: getGetDashboardQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive opacity-50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";

  const statCards = [
    {
      label: "Total Subjects",
      value: stats.totalSubjects,
      sub: `${stats.completedSubjects} completed`,
      icon: BookOpen,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-400",
      cardBorder: "border-violet-500/20",
      cardBg: "bg-gradient-to-br from-violet-500/5 to-transparent",
      testId: "text-total-subjects",
    },
    {
      label: "Completed",
      value: stats.completedSubjects,
      sub: "subjects done",
      icon: CheckCircle2,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      cardBorder: "border-emerald-500/20",
      cardBg: "bg-gradient-to-br from-emerald-500/5 to-transparent",
      testId: "text-completed-subjects",
    },
    {
      label: "Pending Subjects",
      value: stats.pendingSubjects,
      sub: "requires attention",
      icon: Target,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
      cardBorder: "border-amber-500/20",
      cardBg: "bg-gradient-to-br from-amber-500/5 to-transparent",
      testId: "text-pending-subjects",
    },
    {
      label: "Study Sessions",
      value: stats.totalSessions,
      sub: `${stats.completedSessions} completed`,
      icon: CalendarIcon,
      iconBg: "bg-sky-500/15",
      iconColor: "text-sky-400",
      cardBorder: "border-sky-500/20",
      cardBg: "bg-gradient-to-br from-sky-500/5 to-transparent",
      testId: "text-total-sessions",
    },
  ];

  const priorityBorderColor = (priority: string) => {
    if (priority === "High") return "border-l-red-500";
    if (priority === "Medium") return "border-l-amber-500";
    return "border-l-sky-500";
  };

  const priorityAccent = (priority: string) => {
    if (priority === "High") return "text-red-400 bg-red-500/10 border-red-500/30";
    if (priority === "Medium") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-sky-400 bg-sky-500/10 border-sky-500/30";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with greeting + progress ring */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{greeting} 👋 — {format(today, "EEEE, MMMM d, yyyy")}</p>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4 bg-gradient-to-br from-violet-500/10 to-pink-500/5 border border-violet-500/20 p-4 rounded-2xl shadow-sm">
          <div className="relative h-20 w-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="url(#progressGrad)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - stats.progressPercentage / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-sm font-bold">{Math.round(stats.progressPercentage)}%</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">Overall Progress</p>
            <p className="text-xs text-muted-foreground">{stats.completedSessions} of {stats.totalSessions} sessions</p>
            <p className="text-xs text-violet-400 font-medium mt-1">
              {stats.progressPercentage >= 80 ? "Excellent pace!" : stats.progressPercentage >= 50 ? "Keep it up!" : "Let's get started!"}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <Card key={i} className={`hover-elevate transition-all shadow-sm ${card.cardBorder} ${card.cardBg}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
                <card.icon className={`h-4.5 w-4.5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-heading" data-testid={card.testId}>{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Exams */}
        <Card className="col-span-1 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingExams.map((exam) => {
                  const isUrgent = exam.daysLeft <= 7;
                  return (
                    <div
                      key={exam.id}
                      className={`flex items-center justify-between p-4 rounded-xl bg-muted/30 border-l-4 border ${priorityBorderColor(exam.priority)} border-border/30`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{exam.name}</h4>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityAccent(exam.priority)}`}>
                            {exam.priority}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(parseISO(exam.examDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${isUrgent ? 'text-destructive' : 'text-violet-400'}`}>
                          {exam.daysLeft}
                        </div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {exam.daysLeft === 1 ? 'Day' : 'Days'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                <Target className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground font-medium text-sm">No upcoming exams</p>
                <p className="text-xs text-muted-foreground opacity-70 mt-1">Add subjects with exam dates to see them here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Summary */}
        <Card className="col-span-1 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15">
                <TrendingUp className="h-4 w-4 text-sky-400" />
              </div>
              Quick Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-muted-foreground">Session Completion</span>
                <span className="font-bold">{stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden bg-muted/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-1000"
                  style={{ width: `${stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-muted-foreground">Subject Completion</span>
                <span className="font-bold">{stats.totalSubjects > 0 ? Math.round((stats.completedSubjects / stats.totalSubjects) * 100) : 0}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden bg-muted/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000"
                  style={{ width: `${stats.totalSubjects > 0 ? (stats.completedSubjects / stats.totalSubjects) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 p-4 rounded-xl border border-violet-500/20">
                <p className="text-xs font-medium text-violet-400 mb-1">Pace</p>
                <p className="text-lg font-bold">{stats.completedSessions > 0 ? 'On Track' : 'Start Now'}</p>
              </div>
              <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 p-4 rounded-xl border border-sky-500/20">
                <p className="text-xs font-medium text-sky-400 mb-1">To Do</p>
                <p className="text-lg font-bold">{stats.totalSessions - stats.completedSessions} Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
