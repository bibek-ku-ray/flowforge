import { z } from "zod";

export const teacherFeedbackSchema = z.object({
  teacher_name: z.string().min(1),
  rating_out_of_10: z.number().min(0).max(10),
  rating_explanation: z.string().min(1),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
});

export type TeacherFeedback = z.infer<typeof teacherFeedbackSchema>;

export const TEACHER_FEEDBACK_JSON_SUFFIX = `Return exactly one JSON object with this shape (no markdown, no code fences):
{
  "teacher_name": "string",
  "rating_out_of_10": number,
  "rating_explanation": "string",
  "pros": ["string"],
  "cons": ["string"]
}`;
