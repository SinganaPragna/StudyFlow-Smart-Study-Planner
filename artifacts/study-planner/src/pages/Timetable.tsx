import { useState, useRef, useEffect } from "react";
import {
  useListSessions, getListSessionsQueryKey,
  useGenerateTimetable, useToggleSessionComplete, useListSubjects
} from "@workspace/api-client-react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Download, Zap, CheckCircle2, Circle, Plus, Trash2,
  BookOpen, Calculator, Atom, PenLine, Globe, Music, FlaskConical,
  Cpu, Palette, Dumbbell, Languages, Search, ChevronDown, Table2, LayoutGrid
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SUBJECT_ICONS = [
  { key: "book", icon: BookOpen, label: "Book" },
  { key: "calc", icon: Calculator, label: "Math" },
  { key: "atom", icon: Atom, label: "Science" },
  { key: "pen", icon: PenLine, label: "Writing" },
  { key: "globe", icon: Globe, label: "Geography" },
  { key: "music", icon: Music, label: "Music" },
  { key: "flask", icon: FlaskConical, label: "Chemistry" },
  { key: "cpu", icon: Cpu, label: "Tech" },
  { key: "palette", icon: Palette, label: "Art" },
  { key: "dumbbell", icon: Dumbbell, label: "PE" },
  { key: "lang", icon: Languages, label: "Language" },
  { key: "zap", icon: Zap, label: "Quick" },
];

const manualSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  date: z.string().min(1, "Date is required"),
  hours: z.coerce.number().min(0.5, "Minimum 0.5 hours").max(12, "Maximum 12 hours"),
  topic: z.string().optional(),
  priority: z.enum(["High", "Medium", "Low"]),
  iconKey: z.string().default("book"),
});
type ManualFormValues = z.infer<typeof manualSchema>;

