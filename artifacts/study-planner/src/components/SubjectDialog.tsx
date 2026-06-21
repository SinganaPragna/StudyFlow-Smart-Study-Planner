import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isAfter, startOfDay, parseISO } from "date-fns";
import { useCreateSubject, useUpdateSubject, getListSubjectsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  examDate: z.date().refine((date) => isAfter(date, startOfDay(new Date())), {
    message: "Exam date must be in the future",
  }).optional(),
  priority: z.enum(["High", "Medium", "Low"]),
  hoursPerDay: z.coerce
    .number()
    .min(0.5, "Must be at least 0.5 hours")
    .max(24, "Cannot exceed 24 hours"),
  topics: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: any;
}

export function SubjectDialog({ open, onOpenChange, subject }: SubjectDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!subject;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      priority: "Medium",
      hoursPerDay: 2,
      topics: "",
    },
  });

  useEffect(() => {
    if (open && subject) {
      form.reset({
        name: subject.name,
        examDate: subject.examDate ? parseISO(subject.examDate) : undefined,
        priority: subject.priority,
        hoursPerDay: subject.hoursPerDay,
        topics: subject.topics || "",
      });
    } else if (open && !subject) {
      form.reset({
        name: "",
        priority: "Medium",
        hoursPerDay: 2,
        topics: "",
        examDate: undefined,
      });
    }
  }, [open, subject, form]);

  const createMutation = useCreateSubject({
    mutation: {
      onSuccess: () => {
        toast({ title: "Subject created successfully" });
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Failed to create subject", variant: "destructive" });
      }
    }
  });

  const updateMutation = useUpdateSubject({
    mutation: {
      onSuccess: () => {
        toast({ title: "Subject updated successfully" });
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Failed to update subject", variant: "destructive" });
      }
    }
  });

  const onSubmit = (values: FormValues) => {
    const formattedData = {
      name: values.name,
      examDate: values.examDate ? format(values.examDate, 'yyyy-MM-dd') : null,
      priority: values.priority,
      hoursPerDay: values.hoursPerDay,
      topics: values.topics || undefined,
    };

    if (isEditing) {
      updateMutation.mutate({
        id: subject.id,
        data: formattedData
      });
    } else {
      createMutation.mutate({
        data: formattedData
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Subject" : "Add New Subject"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your subject details below."
              : "Add a new subject to track your study progress and generate your timetable."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Advanced Calculus" {...field} data-testid="input-subject-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="examDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Exam Date <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                    <div className="flex gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "flex-1 pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-exam-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < startOfDay(new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => field.onChange(undefined)}
                          title="Clear exam date"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="hoursPerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Hours per Day</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      {...field}
                      data-testid="input-hours"
                    />
                  </FormControl>
                  <FormDescription>
                    How many hours you plan to study this subject daily
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topics <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Integrals, Derivatives, Limits" {...field} data-testid="input-topics" />
                  </FormControl>
                  <FormDescription>
                    Comma-separated list of topics to cover
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-subject">
                {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
