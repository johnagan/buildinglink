import { z } from "zod";

/**
 * Schema for a US state or region associated with a vendor.
 */
export const BuildingLinkVendorStateSchema = z.object({
  /** Country identifier (as string) */
  CountryId: z.string(),
  /** Unique identifier for the state */
  Id: z.number(),
  /** Name of the state */
  Name: z.string(),
});

/**
 * Schema for a vendor category (e.g., plumber, electrician).
 */
export const BuildingLinkVendorCategorySchema = z.object({
  /** Unique identifier for the category */
  Id: z.number(),
  /** Name of the category */
  Name: z.string(),
});

/**
 * Schema for a BuildingLink vendor, including contact and business details.
 */
export const BuildingLinkVendorSchema = z.object({
  /** Unique identifier for the vendor */
  Id: z.number(),
  /** Description or about us text for the vendor */
  AboutUs: z.string(),
  /** Street address of the vendor */
  Address: z.string(),
  /** Category ID for the vendor */
  CategoryId: z.number(),
  /** City where the vendor is located */
  City: z.string(),
  /** Email address for the vendor */
  Email: z.string(),
  /** Fax number for the vendor */
  Fax: z.string(),
  /** Business hours for the vendor */
  Hours: z.string(),
  /** Whether the vendor is currently active */
  IsActive: z.boolean(),
  /** Name of the vendor */
  Name: z.string(),
  /** Phone number for the vendor */
  Phone: z.string(),
  /** Whether the product list is modifiable */
  ProductListMod: z.boolean(),
  /** Counter for the number of properties or services provided */
  ProviderCounter: z.number(),
  /** State ID where the vendor is located */
  StateId: z.number(),
  /** Website URL for the vendor */
  Website: z.string(),
  /** Zip code for the vendor's address */
  Zip: z.string(),
  /** Mail confirmation header (null if not set) */
  MailConfirmationHeader: z.null(),
  /** Location information (null if not set) */
  Location: z.null(),
  /** Category details for the vendor */
  Category: BuildingLinkVendorCategorySchema,
  /** Array of properties associated with the vendor (any type) */
  Properties: z.array(z.any()),
  /** State details for the vendor */
  State: BuildingLinkVendorStateSchema,
});

/**
 * TypeScript type for a BuildingLink vendor, inferred from the schema.
 */
export type BuildingLinkVendor = z.infer<typeof BuildingLinkVendorSchema>;
