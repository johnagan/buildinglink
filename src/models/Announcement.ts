import { z } from "zod";

/**
 * BuildingLink announcement schema
 */
export const BuildingLinkAnnouncementSchema = z.object({
  /** Unique identifier for the announcement */
  id: z.string().uuid(),
  /** Property ID the announcement belongs to */
  propertyId: z.number().int().positive(),
  /** Main announcement text content */
  body: z.string(),
  /** Start date of the announcement */
  startDate: z.string().datetime(),
  /** End date of the announcement */
  endDate: z.string().datetime(),
  /** User ID who created the announcement */
  createdByUserId: z.number().int().positive(),
  /** Timestamp when announcement was created */
  createdDateTime: z.string().datetime(),
  /** User ID who last updated the announcement */
  updatedByUserId: z.number().int().positive(),
  /** Timestamp when announcement was last updated */
  updatedDateTime: z.string().datetime(),
  /** Current status of the announcement */
  status: z.string(),
  /** Subject line for email version */
  emailSubject: z.string().nullable(),
  /** HTML content for web display */
  webHTML: z.string(),
  /** HTML content for email version */
  emailHTML: z.string().nullable(),
  /** Name of the layout template used */
  layoutName: z.string().nullable(),
  /** Variables used in the layout template */
  layoutVariables: z.unknown().nullable(),
  /** Email recipient selection criteria */
  emailRecipientSelection: z.unknown().nullable(),
  /** List of email recipients */
  emailRecipients: z.unknown().nullable(),
  /** Email address of the sender */
  senderEmail: z.string().nullable(),
  /** Display name of the sender */
  senderName: z.string().nullable(),
  /** Whether the announcement has been deleted */
  isDeleted: z.boolean(),
  /** Timestamp when email was sent */
  emailSentDateTime: z.string().datetime().nullable(),
  /** Whether the announcement was distributed via email */
  isEmailDistributed: z.boolean(),
  /** Whether the announcement is displayed on the web */
  isWebDistributed: z.boolean(),
  /** Scheduled timestamp for email distribution */
  emailScheduledDateTime: z.string().datetime().nullable(),
  /** Whether this is a high priority announcement */
  isHighPriority: z.boolean(),
});

export type BuildingLinkAnnouncement = z.infer<typeof BuildingLinkAnnouncementSchema>;
