/**
 * Terms/privacy acceptance helpers (Group 3).
 *
 * Registration already captures acceptance; the live (current) document
 * versions are server-owned via env, exactly like registration defaults.
 * These pure helpers let login / /auth/me flag versioned re-acceptance
 * without any new tables or consent infrastructure.
 */

export const getLiveTermsVersions = () => ({
  termsVersion: process.env.TERMS_VERSION || "1.0",
  privacyPolicyVersion: process.env.PRIVACY_POLICY_VERSION || "1.0",
});

/**
 * Compare what the user last accepted against the live versions.
 * Missing (never-accepted) counts as requiring re-acceptance.
 */
export const termsReacceptanceRequired = (user) => {
  const live = getLiveTermsVersions();
  const required =
    !user ||
    user.termsVersion !== live.termsVersion ||
    user.privacyPolicyVersion !== live.privacyPolicyVersion;
  return {
    reacceptanceRequired: required,
    acceptedTermsVersion: user?.termsVersion ?? null,
    acceptedPrivacyPolicyVersion: user?.privacyPolicyVersion ?? null,
    liveTermsVersion: live.termsVersion,
    livePrivacyPolicyVersion: live.privacyPolicyVersion,
  };
};
