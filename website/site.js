// balackGym website - Internationalization (i18n) & interactivity
// Spanish is the default language as requested, with user toggle between ES and EN.

const I18N = {
  es: {
    meta_title_index: "balackGym — registro de gimnasio y peso corporal libre y de código abierto",
    meta_desc_index: "balackGym es un registro de entrenamiento y peso corporal gratuito y de código abierto. Descarga la app Android o autoalójalo con Docker — sin cuenta, sin nube, sin telemetría.",
    meta_title_about: "Acerca de — balackGym",
    meta_desc_about: "La historia detrás de balackGym: un registro de gimnasio que comenzó como una pequeña app personal en un servidor homelab y creció hasta ser de código abierto.",
    meta_title_docs: "Documentación — balackGym",
    meta_desc_docs: "Cómo instalar balackGym en Android, usarlo en iPhone, autoalojarlo con Docker, importar tu historial y hacer respaldos.",

    // Nav
    nav_features: "Características",
    nav_screens: "Capturas",
    nav_demo: "Demo",
    nav_docs: "Documentación",
    nav_about: "Acerca de",
    nav_download: "Descargar",

    // Hero
    hero_tag: "Tus entrenamientos. Tus pesos. Tus datos.",
    hero_sub: "Un rastreador de gimnasio y peso corporal gratuito y de código abierto. Sin suscripción, sin cuenta obligatoria, sin telemetría — nunca.",
    hero_get: "Obtener balackGym",
    hero_try: "Probar la demo en vivo",

    // Features
    feat_kicker: "Todo lo que un diario de entrenamiento necesita",
    feat_title: "Creado en el gimnasio, no en una sala de juntas",
    feat_lead: "Cada función existe porque era necesaria en el gimnasio — nada está ahí para venderte nada.",
    f1_h: "Entrenamientos guiados",
    f1_p: "Sabe qué día es, inicia la sesión de hoy, autorrellena tus pesos anteriores, cronometra tus descansos y detecta PRs.",
    f2_h: "1.324 ejercicios",
    f2_p: "Biblioteca con buscador y demostraciones animadas, filtrable por grupo muscular y equipamiento real — además de tus ejercicios personalizados.",
    f3_h: "Plan semanal",
    f3_p: "Una rutina por día de la semana, reprogramable en cualquier momento ante imprevistos — sin alterar el plan base.",
    f4_h: "Peso corporal y objetivo",
    f4_p: "Gráfico interactivo con línea de meta; cada cambio se colorea según si te acerca o aleja de ella.",
    f5_h: "Mapa muscular",
    f5_p: "Diagrama corporal sombreado según el estímulo recibido en cada músculo — y cuáles no recibieron nada.",
    f6_h: "Mapa de calor de actividad",
    f6_p: "Vista anual estilo GitHub de tu tiempo de entrenamiento. Rachas incluidas.",
    f7_h: "Progresión basada en reglas",
    f7_p: "Lineal, Greyskull LP, doble progresión o tiempo añadido — por rutina o por ejercicio. Tus pesos ya están listos al abrir la sesión con su justificación.",
    f8_h: "Series cronometradas",
    f8_p: "Planchas, suspensiones y paseos se registran por tiempo con temporizador dedicado. Si paras antes, registra lo que realmente aguantaste.",
    f9_h: "1RM estimado",
    f9_p: "Por ejercicio, calculado de tu mejor serie válida (especificando cuál). No estima por encima de 12 repeticiones.",
    f10_h: "Superseries y cardio",
    f10_p: "Empareja ejercicios consecutivos con un solo descanso, y registra tiempo + velocidad donde el cálculo de peso × repeticiones no aplica.",
    f11_h: "Comparte un plan",
    f11_p: "Envía tus rutinas como un archivo ligero — sin historial ni pesajes — o imprímelo en un PDF limpio. Importar fusiona, nunca sobrescribe.",
    f12_h: "Esfuerzo por serie",
    f12_p: "Puntúa cada serie con RIR o RPE — en la escala que prefieras. Opcional, conservando la escala con la que se registró.",
    f13_h: "Pantalla siempre activa",
    f13_p: "Sin desbloquear el teléfono entre series. La pantalla permanece encendida durante el entrenamiento y vuelve a reposar al terminar.",
    f14_h: "Trae tu historial",
    f14_p: "Importa desde FitNotes, Strong, Hevy — incluyendo el RPE registrado — o el peso corporal directamente de una exportación de Apple Health.",
    f15_h: "12 idiomas",
    f15_p: "Traducción completa de la interfaz e instrucciones de ejercicios en 10 idiomas, cargadas bajo demanda.",
    f16_h: "Passkeys, sin contraseñas",
    f16_p: "Los perfiles autoalojados inician sesión con Face ID / huella dactilar. Los datos de cada persona son suyos.",
    f17_h: "Diseñado, no ensamblado",
    f17_p: "Temas claro y oscuro, 8 colores de acento y juego de iconos dibujado a mano. Mismo aspecto en cualquier teléfono.",
    f18_h: "Tuyo para siempre",
    f18_p: "Exportación e importación en JSON con un toque. Tu registro de entrenamiento es un archivo que te pertenece, no una fila en la nube ajena.",

    // Screenshots
    shots_kicker: "Capturas de pantalla",
    shots_title: "Cinco pantallas, cero distracciones",
    shot_home: "Inicio",
    shot_workout: "Entrenamiento",
    shot_stats: "Estadísticas",
    shot_plan: "Plan",
    shot_library: "Biblioteca",

    // Demo
    demo_kicker: "Demo en vivo",
    demo_title: "Pruébalo aquí mismo",
    demo_lead: "Esta es la aplicación real con datos de ejemplo, ejecutándose en tu navegador — explora, inicia un entrenamiento, cambia lo que quieras.",
    demo_note: "Los datos de la demo viven solo en esta pestaña del navegador y se pueden reiniciar en Ajustes. ¿Prefieres pantalla completa? ",
    demo_fs: "Abrir la demo en pantalla completa →",

    // Download
    dl_kicker: "Instala balackGym",
    dl_title: "Tu entrenamiento, 100% bajo tu control",
    dl_lead: "Sin cuentas obligatorias, sin servidores de terceros y sin suscripciones: todos tus datos se almacenan de forma privada y segura directamente en tu teléfono.",
    dl_card1_h: "📱 Aplicación móvil",
    dl_card1_for: "Para cualquier persona — instala en segundos y entrena a tu ritmo.",
    dl_card1_li1: "Todo se queda de forma privada en tu teléfono",
    dl_card1_li2: "Sin cuentas, sin anuncios y sin cuotas mensuales",
    dl_card1_li3: "Recordatorios nativos en días de entrenamiento",
    dl_card1_li4: "Copias de seguridad rápidas con la hoja de compartir",
    dl_card1_li5: "100% funcional sin conexión a internet",
    dl_card1_btn: "Descargar para Android",
    dl_card1_meta1: "v1.2.4 · 4.3 MB · Android 6.0+ · APK firmado, descarga directa",
    dl_card1_meta2: "<b>¿iPhone?</b> Puedes usarla añadiéndola a tu pantalla de inicio desde Safari para pantalla completa, o consultar <a href=\"docs.html#iphone\">la guía para iOS</a>.",

    // Story
    story_kicker: "¿Por qué existe balackGym?",
    story_quote: "balackGym comenzó como <strong>una pequeña app que construí para mí</strong> — solo quería registrar mis entrenamientos y peso sin una app de suscripción adueñándose de mis datos de entrenamiento. Luego mis amigos quisieron usarla, y fue cobrando vida propia.",
    story_who: "— balackGym · <a href=\"about.html\">conoce la historia completa →</a>",

    // Open Source
    os_kicker: "Código abierto",
    os_title: "Licencia AGPL, para siempre",
    os_lead: "El código es público, la licencia mantiene cada bifurcación abierta y no hay una versión comercial esperando tras bambalinas.",
    os_forks: "bifurcaciones",
    os_issues: "issues abiertas",
    os_ex: "ejercicios",
    os_langs: "idiomas",
    os_repo: "balackGym en GitHub",
    os_contrib: "Contribuir",
    os_changelog: "Historial de cambios",

    // Footer
    foot_copy: "balackGym · AGPL-3.0 · © 2026 balackGym",
    foot_demo: "Demo en vivo",

    // About Page
    about_h1: "Acerca de balackGym",
    about_lead: "balackGym no fue planeado como un producto. Comenzó como una pequeña aplicación que construí para un único usuario: yo.",
    about_p1: "Buscaba tres cosas en el gimnasio: registrar mis entrenamientos, seguir mi peso corporal y comprobar si progresaba. Todas las aplicaciones que probé exigían suscripción, una cuenta obligatoria o mis datos en servidores de terceros — normalmente las tres cosas. Así que hice lo propio de un entusiasta del homelab: construí una pequeña web móvil, la subí a mi propio servidor y empecé a registrar.",
    about_p2: "Resulta que una herramienta que diseñas para ti mismo se pule de una forma en que los productos comerciales no lo hacen. Cada interacción incómoda frente a la jaula de sentadillas se convertía en el arreglo de esa misma noche. El flujo de entrenamiento guiado, el autorrelleno de pesos, el cronómetro de descansos y el ritual de anotar el peso antes de la primera serie surgieron de la experiencia real en la sala de pesas con el teléfono en la mano.",
    about_p3: "Después, mis amigos quisieron unirse. Eso motivó los perfiles con passkey — inicia sesión con huella dactilar, sin contraseñas y con datos separados — y la sincronización entre dispositivos. Con el tiempo, la pequeña página evolucionó a una aplicación React completa, incorporó 12 idiomas, un mapa muscular, importadores para FitNotes, Strong, Hevy y Apple Health, y finalmente una app nativa Android disponible directamente desde esta web.",
    about_p4: "En julio de 2026 liberé el código bajo licencia <b>AGPL</b>. La licencia es la esencia, no un detalle menor: tus datos deben ser tuyos, el software que los gestiona debe ser auditable y nadie — incluyéndome a mí — debe poder arrebatarle una versión cerrada o de pago a la comunidad.",
    about_p5: "balackGym sigue ejecutándose en el mismo servidor homelab donde nació, y sigo registrando cada sesión con él. Ese es el estándar de calidad: soy el primer usuario de cada versión.",
    about_milestones: "Hitos",
    about_m1_title: "La app personal",
    about_m1_when: "principios del verano 2026",
    about_m1_desc: "Una web escrita a mano con JavaScript vanilla en mi servidor. Un usuario, cero pretensiones comerciales.",
    about_principles: "Principios",
    about_pr1: "<b>Tus datos te pertenecen.</b> Local-first, respaldos en un solo archivo, sin cautiverio — salir de balackGym siempre estará a una exportación de distancia.",
    about_pr2: "<b>Cero telemetría, siempre.</b> Si una función necesita analíticas para justificarse, no se incluye.",
    about_pr3: "<b>Mínimas dependencias.</b> El backend es un único archivo Node con una sola dependencia; el frontend es React, un router y un almacén de estado. Lo bastante conciso como para ser auditado.",
    about_pr4: "<b>Código abierto que sigue abierto.</b> AGPL-3.0, de modo que cada bifurcación y versión alojada debe compartir su código con la comunidad.",
    about_get: "Obtener balackGym",
    about_repo: "balackGym en GitHub",
    notes_link: "notas →",

    // Docs Page
    docs_h1: "Guía Móvil: Android e iOS",
    docs_lead: "Todo lo que necesitas para instalar, usar y aprovechar balackGym en tu teléfono móvil. Sin cuentas, sin nube, con privacidad total y tus datos 100% bajo tu control.",
    docs_toc_android: "Android",
    docs_toc_ios: "iPhone (iOS)",
    docs_toc_features: "Funciones móviles",
    docs_toc_import: "Importar historial",
    docs_toc_backup: "Copias de seguridad",
    docs_toc_faq: "Preguntas frecuentes",
    docs_android_h2: "Instalación y uso en Android",
    docs_android_intro: "balackGym para Android es una aplicación ligera (4.3 MB), rápida y autónoma. No depende de servidores ni de Google Play Services, funcionando íntegramente de manera local.",
    docs_android_step1: "Abre <a href=\"/#download\">la sección de descargas</a> desde tu navegador en Android y pulsa en <b>Descargar para Android</b> para obtener el archivo <code>balackgym.apk</code>.",
    docs_android_step2: "Cuando el navegador te solicite permiso para instalar aplicaciones desconocidas, pulsa en <b>Ajustes</b> y activa <b>Autorizar descargas de esta fuente</b>. Este es el procedimiento normal de seguridad en Android para apps fuera de Play Store (denominado <i>sideloading</i>).",
    docs_android_step3: "Abre la descarga, presiona <b>Instalar</b> y listo. La app queda lista en tu cajón de aplicaciones con el icono oficial.",
    docs_android_note: "<b>Actualizaciones sin pérdida de datos:</b> El APK oficial está firmado digitalmente. Cuando descargues una nueva versión de balackGym, instálala directamente sobre la actual: el sistema preservará todos tus entrenamientos, pesos y rutinas intactos.",
    docs_android_storage: "Todos tus registros se guardan en el almacenamiento privado del teléfono en formato JSON. Ningún dato sale de tu dispositivo.",
    docs_ios_h2: "Uso en iPhone (iOS)",
    docs_ios_intro: "Debido a que Apple restringe la instalación libre de archivos fuera de su tienda oficial, balackGym ofrece dos alternativas excelentes para disfrutar de la experiencia móvil en iOS:",
    docs_ios_pwa_h3: "Método 1: Instalación inmediata como Web App (Recomendado)",
    docs_ios_pwa_desc: "Safari en iOS permite instalar balackGym directamente en tu pantalla de inicio como una aplicación web progresiva independiente, sin vencimientos ni certificados:",
    docs_ios_pwa_s1: "Abre el sitio web o la <a href=\"demo/index.html\">demo en vivo</a> en <b>Safari</b> desde tu iPhone.",
    docs_ios_pwa_s2: "Toca el botón <b>Compartir</b> (el icono del cuadro con flecha hacia arriba situado en la barra inferior).",
    docs_ios_pwa_s3: "Desplázate hacia abajo y selecciona <b>Añadir a pantalla de inicio</b>.",
    docs_ios_pwa_s4: "Pulsa <b>Añadir</b> en la esquina superior derecha. Se creará el acceso directo con el icono oficial de Team Balack.",
    docs_ios_pwa_note: "La app se abrirá a pantalla completa (sin la barra de direcciones de Safari), con persistencia local y soporte offline completo.",
    docs_ios_native_h3: "Método 2: Compilar como App Nativa en iOS (Xcode / AltStore)",
    docs_ios_native_desc: "Si prefieres compilar la aplicación nativa en tu iPhone utilizando el código abierto del proyecto:",
    docs_ios_native_li1: "<b>Con Mac y Xcode:</b> Abre la carpeta <code>frontend/ios</code> en Xcode, asigna tu equipo con una cuenta gratuita de Apple ID y pulsa <b>Run</b> con tu iPhone conectado por cable. La firma gratuita es renovable cada 7 días.",
    docs_ios_native_li2: "<b>Con AltStore o Sideloadly:</b> Permite automatizar la renovación de la firma de apps en tu iPhone por Wi-Fi sin necesidad de cuenta de desarrollador de pago.",
    docs_ios_native_li3: "<b>Protección contra purgas de iOS:</b> La versión móvil de balackGym guarda un espejo en archivo físico (<code>opengym-state.json</code>) para garantizar que iOS jamás borre tus registros cuando el teléfono tenga poco espacio de almacenamiento.",
    docs_features_h2: "Funciones y ventajas móviles",
    docs_f_wakelock: "<b>Pantalla siempre encendida durante el entreno (Wake Lock):</b> Olvídate de tener que desbloquear el teléfono entre series con las manos sudadas o llenas de magnesio. La pantalla permanece activa mientras dure el entrenamiento y se suspende normalmente al terminar.",
    docs_f_alarms: "<b>Recordatorios locales exactos:</b> Configura qué días entrenas y a qué hora. La app programa alertas nativas al minuto exacto (mediante <code>SCHEDULE_EXACT_ALARM</code> en Android y notificaciones locales en iOS), sin depender de conexión a internet.",
    docs_f_timer: "<b>Temporizador de descanso háptico y sonoro:</b> Cronometra automáticamente los descansos entre series y te avisa mediante vibración cuando es hora de la siguiente serie.",
    docs_f_offline: "<b>100% Funcional sin internet:</b> Puedes entrenar en sótanos, zonas sin cobertura o en modo avión. Solo se descargan las animaciones de ejercicios la primera vez que las consultas y quedan guardadas en la caché del dispositivo.",
    docs_import_h2: "Importar historial de entrenamiento",
    docs_import_p1: "¿Vienes de otra aplicación de registro? No tienes que empezar de cero. En tu móvil ve a <b>Ajustes → Datos → Importar de otra app</b>. Es compatible con:",
    docs_import_li1: "<b>FitNotes:</b> Admite tanto exportaciones CSV de Android como FitNotes 2 para iOS.",
    docs_import_li2: "<b>Strong y Hevy:</b> Exportaciones en CSV. Conserva pesos, repeticiones, fechas y duración de sesiones para tu mapa de calor.",
    docs_import_li3: "<b>Apple Health:</b> Importa tu historial de peso corporal directamente del archivo XML de exportación de salud de iOS.",
    docs_import_li4: "<b>Archivos CSV genéricos:</b> Cualquier hoja de cálculo con columnas de fecha, nombre de ejercicio y peso/repeticiones.",
    docs_import_p2: "El sistema coteja los ejercicios con la base de datos de 1.324 ejercicios y te muestra una vista previa interactiva antes de guardar cualquier dato.",
    docs_backup_h2: "Copias de seguridad y migración",
    docs_backup_p: "En <b>Ajustes → Datos → Exportar copia de seguridad (JSON)</b> puedes generar un archivo único con todos tus planes, entrenamientos, registros de peso corporal y marcas personales. Al tocar exportar en tu móvil, se abre la hoja de compartir nativa (AirDrop, WhatsApp, Google Drive, iCloud, correo o guardar en Archivos). Puedes restaurar este archivo en cualquier momento en un nuevo teléfono Android o iPhone con total interoperabilidad.",
    docs_faq_h2: "Preguntas frecuentes móviles",
    docs_faq_q1: "¿Por qué balackGym se distribuye directamente sin Play Store ni App Store?",
    docs_faq_a1: "Por coherencia y libertad: las tiendas de aplicaciones imponen comisiones, restricciones de código abierto incompatibles con AGPL-3.0 y actúan como intermediarios forzosos. balackGym garantiza que la app te pertenece a ti, no a una tienda de apps.",
    docs_faq_q2: "¿Qué permisos solicita la aplicación en mi teléfono?",
    docs_faq_a2: "Solo permisos para enviar <b>notificaciones locales</b> (para el temporizador de descanso y los recordatorios de días de entreno). No solicita acceso a tu cámara, ni a tu ubicación, ni a tus contactos.",
    docs_faq_q3: "¿Puedo transferir mis entrenamientos entre un móvil Android y un iPhone?",
    docs_faq_a3: "Sí, al 100%. El archivo de respaldo JSON generado por balackGym es exactamente el mismo en ambas plataformas. Solo expórtalo en tu teléfono actual e impórtalo en el nuevo.",
    docs_faq_q4: "¿Consume mucha batería la app durante el entrenamiento?",
    docs_faq_a4: "No. El diseño utiliza un tema negro OLED ultra optimizado con cero procesos de telemetría o rastreo en segundo plano, maximizando la autonomía de tu batería durante las sesiones intensas de gimnasio."
  },
  en: {
    meta_title_index: "balackGym — free, open-source gym & body-weight tracker",
    meta_desc_index: "balackGym is a free, open-source gym & body-weight tracker. Download the Android app or self-host it with Docker — no account, no cloud, no telemetry.",
    meta_title_about: "About — balackGym",
    meta_desc_about: "The story behind balackGym: a gym tracker that started as a tiny personal app on a homelab server and grew into an open-source project.",
    meta_title_docs: "Docs — balackGym",
    meta_desc_docs: "How to install balackGym on Android, use it on iPhone, self-host it with Docker, import your training history, and keep backups.",

    // Nav
    nav_features: "Features",
    nav_screens: "Screenshots",
    nav_demo: "Demo",
    nav_docs: "Docs",
    nav_about: "About",
    nav_download: "Download",

    // Hero
    hero_tag: "Your workouts. Your weights. Your data.",
    hero_sub: "A free, open-source gym & body-weight tracker. No subscription, no account required, no telemetry — ever.",
    hero_get: "Get balackGym",
    hero_try: "Try the live demo",

    // Features
    feat_kicker: "Everything a training log needs",
    feat_title: "Built in the gym, not in a boardroom",
    feat_lead: "Every feature exists because it was needed on the gym floor — nothing is there to sell you anything.",
    f1_h: "Guided workouts",
    f1_p: "Knows what day it is, starts today's session, pre-fills your weights from last time, times your rest, spots PRs.",
    f2_h: "1,324 exercises",
    f2_p: "Searchable library with animated demos, filterable by body part and the equipment you actually own — plus your own custom exercises.",
    f3_h: "Weekly plan",
    f3_p: "A routine per weekday, and any day can be rescheduled when life happens — without touching the plan.",
    f4_h: "Body weight & goal",
    f4_p: "Interactive chart with your goal line; every change is colored by whether it moves toward it.",
    f5_h: "Muscle map",
    f5_p: "A body diagram shaded by how much work each muscle got — and which ones got nothing.",
    f6_h: "Activity heatmap",
    f6_p: "A GitHub-style year view of your training time. Streaks included.",
    f7_h: "Progression that follows a rule",
    f7_p: "Linear, Greyskull LP, double progression or added time — per routine, overridable per exercise. Your weights are already right when the session opens, and every target tells you why.",
    f8_h: "Timed sets",
    f8_p: "Planks, hangs and carries are logged by time, with a timer for the set itself. Stop early and it logs what you actually held.",
    f9_h: "Estimated 1RM",
    f9_p: "Per exercise, from your best eligible set — and it names which one. Won't guess above 12 reps.",
    f10_h: "Supersets & cardio",
    f10_p: "Pair exercises back-to-back with one rest, and log time + speed where weight × reps makes no sense.",
    f11_h: "Share a plan",
    f11_p: "Send someone your routines as a small file — no workouts, no weigh-ins — or print it as a clean PDF. Importing merges, never overwrites.",
    f12_h: "Effort per set",
    f12_p: "Rate a set as RIR or RPE — whichever scale you already think in. Optional, and every set keeps the scale it was logged with.",
    f13_h: "Screen stays awake",
    f13_p: "No unlocking the phone between sets. The screen stays lit while a workout runs, and lets go the moment you finish.",
    f14_h: "Bring your history",
    f14_p: "Import from FitNotes, Strong, Hevy — including the RPE they recorded — or body weight straight out of an Apple Health export.",
    f15_h: "12 languages",
    f15_p: "Full UI translation, exercise instructions in 10 languages, loaded on demand.",
    f16_h: "Passkeys, not passwords",
    f16_p: "Self-hosted profiles sign in with Face ID / fingerprint. Each person's data stays their own.",
    f17_h: "Designed, not assembled",
    f17_p: "Light & dark themes, 8 accent colors, a hand-drawn icon set. Looks the same on every phone.",
    f18_h: "Yours to keep",
    f18_p: "One-tap JSON export and import. Your training log is a file you own, not a row in someone's cloud.",

    // Screenshots
    shots_kicker: "Screenshots",
    shots_title: "Five screens, zero clutter",
    shot_home: "Home",
    shot_workout: "Workout",
    shot_stats: "Stats",
    shot_plan: "Plan",
    shot_library: "Library",

    // Demo
    demo_kicker: "Live demo",
    demo_title: "Try it right here",
    demo_lead: "This is the real app with seeded example data, running in your browser — poke around, start a workout, change anything.",
    demo_note: "Demo data lives only in this browser tab-family and can be reset in its Settings. Prefer a full window? ",
    demo_fs: "Open the demo full-screen →",

    // Download
    dl_kicker: "Install balackGym",
    dl_title: "Your training, 100% under your control",
    dl_lead: "No mandatory sign-ups, no third-party clouds, and no subscriptions: all your data stays private and secure right on your phone.",
    dl_card1_h: "📱 Mobile App",
    dl_card1_for: "For everyone — install in seconds and train at your own pace.",
    dl_card1_li1: "Everything stays private on your phone",
    dl_card1_li2: "No accounts, no ads, no monthly fees",
    dl_card1_li3: "Native reminders on workout days",
    dl_card1_li4: "Quick backups via the native share sheet",
    dl_card1_li5: "100% functional offline without internet",
    dl_card1_btn: "Download for Android",
    dl_card1_meta1: "v1.2.4 · 4.3 MB · Android 6.0+ · Signed APK, direct download",
    dl_card1_meta2: "<b>iPhone?</b> Add it to your home screen from Safari for a full-screen experience, or see <a href=\"docs.html#iphone\">the setup guide</a>.",

    // Story
    story_kicker: "Why balackGym exists",
    story_quote: "balackGym started as <strong>a tiny app I built for myself</strong> — I just wanted to log my workouts and weight without a subscription app claiming my training data. Then friends wanted in, then it grew a mind of its own.",
    story_who: "— balackGym · <a href=\"about.html\">read the whole story →</a>",

    // Open Source
    os_kicker: "Open source",
    os_title: "AGPL-licensed, forever",
    os_lead: "The code is public, the license keeps every fork open, and there is no commercial version waiting behind a curtain.",
    os_forks: "forks",
    os_issues: "open issues",
    os_ex: "exercises",
    os_langs: "languages",
    os_repo: "balackGym on GitHub",
    os_contrib: "Contributing",
    os_changelog: "Changelog",

    // Footer
    foot_copy: "balackGym · AGPL-3.0 · © 2026 balackGym",
    foot_demo: "Live demo",

    // About Page
    about_h1: "About balackGym",
    about_lead: "balackGym wasn't planned as a product. It started as a tiny app I built for one user: me.",
    about_p1: "I wanted three things at the gym: log my workouts, track my body weight, and see whether any of it was going anywhere. Every app I tried wanted a subscription, an account, or my training data on someone else's servers — usually all three. So I did the homelab thing: built a small mobile web page, put it on my own server, and started logging.",
    about_p2: "It turns out a tracker you build for yourself gets sharpened in a way products don't. Every awkward tap at the squat rack became that evening's fix. The guided workout flow, the weight pre-fills, the rest timer, the \"ask my body weight before the first set\" ritual — none of that came from a feature list. It came from actually standing in the gym with the thing in my hand.",
    about_p3: "Then friends wanted in. That brought passkey profiles — sign in with your fingerprint, no passwords, everyone's data separate — and sync, so the log survives any phone. Somewhere along the way the little page got rewritten into a proper React app, learned 12 languages, grew a muscle map, importers for FitNotes, Strong, Hevy and Apple Health, and finally became a native Android app you can install from this site.",
    about_p4: "In July 2026 I open-sourced the whole thing under the <b>AGPL</b>. The license is the point, not a footnote: your training data should be yours, the software that holds it should be inspectable, and nobody — including me — should be able to take a closed, paid version of it away from the community.",
    about_p5: "balackGym still runs on the same homelab server it started on, and I still log every session with it. That's the quality bar: I'm the first user of every release.",
    about_milestones: "Milestones",
    about_m1_title: "The personal app",
    about_m1_when: "early summer 2026",
    about_m1_desc: "A hand-written vanilla-JS page on my own server. One user, zero ambitions.",
    about_principles: "Principles",
    about_pr1: "<b>Your data is yours.</b> Local-first, one-file backups, no lock-in — leaving balackGym must always be one export away.",
    about_pr2: "<b>No telemetry, ever.</b> If a feature needs analytics to justify itself, it doesn't ship.",
    about_pr3: "<b>Dependency-light.</b> The backend is one Node file with a single dependency; the frontend is React, a router and a store. Small enough to actually audit.",
    about_pr4: "<b>Open source that stays open.</b> AGPL-3.0, so every fork and every hosted version owes its code back to everyone.",
    about_get: "Get balackGym",
    about_repo: "balackGym on GitHub",
    notes_link: "notes →",

    // Docs Page
    docs_h1: "Mobile Guide: Android & iOS",
    docs_lead: "Everything you need to install, use, and get the most out of balackGym on your mobile phone. No accounts, no cloud, complete privacy, and your data 100% under your control.",
    docs_toc_android: "Android",
    docs_toc_ios: "iPhone (iOS)",
    docs_toc_features: "Mobile features",
    docs_toc_import: "Import history",
    docs_toc_backup: "Backups",
    docs_toc_faq: "FAQ",
    docs_android_h2: "Installation & Usage on Android",
    docs_android_intro: "balackGym for Android is a lightweight (4.3 MB), fast, and standalone app. It does not rely on backend servers or Google Play Services, operating entirely locally.",
    docs_android_step1: "Open <a href=\"/#download\">the download section</a> from your Android browser and tap <b>Download for Android</b> to get <code>balackgym.apk</code>.",
    docs_android_step2: "When your browser asks for permission to install unknown apps, tap <b>Settings</b> and toggle on <b>Allow from this source</b>. This is standard Android security for apps outside the Play Store (known as <i>sideloading</i>).",
    docs_android_step3: "Open the downloaded file, tap <b>Install</b>, and you are ready. The app appears in your app drawer with the official icon.",
    docs_android_note: "<b>Seamless updates:</b> The official APK is digitally signed. When you download an update, install it directly over the existing app: Android preserves all your workouts, weights, and routines intact.",
    docs_android_storage: "All your data is stored in the device's private storage in JSON format. Nothing leaves your phone.",
    docs_ios_h2: "Usage on iPhone (iOS)",
    docs_ios_intro: "Because Apple restricts free app installations outside its App Store, balackGym offers two great options for iPhone users:",
    docs_ios_pwa_h3: "Method 1: Instant Web App (Recommended)",
    docs_ios_pwa_desc: "Safari on iOS allows adding balackGym straight to your Home Screen as a standalone progressive web app, with no certificate expiration:",
    docs_ios_pwa_s1: "Open the website or the <a href=\"demo/index.html\">live demo</a> in <b>Safari</b> on your iPhone.",
    docs_ios_pwa_s2: "Tap the <b>Share</b> button (square icon with an arrow pointing up at the bottom).",
    docs_ios_pwa_s3: "Scroll down and select <b>Add to Home Screen</b>.",
    docs_ios_pwa_s4: "Tap <b>Add</b> at the top right. A shortcut with the official Team Balack icon will be created.",
    docs_ios_pwa_note: "The app opens in full-screen mode (without Safari toolbars), featuring persistent local storage and full offline capabilities.",
    docs_ios_native_h3: "Method 2: Native iOS Build (Xcode / AltStore)",
    docs_ios_native_desc: "If you prefer compiling the native app directly to your iPhone using the open-source code:",
    docs_ios_native_li1: "<b>With Mac and Xcode:</b> Open <code>frontend/ios</code> in Xcode, choose your team with a free Apple ID, and click <b>Run</b> with your iPhone connected. Free signing renews every 7 days.",
    docs_ios_native_li2: "<b>With AltStore or Sideloadly:</b> Automate the 7-day app re-signing over Wi-Fi without needing a paid Apple Developer account.",
    docs_ios_native_li3: "<b>iOS Eviction Protection:</b> The mobile build of balackGym maintains a persistent file mirror (<code>opengym-state.json</code>) so iOS never purges your training history under storage pressure.",
    docs_features_h2: "Mobile Features & Benefits",
    docs_f_wakelock: "<b>Always-on Screen during Workouts (Wake Lock):</b> Never unlock your phone with chalky or sweaty hands between sets. The screen stays awake while a session is active and sleeps normally once finished.",
    docs_f_alarms: "<b>Precise Local Reminders:</b> Configure your training days and time. The app schedules native alarms down to the minute (using <code>SCHEDULE_EXACT_ALARM</code> on Android and local notifications on iOS), requiring zero internet connection.",
    docs_f_timer: "<b>Haptic & Sound Rest Timer:</b> Automatically counts down rest periods between sets and alerts you with vibration when it's time for the next set.",
    docs_f_offline: "<b>100% Offline Capable:</b> Train in basement gyms, dead zones, or flight mode. Exercise animations are fetched once on demand and kept in local cache.",
    docs_import_h2: "Importing Training History",
    docs_import_p1: "Switching from another tracker? In the mobile app, go to <b>Settings → Data → Import from another app</b>. Compatible with:",
    docs_import_li1: "<b>FitNotes:</b> Supports CSV exports from both Android and FitNotes 2 for iOS.",
    docs_import_li2: "<b>Strong & Hevy:</b> CSV exports — preserves weights, reps, dates, and session duration for your activity heatmap.",
    docs_import_li3: "<b>Apple Health:</b> Imports body-weight history directly from your iOS Health XML export.",
    docs_import_li4: "<b>Generic CSV:</b> Any spreadsheet containing date, exercise name, and weight/reps columns.",
    docs_import_p2: "Exercise names are automatically matched against our 1,324-exercise database with an interactive preview before saving.",
    docs_backup_h2: "Backups & Migration",
    docs_backup_p: "In <b>Settings → Data → Export backup (JSON)</b> you can generate a single file containing all your plans, workouts, body weight, and PRs. Tapping export opens the native system share sheet (AirDrop, WhatsApp, Google Drive, iCloud, email, or Files). You can restore this file at any time on a new Android or iPhone with seamless interoperability.",
    docs_faq_h2: "Mobile FAQ",
    docs_faq_q1: "Why is balackGym distributed directly without Play Store or App Store?",
    docs_faq_a1: "For freedom and independence: app stores impose restrictions incompatible with the AGPL-3.0 license and act as forced intermediaries. balackGym ensures your software and data belong to you.",
    docs_faq_q2: "What permissions does the app request on my phone?",
    docs_faq_a2: "Only permission to send <b>local notifications</b> (for the rest timer and workout reminders). It never requests access to your camera, location, or contacts.",
    docs_faq_q3: "Can I transfer my workouts between an Android phone and an iPhone?",
    docs_faq_a3: "Yes, 100%. The backup JSON file is universal and identical across both platforms. Just export on your current device and import on the new one.",
    docs_faq_q4: "Does the app drain battery during workouts?",
    docs_faq_a4: "No. The interface uses an ultra-optimized OLED true black theme with zero background telemetry or tracking processes, maximizing battery life during tough gym sessions."
  }
};

