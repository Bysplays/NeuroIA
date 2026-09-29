/** Adapted from the supplied NeuroIA-textos-web-final.pdf; see docs/CONTENT.md. */
export const PRODUCT_INTRO = 'NeuroIA es una plataforma de serious play que combina juegos, retos interactivos y tecnología para trabajar capacidades como la atención, la memoria, el lenguaje, la coordinación o la velocidad de respuesta.';

export const PRODUCT_SECTIONS = [
  {
    title: '¿Qué es el serious play?',
    paragraphs: [
      'El serious play utiliza el juego con un propósito que va más allá del entretenimiento.',
      'En NeuroIA, cada actividad plantea pequeños retos que invitan a observar, recordar, reaccionar, decidir, ordenar, relacionar conceptos o coordinar movimientos.',
      'No se trata solo de superar niveles, sino de mantener a la persona activa, implicada y motivada mientras realiza diferentes tipos de tareas.',
    ],
  },
  {
    title: 'Una experiencia que se adapta a cada persona',
    paragraphs: [
      'No todos jugamos igual ni necesitamos el mismo nivel de dificultad.',
      'Las actividades tienen distintos niveles de dificultad que pueden cambiar según los resultados dentro del juego.',
      'El objetivo es ofrecer una experiencia suficientemente desafiante para resultar interesante, pero sin convertirla en frustrante.',
    ],
  },
  {
    title: 'Diferentes habilidades, diferentes juegos',
    paragraphs: ['La plataforma reúne actividades diseñadas para poner en práctica distintas capacidades a través del juego.'],
    items: [
      'Atención y concentración. Localizar objetivos, seguir estímulos o identificar elementos relevantes.',
      'Memoria. Recordar posiciones, secuencias, imágenes, palabras u objetos.',
      'Lenguaje. Nombrar imágenes, relacionar conceptos o jugar con categorías.',
      'Coordinación y precisión. Tocar, arrastrar, ordenar o seguir recorridos.',
      'Lógica y planificación. Organizar acciones o resolver pequeños retos.',
    ],
  },
  {
    title: 'Tecnología que trabaja en segundo plano',
    paragraphs: [
      'Mientras la persona juega, NeuroIA registra información sobre las actividades completadas, como su duración, aciertos, errores y nivel de dificultad.',
      'Estos datos permiten conocer mejor cómo se está utilizando la plataforma y consultar el recorrido dentro del juego.',
    ],
  },
  {
    title: 'Tecnología que no debería complicar las cosas',
    paragraphs: [
      'NeuroIA está diseñada para utilizarse de forma sencilla, con interfaces claras, elementos visuales grandes, instrucciones directas y actividades que pueden adaptarse a diferentes ritmos de uso.',
      'Porque una plataforma tecnológica solo tiene sentido si las personas pueden utilizarla con comodidad.',
    ],
  },
];

export const PRODUCT_NOTICE = 'NeuroIA es una plataforma de entretenimiento, entrenamiento y serious play. No es un producto sanitario y no está destinada al diagnóstico, prevención, tratamiento o seguimiento de enfermedades. La información generada por la plataforma refleja exclusivamente la interacción y el rendimiento del usuario dentro de las actividades.';

