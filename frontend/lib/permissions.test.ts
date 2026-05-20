import { describe, expect, it } from "vitest";
import { isAdminRole, parseUserRole } from "@/lib/permissions";
import { UserRole } from "@/generated/prisma/enums";

describe("permissions", () => {
  it("detects admin roles", () => {
    expect(isAdminRole(UserRole.ADMIN)).toBe(true);
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole(UserRole.USER)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  it("parses user roles", () => {
    expect(parseUserRole("ADMIN")).toBe(UserRole.ADMIN);
    expect(parseUserRole("USER")).toBe(UserRole.USER);
    expect(parseUserRole(undefined)).toBe(UserRole.USER);
  });
});
