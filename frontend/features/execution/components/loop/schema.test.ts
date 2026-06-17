import { describe, expect, it } from "vitest";
import { loopFormSchema } from "./schema";

const valid = {
  sourcePath: "usersResponse.users",
  itemVariableName: "currentUser",
  variableName: "processedUsers",
  continueOnError: false,
};

describe("loopFormSchema", () => {
  it("accepts a fully valid configuration", () => {
    expect(loopFormSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a single-segment source path", () => {
    expect(
      loopFormSchema.safeParse({ ...valid, sourcePath: "users" }).success,
    ).toBe(true);
  });

  it("rejects an empty source path", () => {
    const result = loopFormSchema.safeParse({ ...valid, sourcePath: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a source path with spaces", () => {
    const result = loopFormSchema.safeParse({
      ...valid,
      sourcePath: "users response",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an item variable that is not a valid identifier", () => {
    const result = loopFormSchema.safeParse({
      ...valid,
      itemVariableName: "1user",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an output variable with a dot", () => {
    const result = loopFormSchema.safeParse({
      ...valid,
      variableName: "processed.users",
    });
    expect(result.success).toBe(false);
  });

  it("treats continueOnError as optional", () => {
    const { continueOnError, ...withoutFlag } = valid;
    void continueOnError;
    expect(loopFormSchema.safeParse(withoutFlag).success).toBe(true);
  });
});
