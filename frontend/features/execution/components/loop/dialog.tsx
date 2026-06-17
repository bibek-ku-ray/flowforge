"use client";

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
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useDialogFormReset } from "@/features/execution/hooks/use-dialog-form-reset";
import { loopFormSchema, type LoopFormValues } from "./schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LoopFormValues) => void;
  defaultValues?: Partial<LoopFormValues>;
}

export const LoopDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const initialValues: LoopFormValues = {
    sourcePath: defaultValues.sourcePath || "",
    itemVariableName: defaultValues.itemVariableName || "",
    variableName: defaultValues.variableName || "",
    continueOnError: defaultValues.continueOnError ?? false,
  };

  const form = useForm<LoopFormValues>({
    resolver: zodResolver(loopFormSchema),
    defaultValues: initialValues,
  });

  useDialogFormReset(form, open, initialValues);

  const watchSourcePath =
    useWatch({ control: form.control, name: "sourcePath" }) ||
    "usersResponse.users";
  const watchItem =
    useWatch({ control: form.control, name: "itemVariableName" }) ||
    "currentUser";
  const watchOutput =
    useWatch({ control: form.control, name: "variableName" }) ||
    "processedUsers";

  const handleSubmit = (values: LoopFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Loop / For Each</DialogTitle>
          <DialogDescription>
            Iterate over an array from a previous node and run every downstream
            node once per item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 mt-4"
          >
            <FormField
              control={form.control}
              name="sourcePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Array Path</FormLabel>
                  <FormControl>
                    <Input placeholder="usersResponse.users" {...field} />
                  </FormControl>
                  <FormDescription>
                    Dotted path to the array in your workflow context, e.g.{" "}
                    {"usersResponse.users"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itemVariableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Item Variable</FormLabel>
                  <FormControl>
                    <Input placeholder="currentUser" {...field} />
                  </FormControl>
                  <FormDescription>
                    Each item is available to downstream nodes as{" "}
                    {`{{${watchItem}.name}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output Variable</FormLabel>
                  <FormControl>
                    <Input placeholder="processedUsers" {...field} />
                  </FormControl>
                  <FormDescription>
                    Collected results are stored under{" "}
                    {`{{${watchOutput}}}`} after the loop finishes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="continueOnError"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Continue on error</FormLabel>
                    <FormDescription>
                      Record failed iterations and keep going instead of failing
                      the whole workflow.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2">
              <p className="font-medium">How iteration works</p>
              <p className="text-muted-foreground">
                If{" "}
                <code className="font-mono">{watchSourcePath}</code> is{" "}
                <code className="font-mono">
                  {`[{ "name": "John" }, { "name": "Sarah" }]`}
                </code>
                , downstream nodes run once per item with{" "}
                <code className="font-mono">{`{{${watchItem}}}`}</code> set to
                each element. Afterwards{" "}
                <code className="font-mono">{watchOutput}</code> holds an array
                of every iteration&apos;s output.
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
