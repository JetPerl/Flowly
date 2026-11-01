export const SECURITY_CODE_LENGTH = 4;
export const SECURITY_CODE_EVENT = 'security-code:setup';
export const SECURITY_CODE_STORAGE_KEY = 'flowly:security-code';
export const SECURITY_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
export const SECURITY_BIOMETRY_STORAGE_KEY = 'flowly:security-biometry';
export const SECURITY_FORCE_REAUTH_EVENT = 'security-code:force-reauth';
export const SECURITY_IDLE_TIMEOUT_MS = 60 * 1000;

export const sanitizeSecurityCode = (input: string) =>
  input.replace(/\D/g, '').slice(0, SECURITY_CODE_LENGTH);
