import { createContext, useContext } from 'react';
import type { AccountAccess } from './accessService';
export const AccountAccessContext = createContext<AccountAccess | null>(null);
export const useAccountAccess = () => useContext(AccountAccessContext);

// Temporary access revalidation pauses mounted activity without granting play.
export const AccessSuspendedContext = createContext(false);
export const useAccessSuspended = () => useContext(AccessSuspendedContext);

// Active games own a single pause/recovery dialog throughout access revalidation.
export const AccessRecoveryContext = createContext<{
  setGameRecovery: (active: boolean) => void;
  error: string;
  retry: () => void;
  signOut: () => void;
} | null>(null);
export const useAccessRecovery = () => useContext(AccessRecoveryContext);
