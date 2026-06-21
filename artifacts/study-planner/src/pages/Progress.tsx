import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, BookOpen, AlertTriangle } from "lucide-react";

export default function ProgressPage() {
  const { data: stats, isLoading, isError } = useGetDashboard({
    query: { queryKey: getGetDashboardQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive opacity-50 mb-4" />
        <h2 className="text-xl font-semibold">Failed to load progress</h2>
      </div>
    );
  }

  const completionRate = stats.totalSessions > 0
    ? (stats.completedSessions / stats.totalSessions) * 100
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-1">Track your study milestones and performance.</p>
      </div>

      <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
          <Trophy className="w-64 h-64 text-primary" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-bold">Overall Journey</h2>
              <p className="text-muted-foreground max-w-lg">
                You've completed {stats.completedSessions} out of {stats.totalSessions} planned study sessions. Keep up the momentum!
              </p>
              <div className="flex gap-4 pt-2">
                <div className="bg-background rounded-lg p-3 border shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingSubjects}</p>
                </div>
              </div>
            </div>

            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <defs>
                  <linearGradient id="progressRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-primary/20" />
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  stroke="url(#progressRingGrad)"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 72}`}
                  strokeDashoffset={`${2 * Math.PI * 72 * (1 - completionRate / 100)}`}
                  className="drop-shadow-md transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{Math.round(completionRate)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Session Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Completed ({stats.completedSessions})</span>
                  <span className="text-muted-foreground">{Math.round(completionRate)}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Remaining ({stats.totalSessions - stats.completedSessions})</span>
                  <span className="text-muted-foreground">{100 - Math.round(completionRate)}%</span>
                </div>
                <Progress value={100 - completionRate} className="h-3 bg-muted [&>div]:bg-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Subject Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalSubjects === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No subjects added yet.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <span className="text-sm font-medium text-muted-foreground">Count</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-medium">Completed</span>
                  </div>
                  <span className="font-bold">{stats.completedSubjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-medium">In Progress</span>
                  </div>
                  <span className="font-bold">{stats.pendingSubjects}</span>
                </div>
                <div className="pt-4">
                  <div className="w-full h-4 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${(stats.completedSubjects / stats.totalSubjects) * 100}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${(stats.pendingSubjects / stats.totalSubjects) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
