import { z } from "zod";

// Versioned re-acceptance of Terms + Privacy Policy (Group 3).
// Both must be explicit boolean true; versions are pinned server-side
// to the live documents, never trusted from the client.
export const acceptTermsSchema = z.object({
  acceptedTerms: z.boolean().refine((v) => v === true, "Terms must be accepted"),
  acceptedPrivacyPolicy: z.boolean().refine((v) => v === true, "Privacy Policy must be accepted"),
});
