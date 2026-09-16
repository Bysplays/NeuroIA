export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  switch (code) {
    case 'auth/popup-closed-by-user': return 'No se ha completado el acceso con Google. Si la ventana se cierra sola, abre esta página en tu navegador habitual, como Safari o Chrome, y vuelve a intentarlo.';
    case 'auth/cancelled-popup-request': return 'Hay otro acceso en curso. Espera a que termine.';
    case 'auth/popup-blocked': return 'Permite las ventanas emergentes de esta página para entrar con Google. Si estás dentro de otra aplicación, abre esta página en tu navegador habitual.';
    case 'auth/unauthorized-domain': return 'Esta dirección aún no está autorizada para acceder. Contacta con quien administra NeuroIA.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found': return 'El acceso con Google aún no está habilitado. Contacta con quien administra NeuroIA.';
    case 'auth/network-request-failed': return 'No hemos podido conectar. Comprueba tu conexión y vuelve a intentarlo.';
    case 'auth/user-disabled': return 'Esta cuenta está desactivada. Contacta con quien administra NeuroIA.';
    default: return 'No hemos podido completar el acceso. Vuelve a intentarlo.';
  }
}