// Current active language: default to 'es'
const DEFAULT_LANG = 'es';
let currentLang = DEFAULT_LANG;
try {
  const saved = localStorage.getItem('site_lang');
  if (saved === 'es' || saved === 'en') {
    currentLang = saved;
  }
} catch (e) {}

function getLang() {
  return currentLang;
}

function applyLang(lang) {
  if (lang !== 'es' && lang !== 'en') lang = DEFAULT_LANG;
  currentLang = lang;
  document.documentElement.lang = lang;

  const dict = I18N[lang] || I18N.es;

  // Update page title & description depending on current page
  const path = window.location.pathname.toLowerCase();
  let pageKey = 'index';
  if (path.includes('about')) pageKey = 'about';
  else if (path.includes('docs')) pageKey = 'docs';

  if (dict['meta_title_' + pageKey]) {
    document.title = dict['meta_title_' + pageKey];
  }
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && dict['meta_desc_' + pageKey]) {
    metaDesc.setAttribute('content', dict['meta_desc_' + pageKey]);
  }

  // Update plain text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.textContent = dict[key];
    }
  });

  // Update HTML elements (with links, bold tags, etc.)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });

  // Update language buttons active state and aria-pressed
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    const isActive = btnLang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  // Dispatch event for components that need language updates
  window.dispatchEvent(new CustomEvent('site_lang_change', { detail: { lang } }));
}

