import { z } from "zod";
/**
 * BuildingLink property schema
 */
export const BuildingLinkBuildingSchema = z.object({
  name: z.string(),

  // Contact details
  phone: z.string(),
  imageUrl: z.string().url(),

  // Location info
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),

  // Property details
  occupancy: z.string(),
  occupantNames: z.array(z.string()),
  managementCompanyName: z.string(),

  // System IDs
  id: z.string().uuid(),
  legacyId: z.number(),
  loginId: z.string().uuid(),
  userId: z.number(),

  // Settings and preferences
  currencyCode: z.string(),
  timeZoneCode: z.string(),
  timeZoneId: z.number(),
  timeZoneName: z.string(),
  useInternationalPhoneFormat: z.boolean(),

  // Employee/permissions
  hasPermissionToEnter: z.null(),
  isManualEmployeeEmailAddress: z.boolean(),
  manualDefaultEmailAddress: z.null(),
});

export type BuildingLinkBuilding = z.infer<typeof BuildingLinkBuildingSchema>;
