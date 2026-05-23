import { describe, expect, it } from "vitest";
import { formatTeacherFeedbackForDiscord } from "@/lib/ai/format-teacher-feedback-for-discord";

describe("formatTeacherFeedbackForDiscord", () => {
  it("includes pros and cons in the message", () => {
    const message = formatTeacherFeedbackForDiscord({
      teacher_name: "Ms. Smith",
      rating_out_of_10: 8,
      rating_explanation: "Strong clarity and helpfulness overall.",
      pros: ["Clear explanations", "Good class management"],
      cons: ["Pacing could be slower on complex topics"],
    });

    expect(message).toContain("Ms. Smith");
    expect(message).toContain("8/10");
    expect(message).toContain("Clear explanations");
    expect(message).toContain("Pacing could be slower");
    expect(message).toContain("**Pros**");
    expect(message).toContain("**Cons**");
  });
});
