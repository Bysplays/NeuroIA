export const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;
export function hasAccess(data, now) {
  return data?.kind === 'invitation' ||
    (['trial', 'subscription'].includes(data?.kind) && Number(data.expiresAt) > now);
}
export function trialPatch(data, now) {
  if (data?.trialStartedAt != null || hasAccess(data, now)) throw new Error('trial-used');
  return { kind: 'trial', trialStartedAt: now, expiresAt: now + TRIAL_MS };
}
export function normalizeCode(value) {
  if (typeof value !== 'string') throw new Error('invalid-code');
  const code = value.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,64}$/.test(code)) throw new Error('invalid-code');
  return code;
}
export function invitationPatch(invitation, professional, uid, now) {
  if (!invitation?.active || !professional?.active ||
      (invitation.expiresAt != null && invitation.expiresAt <= now) ||
      (invitation.usedBy && invitation.usedBy !== uid)) throw new Error('invalid-code');
  return { kind: 'invitation', professionalId: invitation.professionalId,
    professionalName: professional.name, linkedAt: now, expiresAt: null };
}

/** Invitation and paid access are mutually exclusive. */
export function subscriptionAccessPatch(access, status, expiresAt) {
  if (access?.kind === 'invitation') return null;
  if (status === 'active') return { kind: 'subscription', expiresAt, subscriptionStatus: status };
  if (access?.kind === 'trial') return null;
  return { kind: 'subscription', expiresAt: 0, subscriptionStatus: status };
}
