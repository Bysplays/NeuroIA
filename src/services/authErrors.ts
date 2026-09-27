export function authErrorMessage(error: unknown, method: 'google' | 'email' = 'google'): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  // Firebase can encode the rejected referrer in the error code instead of
  // returning auth/unauthorized-domain. Never echo that arbitrary URL to the UI.
  if (typeof code === 'string' && code.startsWith('auth/requests-from-referer-') && code.endsWith('-are-blocked.')) {
    return 'Esta dirección está bloqueada para acceder. Quien administra NeuroIA debe autorizarla en la configuración de acceso.';
  }
  switch (code) {
    case 'auth/popup-closed-by-user': return 'No se ha completado el acceso con Google. Si la ventana se cierra sola, abre esta página en tu navegador habitual, como Safari o Chrome, y vuelve a intentarlo.';
    case 'auth/cancelled-popup-request': return 'Hay otro acceso en curso. Espera a que termine.';
    case 'auth/popup-blocked': return 'Permite las ventanas emergentes de esta página para entrar con Google. Si estás dentro de otra aplicación, abre esta página en tu navegador habitual.';
    case 'auth/unauthorized-domain': return 'Esta dirección aún no está autorizada para acceder. Contacta con quien administra NeuroIA.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found': return `El acceso con ${method === 'email' ? 'correo y contraseña' : 'Google'} aún no está habilitado. Contacta con quien administra NeuroIA.`;
    case 'auth/invalid-email': return 'Revisa la dirección de correo.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'No hemos podido entrar con ese correo y contraseña. Revísalos o recupera tu contraseña. Si usabas Google, continúa con Google.';
    case 'auth/email-already-in-use': return 'No hemos podido crear la cuenta. Prueba a entrar o recuperar tu contraseña. Si usabas Google, entra con Google y añade una contraseña en Ajustes.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements': return 'Usa una contraseña de al menos 6 caracteres. Si no se acepta, añade mayúsculas, minúsculas, números y símbolos o hazla más larga.';
    case 'auth/too-many-requests': return 'Hay demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.';
    case 'auth/requires-recent-login': return 'Para continuar, confirma tu identidad de nuevo.';
    case 'auth/user-mismatch': return 'La cuenta ha cambiado. Cierra este formulario y vuelve a intentarlo con tu cuenta actual.';
    case 'auth/credential-already-in-use':
    case 'auth/account-exists-with-different-credential': return 'Ese acceso pertenece a otra cuenta. Entra con tu método habitual; no hemos combinado las cuentas.';
    case 'auth/provider-already-linked': return 'Esta cuenta ya tiene contraseña. Puedes recuperarla desde la pantalla de acceso.';
    case 'auth/network-request-failed': return 'No hemos podido conectar. Comprueba tu conexión y vuelve a intentarlo.';
    case 'auth/user-disabled': return 'Esta cuenta está desactivada. Contacta con quien administra NeuroIA.';
    default: return 'No hemos podido completar el acceso. Vuelve a intentarlo.';
  }
}
