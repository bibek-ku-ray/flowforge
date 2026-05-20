"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CopyIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppOrigin } from "@/hooks/use-app-origin";
import { getAbsoluteAppUrl } from "@/lib/app-url";
import { generateGoogleFormScript } from "./utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  formId?: string;
}

export const GoogleFromTriggerDialog = ({
  open,
  onOpenChange,
  nodeId,
  formId: initialFormId,
}: Props) => {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [formId, setFormId] = useState(initialFormId ?? "");

  useEffect(() => {
    setFormId(initialFormId ?? "");
  }, [initialFormId, open]);

  const saveFormId = useMutation(
    trpc.workflows.updateGoogleFormTrigger.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.workflows.getOne.queryOptions({ id: workflowId }),
        );
      toast.success(
        "Google Form ID saved — submissions will route to this workflow",
      );
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save Google Form ID");
      },
    }),
  );

  const origin = useAppOrigin();
  const webhookUrl = origin
    ? getAbsoluteAppUrl(
        `/api/webhooks/google-form?workflowId=${workflowId}`,
        origin,
      )
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast.error("Webhook URL is not ready yet");
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: formId || "flowforge-test",
          formTitle: "FlowForge Test Submission",
          responseId: `test-${Date.now()}`,
          timestamp: new Date().toISOString(),
          respondentEmail: "test@flowforge.local",
          responses: { test: "ok" },
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }

      toast.success("Test webhook sent — watch nodes update on the canvas");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Test webhook failed",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Google From Trigger Configuration</DialogTitle>
          <DialogDescription>
            Use this webhook URL in your Google Form&apos;s Apps Script to
            trigger this workflow when a from is submitted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <p className="font-medium">Workflow ID</p>
            <p className="mt-1 font-mono text-xs break-all">{workflowId}</p>
            <p className="mt-2 text-muted-foreground text-xs">
              Your Google Apps Script must use this exact workflow ID in the
              webhook URL. If submissions run but this editor does not update,
              your script likely points at a different workflow — re-copy below.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="google-form-id">Google Form ID</Label>
            <div className="flex gap-2">
              <Input
                id="google-form-id"
                value={formId}
                onChange={(event) => setFormId(event.target.value)}
                placeholder="Paste your Google Form ID here"
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!formId.trim() || saveFormId.isPending}
                onClick={() =>
                  saveFormId.mutate({
                    workflowId,
                    nodeId,
                    formId: formId.trim(),
                  })
                }
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Find this in your form URL or Apps Script as{" "}
              <code>e.source.getId()</code>. Saving routes submissions to this
              workflow even if your script uses an old workflow ID.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                size={`icon`}
                variant={`outline`}
                onClick={copyToClipboard}
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
            <Button type="button" variant="secondary" onClick={testWebhook}>
              Send test webhook
            </Button>
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-medium text-sm">Setup instructions:</h4>{" "}
              <ol
                className="text-sm text-muted-foreground space-y-1 list-decimal list-inside"
              >
                <li>Open your Google Form</li>
                <li>Click the three dots menu → Script editor</li>{" "}
                <li>Copy and paste the script below</li>
                <li>Replace WEBHOOK_URL with your webhook URL above</li>{" "}
                <li>Save and click &quot;Triggers&quot; → Add Trigger</li>{" "}
                <li>Choose: From form → On form submit → Save </li>
              </ol>
            </div>
                      <div className="rounded-lg bg-muted p-4 space-y-3">
            <h4 className="font-medium text-sm">Google Apps Script:</h4>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const script = generateGoogleFormScript(webhookUrl);
                try {
                  await navigator.clipboard.writeText(script);
                  toast.success("Script copied to clipboard");
                } catch {
                  toast.error("Failed to copy Script to clipboard");
                }
              }}
            >
              <CopyIcon className="size-4 mr-2" />
              Copy Google Apps Script
            </Button>
            <p className="text-xs text-muted-foreground">
              This script includes your webhook URL and handles form submissions
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Available Variables</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{googleForm.respondentEmail}}"}
                </code>
                - Respondent&apos;s email
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{googleForm.responses['Question Name']}}"}
                </code>
                - Specific answer
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{json googleForm.responses}}"}
                </code>{" "}
                - All responses as JSON
              </li>
            </ul>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
