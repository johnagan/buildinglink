import { z } from "zod";

/**
 * Schema for BuildingLink user phone number
 * Represents a phone number associated with a BuildingLink user.
 */
const BuildingLinkPhoneNumberSchema = z.object({
  /** Unique identifier for the phone number */
  id: z.string(),
  /** Type of phone number (e.g., mobile, home, work) */
  typeId: z.number(),
  /** Country code for the phone number */
  countryCode: z.number(),
  /** The phone number (without country code) */
  phoneNumber: z.number(),
  /** Extension for the phone number, if any */
  extension: z.string(),
});

/**
 * Schema for BuildingLink user occupancy details
 * Represents an individual occupant's details within a BuildingLink property.
 */
export const BuildingLinkOccupantSchema = z.object({
  /** Unique identifier for the occupant */
  id: z.string(),
  /** Occupancy record ID */
  occupancyId: z.string(),
  /** Parent user ID if applicable (nullable) */
  parentUserId: z.string().nullable(),
  /** First name of the occupant */
  firstName: z.string(),
  /** Last name of the occupant */
  lastName: z.string(),
  /** Full name of the occupant */
  fullName: z.string(),
  /** Email address of the occupant */
  emailAddress: z.string(),
  /** URL to the occupant's profile image (nullable) */
  imageUrl: z.string().nullable(),
  /** Whether the occupant is currently active */
  isActive: z.boolean(),
  /** Whether the occupant is a board member */
  isBoardMember: z.boolean(),
  /** Board member title ID (unknown type, nullable) */
  boardMemberTitleId: z.unknown().nullable(),
  /** Occupant type ID (e.g., owner, tenant) */
  typeId: z.number(),
  /** Legacy system ID for the occupant */
  legacyId: z.number(),
  /** Array of phone numbers associated with the occupant */
  phoneNumbers: z.array(BuildingLinkPhoneNumberSchema),
  /** Whether to show the occupant's profile photo */
  showProfilePhoto: z.boolean(),
  /** Whether to display the unit number for the occupant */
  isDisplayUnitNumber: z.boolean(),
  /** Option ID for how the public name is displayed */
  publicNameDisplayedOptionId: z.number(),
  /** Type details for the occupant */
  type: z.object({
    /** Type ID */
    id: z.number(),
    /** Type name */
    name: z.string(),
    /** Node identifier */
    node: z.string(),
    /** Parent type ID */
    parentId: z.number(),
    /** Parent node (null if not applicable) */
    parentNode: z.null(),
  }),
  /** Whether the occupant is a subtenant */
  isSubtenant: z.boolean(),
  /** Emergency contact information for the occupant */
  emergencyContactInfo: z.string(),
  /** Board member title (null if not applicable) */
  boardMemberTitle: z.null(),
});

/**
 * Schema for BuildingLink user occupancy
 * Represents a unit's occupancy details, including all occupants and related info.
 */
export const BuildingLinkOccupancySchema = z.object({
  /** Unique identifier for the occupancy */
  id: z.string(),
  /** Unit ID associated with the occupancy */
  unitId: z.string(),
  /** Occupancy record ID (numeric) */
  occupancyId: z.number(),
  /** Legacy system unit ID */
  unitLegacyId: z.number(),
  /** Full name for the occupancy (e.g., family or group name) */
  fullName: z.string(),
  /** Unit number */
  number: z.string(),
  /** Label for the unit */
  label: z.string(),
  /** Whether the unit is a management unit */
  isManagementUnit: z.boolean(),
  /** Whether the unit is a sub-unit */
  isSubUnit: z.boolean(),
  /** Family name associated with the occupancy */
  familyName: z.string(),
  /** Alternate name for the occupancy */
  alternateName: z.string(),
  /** Whether the occupancy is currently active */
  isActive: z.boolean(),
  /** Primary contact name for the occupancy */
  contactName: z.string(),
  /** Secondary contact name for the occupancy */
  subContactName: z.string(),
  /** Suffix for the unit number */
  unitNumberSuffix: z.string(),
  /** Whether this is a master property reference */
  isMasterPropertyReference: z.boolean(),
  /** Array of occupants for this occupancy */
  occupants: z.array(BuildingLinkOccupantSchema),
  /** Array of occupancy users (minimal info) */
  occupancyUsers: z.array(
    z.object({
      /** User ID */
      id: z.string(),
      /** Legacy system user ID */
      legacyId: z.number(),
    })
  ),
});

/**
 * TypeScript type for a BuildingLink occupant, inferred from the schema.
 */
export type BuildingLinkOccupant = z.infer<typeof BuildingLinkOccupantSchema>;
/**
 * TypeScript type for a BuildingLink occupancy, inferred from the schema.
 */
export type BuildingLinkOccupancy = z.infer<typeof BuildingLinkOccupancySchema>;
