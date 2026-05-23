import type { TeacherFeedback } from "@/lib/ai/teacher-feedback-schema";
import { truncateForDiscord } from "@/lib/ai/validate-ai-output";

function bulletLines(items: string[], emptyLabel: string): string {
  const filtered = items.map((s) => s.trim()).filter(Boolean);
  if (filtered.length === 0) {
    return `• ${emptyLabel}`;
  }
  return filtered.map((item) => `• ${item}`).join("\n");
}

/** Turns structured teacher feedback into a Discord-ready message (pros & cons included). */
export function formatTeacherFeedbackForDiscord(
  feedback: TeacherFeedback,
): string {
  const lines = [
    `📋 **Teacher feedback: ${feedback.teacher_name}**`,
    `⭐ **Rating:** ${feedback.rating_out_of_10}/10`,
    "",
    feedback.rating_explanation.trim(),
    "",
    "**Pros**",
    bulletLines(feedback.pros, "No notable strengths recorded."),
    "",
    "**Cons**",
    bulletLines(feedback.cons, "No notable concerns recorded."),
  ];

  return truncateForDiscord(lines.join("\n"));
}
