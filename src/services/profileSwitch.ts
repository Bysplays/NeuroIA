import { createContext } from 'react';

// Navigation only: neither profile selection nor this context grants access.
export const ProfileSwitchContext = createContext<(() => void) | null>(null);
