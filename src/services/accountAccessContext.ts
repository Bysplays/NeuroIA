import { createContext, useContext } from 'react';
import type { AccountAccess } from './accessService';
export const AccountAccessContext = createContext<AccountAccess | null>(null);
export const useAccountAccess = () => useContext(AccountAccessContext);

// Temporary access revalidation pauses mounted activity without granting play.
export const AccessSuspendedContext = createContext(false);
export const useAccessSuspended = () => useContext(AccessSuspendedContext);