function setLang(lang) {
  if (lang !== 'es' && lang !== 'en') return;
  try {
    localStorage.setItem('site_lang', lang);
  } catch (e) {}
  applyLang(lang);
}

// Bind button clicks and initialize on page load
function initI18n() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetLang = btn.getAttribute('data-lang');
      if (targetLang) setLang(targetLang);
    });
  });
  applyLang(currentLang);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}

// Live GitHub numbers in the nav + open-source strip.
(async () => {
  const set = (id, v) => document.querySelectorAll('[data-gh="' + id + '"]').forEach(el => { el.textContent = v });
  try {
    let d = null;
    const cached = sessionStorage.getItem('gh_repo');
    if (cached) d = JSON.parse(cached);
    else {
      const r = await fetch('https://api.github.com/repos/iamluissosa/openGym');
      if (!r.ok) return;
      d = await r.json();
      sessionStorage.setItem('gh_repo', JSON.stringify({
        forks_count: d.forks_count,
        open_issues_count: d.open_issues_count
      }));
    }
    set('forks-n', d.forks_count);
    set('issues-n', d.open_issues_count);
  } catch (e) { /* offline / rate-limited */ }
})();

// About page: build the milestones timeline from GitHub releases
;(async () => {
  const tl = document.getElementById('milestones');
  if (!tl) return;

  let cachedReleases = null;
  const renderReleases = (releases) => {
    if (!releases || !releases.length) return;
    const isEs = getLang() === 'es';
    const fmt = d => new Date(d).toLocaleDateString(isEs ? 'es-ES' : 'en-GB', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const blurb = md => {
      const lines = md.replace(/\r/g, '').split('\n');
      let start = lines.findIndex(l => l.trim() && !l.trim().startsWith('#'));
      if (start < 0) return '';
      let para = [];
      for (let i = start; i < lines.length && lines[i].trim(); i++) para.push(lines[i].trim());
      const txt = para.join(' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`>]/g, '');
      return txt.length > 220 ? txt.slice(0, 217).replace(/\s+\S*$/, '') + '…' : txt;
    };

    tl.querySelectorAll('[data-dynamic-release]').forEach(el => el.remove());
    tl.querySelectorAll('[data-fallback]').forEach(el => el.remove());

    for (const x of releases.slice().reverse()) {
      const li = document.createElement('li');
      li.setAttribute('data-dynamic-release', 'true');
      const title = x.name && x.name !== x.tag ? x.name : x.tag;
      li.innerHTML = '<b></b><span class="when"></span><p></p>';
      li.querySelector('b').textContent = title.startsWith(x.tag) ? title : x.tag + ' — ' + title;
      li.querySelector('.when').textContent = fmt(x.at);
      const p = li.querySelector('p');
      p.textContent = blurb(x.body) + ' ';
      const a = document.createElement('a');
      a.href = x.url;
      a.rel = 'noopener';
      a.textContent = isEs ? 'notas →' : 'notes →';
      p.appendChild(a);
      tl.appendChild(li);
    }
  };

  try {
    const cached = sessionStorage.getItem('gh_releases');
    if (cached) cachedReleases = JSON.parse(cached);
    else {
      const r = await fetch('https://api.github.com/repos/iamluissosa/openGym/releases?per_page=100');
      if (r.ok) {
        cachedReleases = (await r.json())
          .filter(x => !x.draft && !x.prerelease)
          .map(x => ({ tag: x.tag_name, name: x.name, at: x.published_at, body: x.body || '', url: x.html_url }));
        sessionStorage.setItem('gh_releases', JSON.stringify(cachedReleases));
      }
    }
    if (cachedReleases) {
      renderReleases(cachedReleases);
      window.addEventListener('site_lang_change', () => renderReleases(cachedReleases));
    }
  } catch (e) { /* fallback entries stay */ }
})();