/** Operational privacy information verified against the app; controller details confirmed by the owner. */
export const PRIVACY_SECTIONS = [
  {
    title: 'Responsable del tratamiento',
    paragraphs: [
      'CEO Aberto S.L., con NIF B36232361 y domicilio en Rúa Vía Nte., 40, Santiago de Vigo, 36204 Vigo, Pontevedra, es responsable del tratamiento de los datos personales en NeuroIA.',
    ],
  },
  {
    title: 'Tu cuenta y tus preferencias',
    paragraphs: [
      'Para acceder utilizas una cuenta de Google o un correo electrónico y una contraseña. Firebase Authentication gestiona la identificación y la sesión. NeuroIA utiliza el identificador de tu cuenta, tu correo y tu nombre para reconocer tu perfil y asociar tu actividad. La contraseña no se guarda.',
      'Se guardan tus preferencias de presentación, los intereses que eliges y los niveles iniciales de los juegos. El paso opcional «Tu condición» permite indicar si has sufrido un ictus, otra condición o ninguna, el lado afectado y tu movilidad. Puedes decidir no responder. Si accedes por invitación, se solicita tu consentimiento para guardar y compartir estas respuestas con el profesional vinculado. Son contexto del perfil: no cambian los juegos ni la dificultad y no constituyen una valoración clínica. Puedes elegir «Prefiero no responder» para continuar sin aportar estos datos.',
    ],
  },
  {
    title: 'Actividad y progreso',
    paragraphs: [
      'Al completar ejercicios se registran sus resultados: juego, fecha, duración, aciertos, errores, dificultad y ayudas utilizadas, cuando corresponda. Con esta información se muestran tu historial, estadísticas, logros y progreso, y se ajusta la dificultad de los juegos compatibles según tus resultados recientes.',
      'Los cambios de dificultad siguen reglas del juego. No constituyen una evaluación clínica ni un diagnóstico. El progreso se guarda en la nube, asociado a tu cuenta, para recuperarlo al volver a entrar.',
    ],
  },
  {
    title: 'Cuando te vinculas con un profesional',
    paragraphs: [
      'Al canjear una invitación vinculas tu cuenta con el profesional que la ofrece. Mientras esa vinculación y su acceso estén activos, puede consultar tu actividad y resultados, las gráficas de Muse guardadas y el contexto de condición que hayas consentido compartir. También puede proponerte sesiones de juegos.',
      'El acceso profesional no permite modificar tus resultados personales. Puedes abandonar la vinculación desde las opciones de acceso de tu cuenta. Dejar de compartir no borra tu historial ni equivale a eliminar tu cuenta.',
    ],
  },
  {
    title: 'Conexión opcional con Muse',
    paragraphs: [
      'Si conectas un dispositivo Muse compatible y activas la grabación, pueden guardarse resúmenes de las señales EEG y PPG junto con los resultados de los ejercicios. La conexión requiere tu intervención y el permiso Bluetooth del navegador.',
      'Las gráficas guardadas contienen muestras resumidas de amplitud, no la señal EEG completa. No representan diagnósticos, niveles de atención ni mediciones clínicas. Desactivar la grabación detiene la recogida posterior; no elimina las gráficas que ya se hayan guardado.',
    ],
  },
  {
    title: 'Suscripciones y proveedores',
    paragraphs: [
      'Cuando contratas una suscripción, Stripe gestiona el pago y su portal de facturación. NeuroIA conserva referencias de cliente y suscripción, su estado y las fechas necesarias para comprobar el acceso. Los formularios de tarjeta se presentan en Stripe, fuera de los formularios de NeuroIA.',
      'La aplicación utiliza Google Firebase para autenticación y almacenamiento, Cloudflare para comprobar el acceso y gestionar la integración de pagos, y GitHub Pages para servir la web. Estos servicios intervienen en el funcionamiento de la plataforma; sus condiciones y políticas describen sus propios tratamientos.',
    ],
  },
  {
    title: 'Datos en este dispositivo',
    paragraphs: [
      'El navegador conserva la sesión y datos locales necesarios para recuperar tus preferencias y sincronizar cambios pendientes. Cerrar sesión impide continuar usando la cuenta sin identificarse de nuevo, pero no elimina el historial de la nube ni todas las copias locales.',
      'En dispositivos compartidos, cierra la sesión al terminar. Borrar los datos del sitio en el navegador elimina sus copias locales y puede descartar cambios que aún no se hayan sincronizado. La aplicación no incorpora Google Analytics ni seguimiento publicitario.',
    ],
  },
  {
    title: 'Conservación y control de tus datos',
    paragraphs: [
      'El historial guardado permanece asociado a tu cuenta. Cancelar una suscripción, desconectar Muse o cerrar sesión no lo elimina. La vista reciente puede mostrar solo una parte del historial sin que eso signifique que los resultados anteriores se hayan borrado.',
      'Puedes solicitar el borrado desde Ajustes, Mi cuenta, Borrar cuenta. Se pide confirmar tu identidad y escribir ELIMINAR MI CUENTA. Si tienes una suscripción vigente, debes cancelarla en Stripe y esperar a que termine su periodo; las pruebas gratuitas y las invitaciones no impiden el borrado.',
      'El borrado elimina el perfil, la actividad y los vínculos de NeuroIA y se completa en segundo plano. Se conserva un identificador protegido del correo verificado cuando se ha utilizado la prueba gratuita, para impedir repetirla; no se guarda el correo en ese registro. El bloqueo técnico de la cuenta se retira cuando han caducado las sesiones anteriores. Los datos de facturación conservados por Stripe y las copias de otros dispositivos no se eliminan con esta solicitud.',
    ],
  },
  {
    title: 'Tus derechos de privacidad',
    paragraphs: [
      'La normativa de protección de datos reconoce, según las condiciones aplicables, los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad. Cuando un tratamiento se base en el consentimiento, puedes retirarlo sin afectar a la licitud del tratamiento anterior.',
      'También puedes presentar una reclamación ante la Agencia Española de Protección de Datos. Puedes consultar información sobre estos derechos y cómo ejercerlos en su web oficial.',
    ],
  },
];
