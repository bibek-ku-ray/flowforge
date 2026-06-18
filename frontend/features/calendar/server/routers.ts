import { PAGINATION } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { computeFireAt } from "@/lib/reminders/offset";

const eventFilter = z.enum(["upcoming", "past", "all"]).default("upcoming");

const eventInput = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional().nullable(),
  allDay: z.boolean().default(false),
  timezone: z.string().min(1).default("UTC"),
});

export const calendarRouter = createTRPCRouter({
  create: protectedProcedure
    .input(eventInput)
    .mutation(({ ctx, input }) => {
      return prisma.calendarEvent.create({
        data: {
          userId: ctx.auth.user.id,
          title: input.title,
          description: input.description,
          startAt: input.startAt,
          endAt: input.endAt ?? null,
          allDay: input.allDay,
          timezone: input.timezone,
        },
      });
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
        filter: eventFilter,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, filter } = input;
      const now = new Date();

      const dateWhere =
        filter === "upcoming"
          ? { startAt: { gte: now } }
          : filter === "past"
            ? { startAt: { lt: now } }
            : {};

      const where = {
        userId: ctx.auth.user.id,
        title: { contains: search, mode: "insensitive" as const },
        ...dateWhere,
      };

      const [items, totalCount] = await Promise.all([
        prisma.calendarEvent.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where,
          orderBy: { startAt: filter === "past" ? "desc" : "asc" },
        }),
        prisma.calendarEvent.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return prisma.calendarEvent.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
      });
    }),

  update: protectedProcedure
    .input(eventInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Ensure ownership before mutating.
      await prisma.calendarEvent.findUniqueOrThrow({
        where: { id, userId: ctx.auth.user.id },
      });

      return prisma.$transaction(async (tx) => {
        const event = await tx.calendarEvent.update({
          where: { id },
          data: {
            title: data.title,
            description: data.description,
            startAt: data.startAt,
            endAt: data.endAt ?? null,
            allDay: data.allDay,
            timezone: data.timezone,
          },
        });

        // The event's start time may have moved — recompute every attached
        // reminder's fire time and re-arm any that are now in the future.
        const reminders = await tx.eventReminder.findMany({
          where: { eventId: id },
        });
        const now = new Date();

        for (const reminder of reminders) {
          const fireAt = computeFireAt(
            event.startAt,
            reminder.offsetValue,
            reminder.offsetUnit,
            reminder.direction,
          );
          await tx.eventReminder.update({
            where: { id: reminder.id },
            data: {
              fireAt,
              triggeredAt: fireAt > now ? null : reminder.triggeredAt,
            },
          });
        }

        return event;
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.calendarEvent.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
      });
      return prisma.calendarEvent.delete({ where: { id: input.id } });
    }),
});