// Combobox component for subject name
function SubjectCombobox({
  value, onChange, subjects
}: {
  value: string;
  onChange: (v: string) => void;
  subjects: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? subjects.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    : subjects;

  const handleSelect = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Type or select subject..."
          className="pl-9 pr-8 bg-background/60 border-border/60"
          data-testid="input-subject-name"
        />
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
          onClick={() => setOpen(!open)}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border/60 bg-popover shadow-xl shadow-black/30 overflow-hidden">
          {filtered.length > 0 && (
            <div className="border-b border-border/40 px-3 py-1.5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your subjects</p>
            </div>
          )}
          <div className="max-h-44 overflow-y-auto">
            {filtered.map(s => (
              <button
                key={s.id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 text-left transition-colors"
                onMouseDown={() => handleSelect(s.name)}
                data-testid={`subject-option-${s.id}`}
              >
                <BookOpen className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                {s.name}
              </button>
            ))}
          </div>
          {query.trim() && !subjects.find(s => s.name.toLowerCase() === query.toLowerCase()) && (
            <div className="border-t border-border/40">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-violet-500/10 text-violet-400 font-medium transition-colors"
                onMouseDown={() => handleSelect(query.trim())}
                data-testid="subject-custom"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                Use "{query.trim()}" as custom subject
              </button>
            </div>
          )}
          {filtered.length === 0 && !query.trim() && (
            <p className="px-3 py-3 text-sm text-muted-foreground text-center">
              No subjects yet. Type to add custom name.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Timetable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("book");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const { data: sessions, isLoading } = useListSessions({ query: { queryKey: getListSessionsQueryKey() } });
  const { data: subjects } = useListSubjects();

  const generateTimetable = useGenerateTimetable({
    mutation: {
      onSuccess: () => {
        toast({ title: "Timetable generated!", description: "Your personalized study plan is ready." });
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to generate", description: "Add subjects with future exam dates first.", variant: "destructive" });
      }
    }
  });

  const toggleComplete = useToggleSessionComplete({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() }) }
  });

  const form = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: { subjectName: "", date: format(new Date(), "yyyy-MM-dd"), hours: 1, topic: "", priority: "Medium", iconKey: "book" },
  });

  const handleGenerate = () => {
    generateTimetable.mutate({ data: { startDate: format(new Date(), "yyyy-MM-dd") } });
  };

  const handleDeleteSession = async (id: number) => {
    try {
      const token = localStorage.getItem("studyflow_token");
      await fetch(`/api/sessions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      toast({ title: "Session removed" });
    } catch {
      toast({ title: "Failed to remove session", variant: "destructive" });
    }
  };

  const onAddSession = async (values: ManualFormValues) => {
    try {
      const token = localStorage.getItem("studyflow_token");
      // Find matching subject for subjectId
      const matchedSubject = subjects?.find(s => s.name.toLowerCase() === values.subjectName.toLowerCase());
      const res = await fetch("/api/sessions/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subjectId: matchedSubject?.id ?? null,
          subjectName: values.subjectName,
          date: values.date,
          hours: values.hours,
          topic: values.topic || null,
          priority: values.priority,
          iconKey: values.iconKey,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      toast({ title: "Session added!", description: `${values.subjectName} on ${format(parseISO(values.date), "MMM d")} — added to your timetable.` });
      setAddOpen(false);
      form.reset();
      setSelectedIcon("book");
    } catch (err) {
      toast({ title: "Failed to add session", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const upcomingSessions = sessions?.filter((s: any) => s.date >= todayStr);
  const hasPastSessions = (sessions?.length ?? 0) > (upcomingSessions?.length ?? 0);

  const groupedSessions = upcomingSessions?.reduce((acc: Record<string, any>, session) => {
    const date = parseISO(session.date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekKey = format(weekStart, "yyyy-MM-dd");
    if (!acc[weekKey]) acc[weekKey] = { weekStart, weekEnd: endOfWeek(date, { weekStartsOn: 1 }), sessions: [] };
    acc[weekKey].sessions.push(session);
    return acc;
  }, {});
  const sortedWeekKeys = groupedSessions ? Object.keys(groupedSessions).sort() : [];

  const getPriorityColor = (p: string) => {
    if (p === "High") return "text-red-400 bg-red-400/10 border-red-400/30";
    if (p === "Medium") return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    return "text-sky-400 bg-sky-400/10 border-sky-400/30";
  };

  const getSessionIcon = (iconKey?: string | null) => {
    const found = SUBJECT_ICONS.find(i => i.key === iconKey);
    const IconComp = found ? found.icon : BookOpen;
    return <IconComp className="h-3.5 w-3.5 text-violet-400 shrink-0" />;
  };

  const stats = sessions ? {
    total: sessions.length,
    done: sessions.filter((s: any) => s.completed).length,
    pct: sessions.length ? Math.round((sessions.filter((s: any) => s.completed).length / sessions.length) * 100) : 0,
  } : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Study Timetable</h1>
          <p className="text-muted-foreground mt-1 no-print">Manage and track your study sessions.</p>
        </div>
        <div className="flex items-center gap-2 no-print flex-wrap">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border/40 bg-card/60 p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "table" ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Table2 className="h-3.5 w-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "cards" ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!sessions?.length} className="gap-1.5 h-8">
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddOpen(true)}
            className="gap-1.5 h-8 border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/60"
            data-testid="button-add-session"
          >
            <Plus className="h-3.5 w-3.5" /> Add Session
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generateTimetable.isPending}
            className="gap-1.5 h-8 bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/30"
            data-testid="button-generate-timetable"
          >
            <Zap className="h-3.5 w-3.5" />
            {generateTimetable.isPending ? "Generating..." : "Auto-Generate"}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && sessions!.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Sessions", value: stats.total, color: "text-foreground" },
            { label: "Completed", value: stats.done, color: "text-emerald-400" },
            { label: "Progress", value: `${stats.pct}%`, color: "text-violet-400" },
          ].map((s, i) => (
            <div key={i} className="bg-card/60 rounded-xl border border-border/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold font-heading ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : !sessions?.length ? (
        <div className="text-center py-24 bg-card/30 rounded-2xl border border-dashed border-border/60 backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
            <Calendar className="h-8 w-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your timetable is empty</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Auto-generate a full study plan from your subjects, or manually add individual sessions one at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleGenerate} data-testid="button-generate-first" className="gap-2 bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/30">
              <Zap className="h-4 w-4" /> Auto-Generate from Subjects
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2 border-violet-500/30 hover:border-violet-500/50">
              <Plus className="h-4 w-4" /> Add Session Manually
            </Button>
          </div>
        </div>
      ) : !upcomingSessions?.length ? (
        <div className="text-center py-24 bg-card/30 rounded-2xl border border-dashed border-border/60 backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
            <Calendar className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No upcoming sessions</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Your previous timetable has expired. Re-generate to create a fresh schedule starting from today.
          </p>
          <Button onClick={handleGenerate} data-testid="button-regenerate" className="gap-2 bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/30">
            <Zap className="h-4 w-4" /> Re-Generate Timetable
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedWeekKeys.map(weekKey => {
            const week = groupedSessions![weekKey];
            const daysInWeek = week.sessions.reduce((acc: Record<string, any[]>, session: any) => {
              if (!acc[session.date]) acc[session.date] = [];
              acc[session.date].push(session);
              return acc;
            }, {});
            const sortedDates = Object.keys(daysInWeek).sort();

            return (
              <div key={weekKey} className="space-y-3">
                {/* Week header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-lg px-3 py-1.5">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-semibold text-violet-300">
                      {format(week.weekStart, "MMM d")} — {format(week.weekEnd, "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
                  <span className="text-xs text-muted-foreground">{week.sessions.length} sessions</span>
                </div>

                {viewMode === "table" ? (
                  /* TABLE VIEW */
                  <div className="overflow-x-auto rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/40 bg-muted/20">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Topic</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hrs</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Priority</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Done</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide no-print">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/25">
                        {sortedDates.flatMap(date =>
                          daysInWeek[date].map((session: any, idx: number) => {
                            const isToday = date === format(new Date(), "yyyy-MM-dd");
                            return (
                              <tr
                                key={session.id}
                                className={`transition-colors group ${session.completed ? "opacity-50" : isToday ? "bg-violet-500/5" : "hover:bg-muted/20"}`}
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {idx === 0 && (
                                    <div className="flex flex-col gap-0.5">
                                      {isToday && <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">Today</span>}
                                      <span className={`text-sm font-medium ${isToday ? "text-violet-300" : "text-muted-foreground"}`}>
                                        {format(parseISO(date), "EEE, MMM d")}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {getSessionIcon(session.iconKey)}
                                    <span className={`font-medium ${session.completed ? "line-through text-muted-foreground" : ""}`}>
                                      {session.subjectName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">
                                  {session.topic ?? <span className="text-muted-foreground/30 italic text-xs">—</span>}
                                </td>
                                <td className="px-4 py-3 font-semibold text-sm">{session.hours}h</td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${getPriorityColor(session.priority)}`}>
                                    {session.priority}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => toggleComplete.mutate({ id: session.id })}
                                    className={`transition-all focus:outline-none rounded-full ${session.completed ? "text-violet-400" : "text-muted-foreground/40 hover:text-violet-400"}`}
                                    data-testid={`toggle-session-${session.id}`}
                                  >
                                    {session.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-center no-print">
                                  <button
                                    onClick={() => handleDeleteSession(session.id)}
                                    className="text-destructive hover:text-destructive/80 transition-colors"
                                    data-testid={`delete-session-${session.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* CARDS VIEW */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {sortedDates.flatMap(date =>
                      daysInWeek[date].map((session: any) => {
                        const isToday = date === format(new Date(), "yyyy-MM-dd");
                        return (
                          <div
                            key={session.id}
                            className={`group relative rounded-xl border p-4 transition-all duration-200 ${
                              session.completed
                                ? "opacity-50 bg-muted/10 border-border/30"
                                : isToday
                                ? "border-violet-500/40 bg-violet-500/5 shadow-sm shadow-violet-500/10"
                                : "border-border/40 bg-card/60 hover:border-violet-500/30 hover:shadow-sm backdrop-blur-sm"
                            }`}
                          >
                            {isToday && !session.completed && (
                              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-t-xl" />
                            )}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                                  {getSessionIcon(session.iconKey)}
                                </div>
                                <span className={`font-semibold text-sm ${session.completed ? "line-through text-muted-foreground" : ""}`}>
                                  {session.subjectName}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteSession(session.id)}
                                className="text-muted-foreground/20 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 no-print shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-violet-400/60" />
                                <span className={isToday ? "text-violet-300 font-medium" : ""}>{format(parseISO(date), "EEE, MMM d")}</span>
                                {isToday && <span className="text-violet-400 font-bold">· Today</span>}
                              </div>
                              {session.topic && <div className="text-muted-foreground/70 truncate">📖 {session.topic}</div>}
                              <div className="flex items-center justify-between mt-2">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getPriorityColor(session.priority)}`}>
                                  {session.priority}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{session.hours}h</span>
                                  <button
                                    onClick={() => toggleComplete.mutate({ id: session.id })}
                                    className={`transition-all ${session.completed ? "text-violet-400" : "text-muted-foreground/40 hover:text-violet-400"}`}
                                  >
                                    {session.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Session Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { form.reset(); setSelectedIcon("book"); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/25">
                <Plus className="h-4 w-4 text-violet-400" />
              </div>
              Add Study Session
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSession)} className="space-y-4 mt-1">

              {/* Subject — combobox */}
              <FormField
                control={form.control}
                name="subjectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <SubjectCombobox
                        value={field.value}
                        onChange={field.onChange}
                        subjects={subjects ?? []}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-background/60 border-border/60" data-testid="input-session-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" min="0.5" max="12" {...field} className="bg-background/60 border-border/60" data-testid="input-session-hours" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Chapter 3..." {...field} className="bg-background/60 border-border/60" data-testid="input-session-topic" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/60 border-border/60">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="High">🔴 High</SelectItem>
                          <SelectItem value="Medium">🟡 Medium</SelectItem>
                          <SelectItem value="Low">🔵 Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Icon picker */}
              <FormField
                control={form.control}
                name="iconKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Icon</FormLabel>
                    <div className="grid grid-cols-6 gap-1.5">
                      {SUBJECT_ICONS.map(({ key, icon: IconComp, label }) => (
                        <button
                          key={key}
                          type="button"
                          title={label}
                          onClick={() => { field.onChange(key); setSelectedIcon(key); }}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                            selectedIcon === key
                              ? "border-violet-500 bg-violet-500/15 text-violet-400 shadow-sm shadow-violet-500/20"
                              : "border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5 text-muted-foreground"
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                          <span className="hidden sm:block text-[10px]">{label}</span>
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/30" data-testid="button-submit-session">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Session
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
