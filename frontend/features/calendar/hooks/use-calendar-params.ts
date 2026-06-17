import { useQueryStates } from "nuqs";
import { calendarParams } from "@/features/calendar/params";

export const useCalendarParams = () => {
  return useQueryStates(calendarParams);
};
