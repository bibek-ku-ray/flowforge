import type { TeacherFeedback } from "@/lib/ai/teacher-feedback-schema";

export type AiNodeOutput = {
  /** Final text for downstream nodes (e.g. Discord). */
  text: string;
  /** Schema-validated teacher feedback when using the Google Form → OpenAI → Discord flow. */
  structured?: TeacherFeedback;
};

export function isAiNodeOutput(value: unknown): value is AiNodeOutput {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof (value as AiNodeOutput).text === "string"
  );
}
