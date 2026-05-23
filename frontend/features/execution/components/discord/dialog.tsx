"use client";

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
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useDialogFormReset } from "@/features/execution/hooks/use-dialog-form-reset";
import { Button } from "@/components/ui/button";
import { parseAiSourceFromContentTemplate } from "@/lib/ai/resolve-ai-source";

const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(identifier, {
      message:
        "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  aiSourceVariable: z
    .string()
    .min(1, "AI source variable is required")
    .regex(identifier, {
      message:
        "AI source must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  username: z.string().optional(),
  webhookUrl: z.string().min(1, "Webhook URL is required"),
});

export type DiscordFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DiscordFormValues) => void;
  defaultValues?: Partial<DiscordFormValues> & { content?: string };
}

function resolveInitialAiSource(
  defaultValues: Partial<DiscordFormValues> & { content?: string },
): string {
  if (defaultValues.aiSourceVariable?.trim()) {
    return defaultValues.aiSourceVariable.trim();
  }

  const fromLegacy = parseAiSourceFromContentTemplate(defaultValues.content);
  if (fromLegacy) {
    return fromLegacy;
  }

  return "openai";
}

export const DiscordDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const initialValues = {
    variableName: defaultValues.variableName || "",
    aiSourceVariable: resolveInitialAiSource(defaultValues),
    username: defaultValues.username || "",
    webhookUrl: defaultValues.webhookUrl || "",
  };

  const form = useForm<DiscordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  useDialogFormReset(form, open, initialValues);

  const watchVariableName =
    useWatch({ control: form.control, name: "variableName" }) || "myDiscord";
  const watchAiSource =
    useWatch({ control: form.control, name: "aiSourceVariable" }) || "myOpenAi";

  const handleSubmit = (values: DiscordFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discord Configuration</DialogTitle>
          <DialogDescription>
            Posts only the validated final AI message to your channel (max 2,000
            characters). Prompt text is never sent.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 mt-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myDiscord" {...field} />
                  </FormControl>
                  <FormDescription>
                    Other nodes can read the sent message as{" "}
                    {`{{${watchVariableName}.messageContent}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiSourceVariable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Source Variable</FormLabel>
                  <FormControl>
                    <Input placeholder="openai" {...field} />
                  </FormControl>
                  <FormDescription>
                    Must match the OpenAI node Variable Name. Discord sends{" "}
                    <code className="text-xs">{`{ "content": "{{${watchAiSource}.text}}" }`}</code>{" "}
                    after validation — not prompts or form data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://discord.com/api/webhooks/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Discord → Channel Settings → Integrations → Webhooks
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Username (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Workflow Bot" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
