import { z } from "zod";
/**
 * BuildingLink authentication token structure
 * Contains OAuth2/OIDC standard fields
 */
export const BuildingLinkTokenSchema = z
  .object({
    /** Authorization code */
    code: z.string(),
    /** JWT ID token */
    id_token: z.string(),
    /** OAuth2 access token */
    access_token: z.string(),
    /** Token type (typically "Bearer") */
    token_type: z.string(),
    /** Token expiration time in seconds */
    expires_in: z.string(),
    /** OAuth2 scope */
    scope: z.string(),
    /** OAuth2 state parameter */
    state: z.string(),
    /** OIDC session state */
    session_state: z.string(),
  })
  .and(z.record(z.string()));

export type BuildingLinkToken = z.infer<typeof BuildingLinkTokenSchema>;
