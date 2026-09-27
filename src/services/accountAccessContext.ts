import { createContext, useContext } from 'react';
import type { AccountAccess } from './accessService';
export const AccountAccessContext = createContext<AccountAccess | null>(null);
export const useAccountAccess = () => useContext(AccountAccessContext);
