import { z } from "zod";

/**
 * Schema for a BuildingLink delivery location
 */
const BuildingLinkDeliveryLocationSchema = z.object({
  /** Unique identifier for the location */
  Id: z.number().int(),
  /** Property ID the location belongs to */
  PropertyId: z.number().int(),
  /** Full description of the location */
  Description: z.string(),
  /** Short description of the location */
  AbbreviatedDescription: z.string(),
  /** Font color in hex format */
  FontColor: z.string(),
  /** Background color in hex format */
  BackColor: z.string(),
  /** Human readable color name */
  ColorName: z.string(),
  /** Whether the location is active */
  IsActive: z.boolean(),
  /** Display order of the location */
  Order: z.number().int(),
});

/**
 * Schema for a BuildingLink delivery type
 */
const BuildingLinkDeliveryTypeSchema = z.object({
  /** Unique identifier for the type */
  Id: z.number().int(),
  /** Property ID the type belongs to */
  PropertyId: z.number().int(),
  /** Group identifier */
  GroupId: z.number().int(),
  /** Audience identifier */
  AudienceId: z.number().int(),
  /** Icon type identifier */
  IconTypeId: z.number().int(),
  /** Whether the type is active */
  IsActive: z.boolean(),
  /** Long description of the type */
  DescriptionLong: z.string(),
  /** Short description of the type */
  DescriptionShort: z.string(),
  /** Whether deliveries of this type are open by default */
  IsOpenOnCreate: z.boolean(),
  /** Whether type is restricted to managers */
  IsManagerOnly: z.boolean(),
  /** Background color in hex format */
  BackgroundColor: z.string(),
  /** Font color in hex format */
  FontColor: z.string(),
  /** Human readable color name */
  ColorName: z.string(),
  /** Whether notifications are sent when opened */
  IsNotificationSendedOnOpen: z.boolean(),
  /** Whether type appears on tenant homepage */
  IsShownOnTenantHomePage: z.boolean(),
  /** Custom text for open notifications */
  NotificationCustomOpenText: z.string(),
  /** Whether authorizations are enabled */
  IsAuthorizationEnabled: z.boolean(),
  /** Whether authorizations are required */
  IsAuthorizationRequired: z.boolean(),
  /** Signature settings (0-2) */
  IsSignatureEnabled: z.number().int(),
  /** Whether signatures are required */
  IsSignatureRequired: z.boolean(),
});

/**
 * BuildingLink delivery schema
 */
export const BuildingLinkDeliverySchema = z.object({
  /** Unique identifier for the delivery */
  Id: z.number().int(),
  /** Comment when delivery was closed */
  CloseComment: z.string(),
  /** Date when delivery was closed */
  CloseDate: z.string().datetime().nullable(),
  /** Legacy close date */
  CloseDateOld: z.string().datetime().nullable(),
  /** User ID who closed the delivery */
  CloseUserId: z.number().int().nullable(),
  /** Description of the delivery */
  Description: z.string(),
  /** Whether the delivery is open */
  IsOpen: z.boolean(),
  /** Date of last change */
  LastChangeDate: z.string().datetime().nullable(),
  /** Location ID where delivery is stored */
  LocationId: z.number().int(),
  /** User ID to notify */
  NotificationUserId: z.number().int(),
  /** Comment when delivery was opened */
  OpenComment: z.string(),
  /** Date when delivery was opened */
  OpenDate: z.string().datetime().nullable(),
  /** Legacy open date */
  OpenDateOld: z.string().datetime(),
  /** User ID who opened the delivery */
  OpenUserId: z.number().int(),
  /** Property ID the delivery belongs to */
  PropertyId: z.number().int(),
  /** Type ID of the delivery */
  TypeId: z.number().int(),
  /** Unit occupancy ID for the delivery */
  UnitOccupancyId: z.number().int(),
  /** Location details */
  Location: BuildingLinkDeliveryLocationSchema,
  /** Type details */
  Type: BuildingLinkDeliveryTypeSchema,
  /** List of authorizations */
  Authorizations: z.array(z.unknown()),
});

export type BuildingLinkDelivery = z.infer<typeof BuildingLinkDeliverySchema>;
