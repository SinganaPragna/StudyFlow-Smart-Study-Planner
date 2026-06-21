import { useState } from "react";
import { useListSubjects, getListSubjectsQueryKey, useDeleteSubject } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, MoreVertical, Edit2, Trash2,
  BookOpen, Clock, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SubjectDialog } from "@/components/SubjectDialog";

export default function Subjects() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 500);
  };

  const { data: subjects, isLoading } = useListSubjects(
    { search: debouncedSearch || undefined },
    { query: { queryKey: getListSubjectsQueryKey({ search: debouncedSearch || undefined }) } }
  );

  const deleteSubject = useDeleteSubject({
    mutation: {
      onSuccess: () => {
        toast({ title: "Subject deleted successfully" });
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        setSubjectToDelete(null);
      },
      onError: () => {
        toast({ title: "Failed to delete subject", variant: "destructive" });
        setSubjectToDelete(null);
      }
    }
  });

  const handleDeleteConfirm = () => {
    if (subjectToDelete) {
      deleteSubject.mutate({ id: subjectToDelete });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'High': return <Badge variant="destructive">High</Badge>;
      case 'Medium': return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Medium</Badge>;
      case 'Low': return <Badge variant="secondary" className="bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:text-green-400">Low</Badge>;
      default: return <Badge>{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage your study curriculum and priorities.</p>
        </div>
        <Button
          onClick={() => {
            setEditingSubject(null);
            setIsDialogOpen(true);
          }}
          data-testid="button-add-subject"
          className="hover-elevate"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Subject
        </Button>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9 bg-background"
              data-testid="input-search-subjects"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : subjects?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No subjects found</h3>
            <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
              {search
                ? "We couldn't find any subjects matching your search. Try different keywords."
                : "You haven't added any subjects yet. Create your first subject to start planning your studies."}
            </p>
            {!search && (
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-subject">
                <Plus className="mr-2 h-4 w-4" /> Create First Subject
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Exam Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Hours/Day</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects?.map((subject) => (
                  <TableRow key={subject.id} className={subject.completed ? "opacity-60 bg-muted/10" : ""}>
                    <TableCell className="font-medium">
                      {subject.name}
                    </TableCell>
                    <TableCell>
                      {subject.examDate ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-1.5 h-3.5 w-3.5" />
                          {format(parseISO(subject.examDate), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground/50 italic">No exam date</span>
                      )}
                    </TableCell>
                    <TableCell>{getPriorityBadge(subject.priority)}</TableCell>
                    <TableCell>{subject.hoursPerDay}h</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {subject.topics || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`menu-subject-${subject.id}`}>
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingSubject(subject);
                              setIsDialogOpen(true);
                            }}
                            data-testid={`edit-subject-${subject.id}`}
                          >
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSubjectToDelete(subject.id)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            data-testid={`delete-subject-${subject.id}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!subjectToDelete} onOpenChange={(open) => !open && setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone and will also delete all associated study sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubject.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSubject.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteSubject.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SubjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        subject={editingSubject}
      />
    </div>
  );
}
