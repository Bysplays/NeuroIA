import { createContext, useContext } from 'react';

export const PortraitContext = createContext(false);
export const usePortrait = () => useContext(PortraitContext);
