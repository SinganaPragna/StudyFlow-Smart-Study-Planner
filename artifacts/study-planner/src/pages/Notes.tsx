import { useState } from "react";
import { useListNotes, getListNotesQueryKey, useCreateNote, useUpdateNote, useDeleteNote } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Edit2, StickyNote, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface NoteFormState {
  title: string;
  body: string;
}

export default function Notes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [form, setForm] = useState<NoteFormState>({ title: "", body: "" });
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

  const { data: notes, isLoading } = useListNotes({
    query: { queryKey: getListNotesQueryKey() }
  });

  const createNote = useCreateNote({
    mutation: {
      onSuccess: () => {
        toast({ title: "Note created" });
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        closeDialog();
      },
      onError: () => toast({ title: "Failed to create note", variant: "destructive" }),
    }
  });

  const updateNote = useUpdateNote({
    mutation: {
      onSuccess: () => {
        toast({ title: "Note updated" });
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        closeDialog();
      },
      onError: () => toast({ title: "Failed to update note", variant: "destructive" }),
    }
  });

  const deleteNote = useDeleteNote({
    mutation: {
      onSuccess: () => {
        toast({ title: "Note deleted" });
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        setNoteToDelete(null);
      },
      onError: () => toast({ title: "Failed to delete note", variant: "destructive" }),
    }
  });

  const openCreate = () => {
    setEditingNote(null);
    setForm({ title: "", body: "" });
    setDialogOpen(true);
  };

  const openEdit = (note: any) => {
    setEditingNote(note);
    setForm({ title: note.title, body: note.body ?? "" });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingNote(null);
    setForm({ title: "", body: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editingNote) {
      updateNote.mutate({ id: editingNote.id, data: { title: form.title, body: form.body } });
    } else {
      createNote.mutate({ data: { title: form.title, body: form.body } });
    }
  };

  const isPending = createNote.isPending || updateNote.isPending;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Notes</h1>
          <p className="text-muted-foreground mt-1">Capture ideas, summaries, and reminders.</p>
        </div>
        <Button onClick={openCreate} data-testid="button-new-note" className="hover-elevate">
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !notes?.length ? (
        <div className="text-center py-24 bg-card/30 rounded-2xl border border-dashed border-border/60">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
            <StickyNote className="h-8 w-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No notes yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Create your first note to capture study tips, formulas, or anything you want to remember.
          </p>
          <Button onClick={openCreate} data-testid="button-create-first-note" className="gap-2 bg-violet-600 hover:bg-violet-500 text-white">
            <Plus className="h-4 w-4" /> Create First Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative rounded-xl border border-border/50 bg-card/60 p-5 hover:border-violet-500/30 hover:shadow-md transition-all duration-200 backdrop-blur-sm flex flex-col gap-3"
              data-testid={`note-card-${note.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{note.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => openEdit(note)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    data-testid={`edit-note-${note.id}`}
                    title="Edit note"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setNoteToDelete(note.id)}
                    className="rounded-md p-1.5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors"
                    data-testid={`delete-note-${note.id}`}
                    title="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {note.body ? (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 flex-1 whitespace-pre-wrap">{note.body}</p>
              ) : (
                <p className="text-sm text-muted-foreground/40 italic flex-1">No content</p>
              )}

              <div className="text-[11px] text-muted-foreground/50 mt-auto pt-2 border-t border-border/30">
                {format(parseISO(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="note-title">Title</label>
              <Input
                id="note-title"
                placeholder="Note title..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                data-testid="input-note-title"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="note-body">Content <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
              <Textarea
                id="note-body"
                placeholder="Write anything here..."
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={6}
                className="resize-none"
                data-testid="input-note-body"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending || !form.title.trim()} data-testid="button-save-note">
                {isPending ? "Saving..." : editingNote ? "Save Changes" : "Create Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the note. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteNote.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (noteToDelete) deleteNote.mutate({ id: noteToDelete });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteNote.isPending}
              data-testid="button-confirm-delete-note"
            >
              {deleteNote.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
