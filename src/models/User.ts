import { z } from "zod";

/**
 * Schema for phone number entries associated with a BuildingLink user
 * Contains contact details and metadata about the phone number
 */
const BuildingLinkPhoneNumberSchema = z.object({
  /** Unique identifier for the phone number entry */
  id: z.string().uuid(),
  /** Legacy system identifier */
  legacyId: z.null(),
  /** Reference to the user this phone number belongs to */
  userId: z.string().uuid(),
  /** Type classification for the phone number */
  typeId: z.number(),
  /** International country code */
  countryCode: z.number(),
  /** The actual phone number */
  number: z.number(),
  /** Optional extension number */
  extension: z.string(),
  /** Additional notes about this phone number */
  notes: z.null(),
  /** Whether this is marked as an emergency contact number */
  isEmergencyNumber: z.boolean(),
  /** Timestamp when this entry was created */
  createdAt: z.string(),
  /** Timestamp of last modification */
  updatedAt: z.string(),
});

/**
 * Schema for BuildingLink user profile
 * Contains personal information and account settings
 */
export const BuildingLinkUserSchema = z.object({
  /** Unique identifier for the user */
  id: z.string().uuid(),
  /** Legacy system identifier */
  legacyId: z.number(),
  /** User's login username */
  userName: z.string(),
  /** List of email addresses associated with the user */
  emails: z.array(z.string()),
  /** User's first name */
  firstName: z.string(),
  /** User's last name */
  lastName: z.string(),
  /** User's middle name if available */
  middleName: z.null(),
  /** Type classification for the user account */
  typeId: z.number(),
  /** Hierarchical path representing user's position/role */
  typeNode: z.string(),
  /** Whether user has administrative sub-user privileges */
  isAdminSubUser: z.boolean(),
  /** Whether user has read-only access */
  isReadOnly: z.boolean(),
  /** Identifier for user's avatar image */
  avatarId: z.null(),
  /** URL to user's avatar image */
  avatarUrl: z.null(),
  /** Emergency contact information */
  emergencyContactInfo: z.null(),
  /** List of phone numbers associated with the user */
  phoneNumbers: z.array(BuildingLinkPhoneNumberSchema),
});

export type BuildingLinkUser = z.infer<typeof BuildingLinkUserSchema>;
