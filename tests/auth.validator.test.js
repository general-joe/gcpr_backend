import test from 'node:test';
import assert from 'node:assert/strict';
import { signUpSchema } from '../src/modules/auth/signUp.validator.js';

test('signUpSchema accepts multipart-style string values', () => {
  const payload = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    phoneNumber: '+233501234567',
    gender: 'FEMALE',
    userType: 'CAREGIVER',
    otpChannel: 'email',
    acceptedTerms: 'true',
    acceptedPrivacyPolicy: 'true',
    termsVersion: '',
    privacyPolicyVersion: '',
  };

  const result = signUpSchema.parse(payload);

  assert.equal(result.userType, 'CAREGIVER');
  assert.equal(result.acceptedTerms, true);
  assert.equal(result.acceptedPrivacyPolicy, true);
  assert.equal(result.termsVersion, undefined);
  assert.equal(result.privacyPolicyVersion, undefined);
});
