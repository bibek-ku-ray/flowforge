"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCreateCalendarEvent,
  useSuspenseCalendarEvent,
  useUpdateCalendarEvent,
} from "@/features/calendar/hooks/use-calendar";

const formSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    allDay: z.boolean(),
    startAt: z.string().min(1, "Start date is required"),
    endAt: z.string().optional(),
    timezone: z.string().min(1, "Timezone is required"),
  })
  .refine(
    (v) => !v.endAt || new Date(v.endAt) >= new Date(v.startAt),
    { message: "End must be after start", path: ["endAt"] },
  );

type FormValues = z.infer<typeof formSchema>;

/** Format a Date for an <input type="datetime-local"> / "date" value. */
const toInputValue = (date: Date | string, allDay: boolean) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm");
};

interface Props {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    startAt: Date | string;
    endAt: Date | string | null;
    allDay: boolean;
    timezone: string;
  };
}

export const CalendarEventForm = ({ initialData }: Props) => {
  const router = useRouter();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const isEdit = !!initialData?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description ?? "",
          allDay: initialData.allDay,
          startAt: toInputValue(initialData.startAt, initialData.allDay),
          endAt: initialData.endAt
            ? toInputValue(initialData.endAt, initialData.allDay)
            : "",
          timezone: initialData.timezone,
        }
      : {
          title: "",
          description: "",
          allDay: false,
          startAt: "",
          endAt: "",
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
  });

  const allDay = form.watch("allDay");

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      allDay: values.allDay,
      timezone: values.timezone,
      startAt: new Date(values.startAt),
      endAt: values.endAt ? new Date(values.endAt) : null,
    };

    if (isEdit && initialData) {
      await updateEvent.mutateAsync(
        { id: initialData.id, ...payload },
        { onSuccess: () => router.push("/calendar") },
      );
    } else {
      await createEvent.mutateAsync(payload, {
        onSuccess: () => router.push("/calendar"),
      });
    }
  };

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Event" : "Create Event"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update this event. Attached reminders are recomputed automatically."
            : "Create an event to drive reminder workflows."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Semester Examination" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional details"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>All-day event</FormLabel>
                    <FormDescription>
                      Use a date without a specific time.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starts</FormLabel>
                  <FormControl>
                    <Input
                      type={allDay ? "date" : "datetime-local"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ends (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type={allDay ? "date" : "datetime-local"}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input placeholder="UTC" className="font-mono" {...field} />
                  </FormControl>
                  <FormDescription>
                    IANA timezone, e.g. Asia/Kathmandu.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createEvent.isPending || updateEvent.isPending}
              >
                {isEdit ? "Save" : "Create"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/calendar" prefetch>
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export const CalendarEventView = ({ eventId }: { eventId: string }) => {
  const { data: event } = useSuspenseCalendarEvent(eventId);
  return <CalendarEventForm initialData={event} />;
};
