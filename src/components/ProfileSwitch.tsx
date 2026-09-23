import { useContext } from 'react';
import { ProfileSwitchContext } from '../services/profileSwitch';

export function ProfileSwitch({ disabled = false }: { disabled?: boolean }) {
  const onSwitch = useContext(ProfileSwitchContext);
  return onSwitch ? <button className="paper-nav-button" disabled={disabled} onClick={onSwitch}>Cambiar de perfil</button> : null;
}
