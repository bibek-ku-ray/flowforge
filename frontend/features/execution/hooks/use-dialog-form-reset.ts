import { useEffect, useRef } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Resets react-hook-form only when the dialog opens — not on every parent
 * re-render (e.g. React Flow / execution status updates passing a new
 * defaultValues object reference).
 */
export function useDialogFormReset<T extends FieldValues>(
  form: UseFormReturn<T>,
  open: boolean,
  values: T,
) {
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const wasOpenRef = useRef(false);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;

    if (open && !wasOpen) {
      form.reset(valuesRef.current);
    }
  }, [open, form]);
}
