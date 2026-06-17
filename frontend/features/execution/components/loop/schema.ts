import { z } from "zod";

/** A valid JS identifier — used for the item/output variable names. */
const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** A dotted context path, e.g. `usersResponse.users` or `items.0.value`. */
const dottedPath = /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z0-9_$]+)*$/;

export const loopFormSchema = z.object({
  sourcePath: z
    .string()
    .min(1, { message: "Source array path is required" })
    .regex(dottedPath, {
      message:
        "Use a dotted path like usersResponse.users (letters, numbers, _ and .)",
    }),
  itemVariableName: z
    .string()
    .min(1, { message: "Current item variable is required" })
    .regex(identifier, {
      message:
        "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  variableName: z
    .string()
    .min(1, { message: "Output variable is required" })
    .regex(identifier, {
      message:
        "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  continueOnError: z.boolean().optional(),
});

export type LoopFormValues = z.infer<typeof loopFormSchema>;
