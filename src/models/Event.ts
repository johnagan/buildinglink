import { z } from "zod";

/**
 * Schema for BuildingLink calendar recurrences
 * Represents the recurrence pattern for a calendar event in BuildingLink.
 */
export const BuildingLinkCalendarRecurrenceSchema = z.object({
  /** Unique identifier for the recurrence */
  id: z.string(),
  /** State of the recurrence (e.g., active, inactive) */
  recurrenceState: z.string(),
  /** Frequency of recurrence (e.g., daily, weekly, monthly) */
  frequency: z.string(),
  /** Interval between recurrences (e.g., every 2 weeks) */
  interval: z.number(),
  /** True if the event recurs every weekday */
  everyWeekday: z.boolean(),
  /** Days of the week for recurrence (null if not applicable) */
  weekDays: z.null(),
  /** Specific day of the month for recurrence (null if not applicable) */
  dayXOfTheMonth: z.null(),
  /** Ordinal week of the month for recurrence (null if not applicable) */
  xOfThe: z.null(),
  /** Month for recurrence (null if not applicable) */
  xOfTheMonth: z.null(),
  /** Number of months between yearly recurrences */
  yearlyEveryXMonth: z.number(),
  /** True if the recurrence has no end date */
  noEnd: z.boolean(),
  /** End date for the recurrence (null if not applicable) */
  endOn: z.null(),
  /** Number of occurrences before ending (null if not applicable) */
  endAfterTimes: z.null(),
  /** Parent event ID for the recurrence */
  parentId: z.string(),
});

/**
 * Schema for BuildingLink events
 * Represents a calendar event in BuildingLink, including recurrence and RSVP info.
 */
export const BuildingLinkEventSchema = z.object({
  /** Unique identifier for the event */
  id: z.string(),
  /** Title of the event */
  title: z.string(),
  /** Description of the event */
  description: z.string(),
  /** Event start date/time in UTC (ISO string) */
  startDateUTC: z.string(),
  /** Event end date/time in UTC (ISO string) */
  endDateUTC: z.string(),
  /** Property ID associated with the event */
  propertyId: z.number(),
  /** Category ID for the event */
  categoryId: z.string(),
  /** Whether the event is currently active */
  isActive: z.boolean(),
  /** Last change date/time in UTC (ISO string) */
  changeDateUTC: z.string(),
  /** User ID who last changed the event */
  changeUserId: z.number(),
  /** Whether the event is an all-day event */
  isAllDay: z.boolean(),
  /** Creation date/time in UTC (ISO string) */
  createDateUTC: z.string(),
  /** User ID who created the event */
  createUserId: z.number(),
  /** Whether RSVP is active for the event */
  isRsvpActive: z.boolean(),
  /** Whether the event spans multiple days */
  isMultiday: z.boolean(),
  /** Recurrence ID for the event */
  recurrenceId: z.string(),
  /** User who created the event (null if not tracked) */
  createdBy: z.null(),
  /** User who last updated the event (null if not tracked) */
  updatedBy: z.null(),
  /** Array of RSVP responses (unknown structure) */
  rsvps: z.array(z.unknown()),
  /** Recurrence details for the event */
  calendarRecurrences: BuildingLinkCalendarRecurrenceSchema,
});

/**
 * TypeScript type for a BuildingLink event, inferred from the schema.
 */
export type BuildingLinkEvent = z.infer<typeof BuildingLinkEventSchema>;
