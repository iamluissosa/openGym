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

    // Download / Flavors
    dl_kicker: "Obtén balackGym",
    dl_title: "Una app, dos modalidades",
    dl_lead: "Mismo código base, tú decides dónde residen los datos: totalmente en tu teléfono, o en un servidor bajo tu control.",
    dl_card1_h: "📱 Aplicación móvil",
    dl_card1_for: "Para cualquier persona — instala y listo.",
    dl_card1_li1: "Todo se queda en tu teléfono",
    dl_card1_li2: "Sin cuenta, sin servidor, sin configuración",
    dl_card1_li3: "Recordatorios nativos en días de entrenamiento",
    dl_card1_li4: "Copias de seguridad mediante el menú de compartir",
    dl_card1_li5: "Sin sincronización entre dispositivos",
    dl_card1_btn: "Descargar para Android",
    dl_card1_meta1: "v1.2.4 · 4.3 MB · Android 6.0+ · APK firmado, sideload (tu navegador te pedirá confirmación — es normal fuera de Play Store)",
    dl_card1_meta2: "<b>¿iPhone?</b> Apple no permite instalaciones fuera de la App Store — usa la versión autoalojada agregándola a tu pantalla de inicio, o consulta <a href=\"docs.html#iphone\">la documentación</a>.",
    dl_card2_h: "🖥️ Autoalojado",
    dl_card2_for: "Para homelabbers — y sus amigos y familiares.",
    dl_card2_li1: "Sincroniza en todos tus dispositivos",
    dl_card2_li2: "Perfiles con passkey para múltiples usuarios",
    dl_card2_li3: "Tus datos accesibles en el ordenador",
    dl_card2_li4: "Funciona como web-app en pantalla de inicio en iPhone y Android",
    dl_card2_li5: "Un simple <code>docker compose up</code>",
    dl_card2_btn: "Guía de autoalojamiento",
    dl_card2_meta: "AGPL-3.0 · imágenes precompiladas para amd64 + arm64",

    // Story
    story_kicker: "¿Por qué existe balackGym?",
    story_quote: "balackGym comenzó como <strong>una pequeña app que construí para mí</strong> — solo quería registrar mis entrenamientos y peso sin una app de suscripción adueñándose de mis datos de entrenamiento. Luego mis amigos quisieron usarla, y fue cobrando vida propia.",
    story_who: "— Duarte Santos · <a href=\"about.html\">conoce la historia completa →</a>",

    // Open Source
    os_kicker: "Código abierto",
    os_title: "Licencia AGPL, para siempre",
    os_lead: "El código es público, la licencia mantiene cada bifurcación abierta y no hay una versión comercial esperando tras bambalinas. Si balackGym te resulta útil, una ⭐ en GitHub ayuda a que más personas lo descubran.",
    os_stars: "estrellas en GitHub",
    os_forks: "bifurcaciones",
    os_issues: "issues abiertas",
    os_ex: "ejercicios",
    os_langs: "idiomas",
    os_repo: "balackGym en GitHub",
    os_contrib: "Contribuir",
    os_changelog: "Historial de cambios",

    // Footer
    foot_copy: "balackGym · AGPL-3.0 · © 2026 <a href=\"https://duarte-santos.ch\" rel=\"noopener\">Duarte Santos</a>",
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
    about_star: "Danos una estrella en GitHub",
    notes_link: "notas →",

    // Docs Page
    docs_h1: "Documentación",
    docs_lead: "Todo lo necesario para poner en marcha balackGym — en tu teléfono o en tu servidor. La documentación técnica avanzada se encuentra <a href=\"https://github.com/DuarteSantos8/openGym/tree/main/docs\" rel=\"noopener\">en el repositorio</a>.",
    docs_toc_android: "Android",
    docs_toc_iphone: "iPhone",
    docs_toc_selfhost: "Autoalojamiento",
    docs_toc_import: "Importar historial",
    docs_toc_backup: "Copias de seguridad",
    docs_toc_build: "Compilar tú mismo",
    docs_toc_faq: "Preguntas frecuentes",
    docs_android_h2: "Instalar en Android",
    docs_android_step1: "Abre <a href=\"/#download\">la sección de descargas</a> en tu teléfono y toca <b>Descargar para Android</b>.",
    docs_android_step2: "Tu navegador te preguntará si autorizas instalar apps — acéptalo. Es el procedimiento estándar para cualquier app fuera de Play Store (denominado <i>sideloading</i>), y puedes revocar el permiso inmediatamente después.",
    docs_android_step3: "Abre el archivo <code>balackgym.apk</code> descargado, confirma y listo. Sin cuenta, sin registros.",
    docs_android_note: "balackGym deliberadamente <b>no está</b> en Play Store — sin intermediarios entre tú y una app de código abierto. El APK está firmado; las actualizaciones se instalan sobre la versión previa conservando todos tus datos.",
    docs_android_p: "Todo se almacena en el propio teléfono. Lo único que se descarga de internet son las imágenes y animaciones de ejercicios (desde un CDN, bajo demanda).",
    docs_iphone_h2: "Uso en iPhone",
    docs_iphone_p1: "Apple no permite la instalación de apps fuera de la App Store, por lo que no existe una descarga directa para iOS — es una limitación de la plataforma, no una decisión nuestra. Las alternativas que funcionan:",
    docs_iphone_li1: "<b>Autoalojamiento + pantalla de inicio (recomendado):</b> abre tu propia instancia de balackGym en Safari → <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>. Obtendrás una experiencia a pantalla completa con icono propio, inicio por passkey y sincronización — sin fecha de caducidad ni cuotas.",
    docs_iphone_li2: "<b>Compilarlo en tu propio iPhone:</b> con un Mac y Xcode, la app nativa se ejecuta en tu dispositivo con una cuenta gratuita de Apple ID (Apple revoca la firma a los 7 días; se vuelve a compilar desde Xcode para renovarla). Consulta <a href=\"https://github.com/DuarteSantos8/openGym/blob/main/docs/MOBILE.md\" rel=\"noopener\">docs/MOBILE.md</a>.",
    docs_iphone_li3: "<b>¿Solo quieres probar?</b> La <a href=\"https://duartesantos8.github.io/openGym/\" rel=\"noopener\">demo en vivo</a> funciona en cualquier navegador con datos de ejemplo.",
    docs_selfhost_h2: "Autoalojar con Docker",
    docs_selfhost_p1: "La modalidad autoalojada añade perfiles con passkey, sincronización en todos tus dispositivos y (opcionalmente) un panel de administración. Solo necesitas <a href=\"https://docs.docker.com/get-docker/\" rel=\"noopener\">Docker</a> con Compose:",
    docs_selfhost_p2: "Abre <code>http://localhost:8080</code>, pulsa en <b>Crear perfil</b> y listo. El primer inicio descarga los recursos multimedia de ejercicios (~140&nbsp;MB) una sola vez.",
    docs_selfhost_note: "¿Deseas acceder desde tu móvil con passkeys? Necesitarás un dominio con HTTPS — un cambio de dos líneas en <code>.env</code>. La guía completa, incluidos ejemplos de proxy inverso y opciones de registro por invitación o administrador, está en <a href=\"https://github.com/DuarteSantos8/openGym/blob/main/docs/SELF_HOSTING.md\" rel=\"noopener\">docs/SELF_HOSTING.md</a>.",
    docs_import_h2: "Importar historial de entrenamiento",
    docs_import_p1: "¿Vienes de otra aplicación? <b>Ajustes → Datos → Importar de otra app</b> es compatible con:",
    docs_import_li1: "<b>FitNotes</b> (tanto exportaciones de Android como FitNotes 2 para iOS)",
    docs_import_li2: "<b>Strong</b> y <b>Hevy</b> (exportaciones CSV — la duración de las sesiones se traslada para completar el mapa de actividad)",
    docs_import_li3: "<b>Apple Health</b> (historial de peso corporal desde la exportación XML)",
    docs_import_li4: "…y cualquier formato con columnas de fecha, nombre de ejercicio y peso/repeticiones",
    docs_import_p2: "Los nombres de ejercicios se cotejan con la biblioteca de 1.324 ejercicios; cualquier término con dudas se crea como ejercicio personalizado sin hacer suposiciones erróneas. Se presenta un resumen previo antes de escribir datos, y la importación es idempotente — ejecutarla dos veces nunca duplicará entrenamientos.",
    docs_backup_h2: "Copias de seguridad",
    docs_backup_p: "<b>Ajustes → Datos → Exportar copia de seguridad (JSON)</b> guarda todo tu registro — plan, entrenamientos, pesos, ajustes — en un único archivo. En la app móvil se envía mediante la hoja de compartir (Archivos, AirDrop, correo…); en el navegador se descarga. <b>Importar copia de seguridad</b> lo restaura en cualquier lugar: otro teléfono, tu servidor autoalojado o una instalación limpia. Ese archivo es la razón de ser de balackGym — tu historial en un archivo que <i>te pertenece</i>.",
    docs_build_h2: "Compilar tú mismo",
    docs_build_p: "Todo en esta web se compila desde el repositorio público:",
    docs_build_li1: "<b>Web / autoalojado:</b> <code>docker compose up -d --build</code> construye el frontend dentro del contenedor — no requieres Node en local.",
    docs_build_li2: "<b>APK Android / app iOS:</b> los proyectos Capacitor se encuentran en <code>frontend/android</code> y <code>frontend/ios</code> — notas de compilación, firma y distribución en <a href=\"https://github.com/DuarteSantos8/openGym/blob/main/docs/MOBILE.md\" rel=\"noopener\">docs/MOBILE.md</a>.",
    docs_faq_h2: "Preguntas frecuentes",
    docs_faq_q1: "¿Es realmente gratis?",
    docs_faq_a1: "Sí — gratis tanto en coste como en libertad (AGPL-3.0). Sin versión 'pro', sin funciones bloqueadas, sin publicidad, y la licencia asegura que cada derivado se mantenga abierto.",
    docs_faq_q2: "¿Qué datos recopila balackGym?",
    docs_faq_a2: "Ninguno. No hay telemetría, ni analíticas, ni reportes de fallos. El único tráfico de red de la app móvil es descargar demostraciones de ejercicios desde un CDN; una instancia autoalojada se comunica exclusivamente con tu servidor.",
    docs_faq_q3: "¿Por qué no está en Google Play o App Store?",
    docs_faq_a3: "Por decisión propia (y en iOS, por las restricciones de Apple para instalación libre). Las cuentas de tienda cuestan dinero, imponen términos incompatibles con AGPL y sitúan a un intermediario entre el usuario y una aplicación cuyo principio fundamental es que tus datos te pertenecen.",
    docs_faq_q4: "¿App móvil o versión autoalojada: cuál elegir?",
    docs_faq_a4: "Si solo buscas registrar tus entrenamientos: la app móvil. Si prefieres tus datos en tu propio hardware sincronizados entre dispositivos y con perfiles para tus compañeros de entreno: versión autoalojada. Puedes empezar con la app y migrar a un servidor cuando quieras mediante el archivo de respaldo.",
    docs_faq_q5: "¿De dónde procede la base de datos de ejercicios?",
    docs_faq_a5: "De <a href=\"https://github.com/hasaneyldrm/exercises-dataset\" rel=\"noopener\">hasaneyldrm/exercises-dataset</a> (licencia CC): 1.324 ejercicios con animaciones e instrucciones en 10 idiomas."
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

    // Download / Flavors
    dl_kicker: "Get balackGym",
    dl_title: "One app, two flavors",
    dl_lead: "Same codebase, your choice of where the data lives: entirely on your phone, or on a server you control.",
    dl_card1_h: "📱 Mobile app",
    dl_card1_for: "For anyone — install and you're done.",
    dl_card1_li1: "Everything stays on your phone",
    dl_card1_li2: "No account, no server, no setup",
    dl_card1_li3: "Native workout-day reminders",
    dl_card1_li4: "Backups via the share sheet",
    dl_card1_li5: "No cross-device sync",
    dl_card1_btn: "Download for Android",
    dl_card1_meta1: "v1.2.4 · 4.3 MB · Android 6.0+ · signed APK, sideload (your browser will ask — that's normal outside the Play Store)",
    dl_card1_meta2: "<b>iPhone?</b> Apple doesn't allow installs outside the App Store — use the self-hosted version as a home-screen app instead, or see <a href=\"docs.html#iphone\">the docs</a>.",
    dl_card2_h: "🖥️ Self-hosted",
    dl_card2_for: "For homelabbers — and their friends & family.",
    dl_card2_li1: "Sync across all your devices",
    dl_card2_li2: "Passkey profiles for multiple people",
    dl_card2_li3: "Your data readable on the desktop",
    dl_card2_li4: "Works as a home-screen app on iPhone & Android",
    dl_card2_li5: "One <code>docker compose up</code>",
    dl_card2_btn: "Self-hosting guide",
    dl_card2_meta: "AGPL-3.0 · prebuilt images for amd64 + arm64",

    // Story
    story_kicker: "Why balackGym exists",
    story_quote: "balackGym started as <strong>a tiny app I built for myself</strong> — I just wanted to log my workouts and weight without a subscription app claiming my training data. Then friends wanted in, then it grew a mind of its own.",
    story_who: "— Duarte Santos · <a href=\"about.html\">read the whole story →</a>",

    // Open Source
    os_kicker: "Open source",
    os_title: "AGPL-licensed, forever",
    os_lead: "The code is public, the license keeps every fork open, and there is no commercial version waiting behind a curtain. If balackGym is useful to you, a ⭐ on GitHub helps more people find it.",
    os_stars: "GitHub stars",
    os_forks: "forks",
    os_issues: "open issues",
    os_ex: "exercises",
    os_langs: "languages",
    os_repo: "balackGym on GitHub",
    os_contrib: "Contributing",
    os_changelog: "Changelog",

    // Footer
    foot_copy: "balackGym · AGPL-3.0 · © 2026 <a href=\"https://duarte-santos.ch\" rel=\"noopener\">Duarte Santos</a>",
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
    about_star: "Star it on GitHub",
    notes_link: "notes →",

    // Docs Page
    docs_h1: "Docs",
    docs_lead: "Everything you need to get balackGym running — on a phone, or on your own server. The deeper, maintainer-level docs live <a href=\"https://github.com/DuarteSantos8/openGym/tree/main/docs\" rel=\"noopener\">in the repository</a>.",
    docs_toc_android: "Android",
    docs_toc_iphone: "iPhone",
    docs_toc_selfhost: "Self-hosting",
    docs_toc_import: "Import your history",
    docs_toc_backup: "Backups",
    docs_toc_build: "Build it yourself",
    docs_toc_faq: "FAQ",
    docs_android_h2: "Install on Android",
    docs_android_step1: "Open <a href=\"/#download\">the download</a> on your phone and tap <b>Download for Android</b>.",
    docs_android_step2: "Your browser will ask whether it may install apps — allow it. This is standard for any app installed outside the Play Store (called <i>sideloading</i>), and you can revoke the permission right after.",
    docs_android_step3: "Open the downloaded <code>balackgym.apk</code>, confirm, done. No account, no setup.",
    docs_android_note: "balackGym is deliberately <b>not</b> on the Play Store — no store account between you and an open-source app. The APK is signed; updates install over the old version and keep your data.",
    docs_android_p: "Everything is stored on the phone itself. The only things fetched from the internet are the exercise images and animations (from a CDN, on demand).",
    docs_iphone_h2: "Use on iPhone",
    docs_iphone_p1: "Apple does not allow installing apps outside the App Store, so there is no iOS download — that's a platform rule, not a choice we made. What works instead:",
    docs_iphone_li1: "<b>Self-host + home screen (recommended):</b> open your own balackGym instance in Safari → <b>Share</b> → <b>Add to Home Screen</b>. You get a full-screen app with its own icon, passkey sign-in and sync — no expiry, no fees.",
    docs_iphone_li2: "<b>Build it onto your own iPhone:</b> with a Mac and Xcode, the native app runs on your device with a free Apple ID (Apple expires the signature after 7 days; re-run from Xcode to renew). See <a href=\"https://github.com/DuarteSantos8/openGym/blob/main/docs/MOBILE.md\" rel=\"noopener\">docs/MOBILE.md</a>.",
    docs_iphone_li3: "<b>Just looking?</b> The <a href=\"https://duartesantos8.github.io/openGym/\" rel=\"noopener\">live demo</a> runs in any browser with example data.",
    docs_selfhost_h2: "Self-host with Docker",
    docs_selfhost_p1: "The self-hosted flavor adds passkey profiles, sync across devices, and (optionally) an admin dashboard. You need <a href=\"https://docs.docker.com/get-docker/\" rel=\"noopener\">Docker</a> with Compose:",
    docs_selfhost_p2: "Open <code>http://localhost:8080</code>, tap <b>Create profile</b>, and you're in. The first launch downloads the exercise media (~140&nbsp;MB) once.",
    docs_selfhost_note: "Want it reachable from your phone with passkeys? You'll need an HTTPS domain — a two-line change in <code>.env</code>. The full guide, including reverse-proxy examples and the invite-only/admin options, is in <a href=\"https://github.com/DuarteSantos8/openGym/blob/main/docs/SELF_HOSTING.md\" rel=\"noopener\">docs/SELF_HOSTING.md</a>.",
    docs_import_h2: "Import your training history",
    docs_import_p1: "Coming from another tracker? <b>Settings → Data → Import from another app</b> reads:",
    docs_import_li1: "<b>FitNotes</b> (both the Android and the FitNotes 2 iOS export)",
    docs_import_li2: "<b>Strong</b> and <b>Hevy</b> (CSV exports — session lengths carry over, so the activity heatmap fills in properly)",
    docs_import_li3: "<b>Apple Health</b> (body-weight history from the XML export)",
    docs_import_li4: "…and anything else with date, exercise-name and weight/reps columns",
    docs_import_p2: "Exercise names are matched against the 1,324-exercise library; anything genuinely ambiguous becomes one of your own custom exercises instead of being guessed at. A summary shows exactly what will happen before anything is written, and importing is idempotent — running it twice never duplicates a workout.",
    docs_backup_h2: "Backups",
    docs_backup_p: "<b>Settings → Data → Export backup (JSON)</b> writes your entire log — plan, workouts, weights, settings — into one file. On the mobile app it goes out through the share sheet (Files, AirDrop, mail…); in the browser it downloads. <b>Import backup</b> restores it anywhere: another phone, your self-hosted instance, or a fresh install. That file is the whole point of balackGym — your training log as a file <i>you</i> own.",
    docs_build_h2: "Build it yourself",
    docs_build_p: "Everything on this page is built from the public repo:",
    docs_build_li1: "<b>Web / self-host:</b> <code>docker compose up -d --build</code> builds the frontend inside the container — no local Node needed.",
    docs_build_li2: "<b>Android APK / iOS app:</b> the Capacitor projects live in <code>frontend/android</code> and <code>frontend/ios</code> — build, signing and distribution notes are in <a href=\"https://github.com/DuarteSantos8/openGym/blob/main/docs/MOBILE.md\" rel=\"noopener\">docs/MOBILE.md</a>.",
    docs_faq_h2: "FAQ",
    docs_faq_q1: "Is it really free?",
    docs_faq_a1: "Yes — free as in cost <i>and</i> as in freedom (AGPL-3.0). No pro tier, no locked features, no ads, and the license keeps every fork open source too.",
    docs_faq_q2: "What data does balackGym collect?",
    docs_faq_a2: "None. There is no telemetry, no analytics, no crash reporting. The mobile app's only network traffic is fetching exercise media from a CDN; a self-hosted instance talks only to your own server.",
    docs_faq_q3: "Why isn't it on the Play Store / App Store?",
    docs_faq_a3: "By choice (and on iOS, by Apple's rules for sideloading). Store accounts cost money, impose terms that sit badly with the AGPL, and put a gatekeeper between you and an app whose whole point is that your data is yours.",
    docs_faq_q4: "Mobile app or self-hosted — which one should I pick?",
    docs_faq_a4: "If you just want to track your training: the mobile app. If you want your data on your own hardware, synced across devices, with profiles for the people you train with: self-host. You can start with the app and move to a server later — the backup file migrates everything.",
    docs_faq_q5: "Where does the exercise database come from?",
    docs_faq_a5: "From <a href=\"https://github.com/hasaneyldrm/exercises-dataset\" rel=\"noopener\">hasaneyldrm/exercises-dataset</a> (CC-licensed): 1,324 exercises with animations and instructions in 10 languages."
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
      const r = await fetch('https://api.github.com/repos/DuarteSantos8/openGym');
      if (!r.ok) return;
      d = await r.json();
      sessionStorage.setItem('gh_repo', JSON.stringify({
        stargazers_count: d.stargazers_count,
        forks_count: d.forks_count,
        open_issues_count: d.open_issues_count
      }));
    }
    set('stars', '★ ' + d.stargazers_count);
    set('stars-n', d.stargazers_count);
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
      const r = await fetch('https://api.github.com/repos/DuarteSantos8/openGym/releases?per_page=100');
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
