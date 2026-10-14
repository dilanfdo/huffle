import { describe, expect, it } from 'vitest';
import { PRIVACY_POLICY_URL } from './links';

describe('PRIVACY_POLICY_URL', () => {
  it('is the exact https URL registered with Google Play and Google sign-in', () => {
    expect(PRIVACY_POLICY_URL).toBe('https://nexusdigitallabs.dev/huffle/privacy-policy/');
  });

  it('is https with a trailing slash (the site canonicalises to it)', () => {
    const url = new URL(PRIVACY_POLICY_URL);
    expect(url.protocol).toBe('https:');
    expect(url.pathname.endsWith('/')).toBe(true);
  });
});
