# Plan de Actuación — App Móvil VitaMind

> Documento de referencia para construir la app móvil de VitaMind.
> Basado en la app de Buktiem (Framework7 + Capacitor) adaptada al frontend web y APIs de VitaMind.
> Revisado contra `vitamind-front-end` y `vitamind-backend` en `Desarrollo`.
> Fecha: 2026-03-17

---

## Índice

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Configuración inicial](#3-configuración-inicial)
4. [Pantallas a implementar](#4-pantallas-a-implementar)
5. [Endpoints API a consumir](#5-endpoints-api-a-consumir)
6. [Autenticación y sesión](#6-autenticación-y-sesión)
7. [Multiidioma (i18n)](#7-multiidioma-i18n)
8. [Navegación y routing](#8-navegación-y-routing)
9. [Plugins nativos (Capacitor)](#9-plugins-nativos-capacitor)
10. [Diseño y UI](#10-diseño-y-ui)
11. [Funcionalidades detalladas](#11-funcionalidades-detalladas)
12. [Diferencias clave Buktiem vs VitaMind](#12-diferencias-clave-buktiem-vs-vitamind)
13. [Fases de desarrollo](#13-fases-de-desarrollo)
14. [Convenciones de código](#14-convenciones-de-código)
15. [Testing y despliegue](#15-testing-y-despliegue)

---

## 1. Stack tecnológico

| Componente | Tecnología | Versión referencia (Buktiem) |
|-----------|-----------|------------------------------|
| Framework UI | **Framework7** | 8.3.4 |
| Build tool | **Vite** | 7.x |
| Puente nativo | **Capacitor** | 7.4.x |
| Lenguaje | JavaScript vanilla (componentes `.f7`) | — |
| Internacionalización | **i18next** | 25.x |
| Calendario | **FullCalendar** | 6.1.x |
| Slider/Swiper | **Swiper** | 11.x |
| Alertas | **SweetAlert2** o diálogos F7 nativos | — |
| Iconos | Material Symbols (o los que use el front VitaMind) | — |
| Plataformas | iOS + Android | — |

### ¿Por qué este stack?
- Framework7 ofrece componentes nativos iOS/Android out-of-the-box
- Capacitor permite acceso a APIs nativas (GPS, cámara, push, etc.)
- Vite da HMR rápido en desarrollo
- Estructura probada en producción con Buktiem

---

## 2. Estructura del proyecto

```
vitamind-app/
├── src/
│   ├── index.html                 # HTML principal (shell de la SPA)
│   ├── app.f7                     # Componente raíz (tab layout)
│   ├── js/
│   │   ├── app.js                 # Inicialización Framework7 + Capacitor
│   │   ├── routes.js              # Definición de rutas
│   │   ├── utils.js               # Lógica de negocio + llamadas API
│   │   ├── env.js                 # URLs de API (dev/prod)
│   │   └── capacitor-app.js       # Eventos nativos (back button, deep links, resume)
│   ├── css/
│   │   ├── app.css                # Estilos personalizados VitaMind
│   │   └── icons.css              # Iconos
│   ├── pages/                     # Páginas .f7 (una por pantalla)
│   │   ├── home.f7
│   │   ├── search.f7
│   │   ├── profesional.f7
│   │   ├── reservar.f7
│   │   ├── confirmar_reserva.f7
│   │   ├── citas.f7
│   │   ├── cita_detalle.f7
│   │   ├── settings.f7
│   │   ├── login.f7
│   │   ├── registro.f7
│   │   ├── perfil.f7
│   │   ├── editar_perfil.f7
│   │   ├── cambiar_pass.f7
│   │   ├── favoritos.f7
│   │   ├── notificaciones.f7
│   │   ├── notificacion.f7
│   │   ├── normas.f7
│   │   ├── terminos.f7
│   │   ├── info.f7
│   │   ├── forgot_password.f7
│   │   └── 404.f7
│   └── fonts/                     # Fuentes Framework7 + iconos
├── public/
│   ├── locales/
│   │   ├── es.json                # Traducciones español
│   │   └── en.json                # Traducciones inglés
│   ├── logo.png                   # Logo VitaMind
│   ├── avatar.png                 # Avatar por defecto
│   └── manifest.webmanifest
├── capacitor.config.json
├── package.json
├── vite.config.js
└── www/                           # Build producción (generado)
```

---

## 3. Configuración inicial

### 3.1 Crear proyecto

```bash
# Opción A: Copiar base de Buktiem y adaptar
cp -r /Users/toni/Desarrollo/APP/buktiem_L /Volumes/web/00-TMWEBS-8/VITAMIND/app
cd /Volumes/web/00-TMWEBS-8/VITAMIND/app

# Opción B: Crear desde cero con el template Framework7
npx framework7-cli create --ui
```

> **RECOMENDACIÓN**: Opción A — copiar Buktiem y adaptar. Ahorra mucho tiempo porque la estructura, plugins Capacitor, gestión de estado y patrones ya están resueltos.

### 3.2 env.js — Configuración de entorno

```javascript
const env = {
  apiUrl: "https://app.vitamind.es/api",
  appUrl: "https://app.vitamind.es/",
  version: '1.0.0',
};
```

### 3.3 capacitor.config.json

```json
{
  "appId": "es.vitamind.app",
  "appName": "VitaMind",
  "webDir": "www",
  "plugins": {
    "SplashScreen": { "launchShowDuration": 200 },
    "StatusBar": { "overlaysWebView": false, "style": "LIGHT", "backgroundColor": "#f7f7f7" }
  },
  "server": {
    "cleartext": true,
    "androidScheme": "http"
  }
}
```

### 3.4 package.json — Dependencias clave

```json
{
  "dependencies": {
    "framework7": "^8.3.4",
    "@capacitor/core": "^7.4.0",
    "@capacitor/app": "^7.0.0",
    "@capacitor/camera": "^7.0.0",
    "@capacitor/geolocation": "^7.0.0",
    "@capacitor/keyboard": "^7.0.0",
    "@capacitor/network": "^7.0.0",
    "@capacitor/push-notifications": "^7.0.0",
    "@capacitor/share": "^7.0.0",
    "@capacitor/splash-screen": "^7.0.0",
    "@capacitor/status-bar": "^7.0.0",
    "@capacitor/browser": "^7.0.0",
    "@capacitor/device": "^7.0.0",
    "@fullcalendar/core": "^6.1.19",
    "swiper": "^11.2.8",
    "i18next": "^25.2.1",
    "sweetalert2": "^11.0.0"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "@capacitor/cli": "^7.4.0"
  }
}
```

---

## 4. Pantallas a implementar

### 4.1 Mapeo Frontend Web → App Móvil

> **Regla funcional confirmada**: en la app móvil solo inicia sesión el rol **paciente**. No se implementa acceso para profesional, agente, admin ni preregistro profesional.

| # | Pantalla App | Equivalente Frontend Web | Prioridad | Fase |
|---|-------------|------------------------|-----------|------|
| 1 | **Home** (`home.f7`) | `directory/index-directory` | ALTA | 1 |
| 2 | **Búsqueda profesionales** (`search.f7`) | `directory/results` | ALTA | 1 |
| 3 | **Perfil profesional** (`profesional.f7`) | `directory/profesional` | ALTA | 1 |
| 4 | **Reservar cita** (`reservar.f7`) | Sección horarios en `profesional` | ALTA | 1 |
| 5 | **Confirmar reserva** (`confirmar_reserva.f7`) | `directory/confirmarreserva` | ALTA | 1 |
| 6 | **Login** (`login.f7`) | `auth/sign-in` | ALTA | 1 |
| 7 | **Registro** (`registro.f7`) | `auth/sign-up` | ALTA | 1 |
| 8 | **Mis citas** (`citas.f7`) | `account/bookings` | ALTA | 1 |
| 9 | **Detalle cita** (`cita_detalle.f7`) | `account/manage-bookings` | ALTA | 1 |
| 10 | **Settings/Cuenta** (`settings.f7`) | `account/profile` | ALTA | 1 |
| 11 | **Olvidé contraseña** (`forgot_password.f7`) | `auth/forgot-password` | ALTA | 1 |
| 12 | **Editar perfil** (`editar_perfil.f7`) | `account/profile` (edición) | MEDIA | 2 |
| 13 | **Cambiar contraseña** (`cambiar_pass.f7`) | `auth/forgot-password` + `reset-password` | MEDIA | 2 |
| 14 | **Favoritos** (`favoritos.f7`) | `account/favoritos` | MEDIA | 2 |
| 15 | **Notificaciones** (`notificaciones.f7`) | Dropdown navbar | MEDIA | 2 |
| 16 | **Detalle notificación** (`notificacion.f7`) | — | MEDIA | 2 |
| 17 | **Términos** (`terminos.f7`) | `pages/...` (contenido dinámico) | BAJA | 3 |
| 18 | **Normas** (`normas.f7`) | `pages/...` | BAJA | 3 |
| 19 | **Info/Privacidad** (`info.f7`) | `directory/datos` | BAJA | 3 |
| 20 | **404** (`404.f7`) | `pages/error` | BAJA | 3 |

### 4.2 Pantallas que NO se incluyen en la app (solo web)

| Pantalla Web | Razón de exclusión |
|-------------|-------------------|
| `account/preregistro` | Flujo web de selección, no necesario en app paciente |
| `account/registerempleado` | Registro de profesional — solo web (requiere Redsys InSite) |
| `admin/*` | Panel admin — solo backoffice web |
| `agent/*` | Panel profesional — solo backoffice web |
| `pages/pricing` | Planes/precios — solo web |
| `pages/contact` | Contacto — solo web |
| `pages/about`, `pages/team` | Páginas institucionales — solo web |

### 4.3 Descripción detallada de cada pantalla

#### HOME (`home.f7`)
- **Barra superior**: logo VitaMind + icono notificaciones (badge)
- **Buscador**: campo `query` para nombre del profesional o texto libre
- **Selector ubicación**: `localidad` + `place_id` con Google Places en web
- **Últimos profesionales**: carrusel horizontal (API: `GET /api/ultimos-profesionales`)
- **Tarjetas destacadas**: grid de profesionales cargado dinámicamente (`loadProfessionalCards`)
- **CTA secundaria**: acceso rápido a mis citas si hay sesión paciente
- **Pull-to-refresh**: recargar contenido en app

#### BÚSQUEDA (`search.f7`)
- **Filtros reales del front web**: `localidad`, `place_id`, `query`, `fecha`, `servicio_id`
- **Regla de validación actual**: se exige al menos `place_id/localidad válida` o `query`
- **Resultados**: bloques por fecha con profesionales y horarios disponibles
- **Ordenación**: cercanía cuando backend puede calcular distancia por coordenadas
- **API principal**: `POST /api/horarios-por-localidad`

#### PERFIL PROFESIONAL (`profesional.f7`)
- **Header**: foto, nombre y datos de contacto
- **Datos visibles en web**: dirección, localidad, teléfono, número colegiado
- **Servicios**: selector de servicio + carga de horarios para fecha seleccionada
- **Ubicación**: la web no muestra descripción larga; el foco real es reserva inmediata
- **Botón favorito**: corazón toggle (API: `POST /api/favoritos/add|remove`)
- **Botón reservar**: navega a pantalla de reserva
- **APIs**: `GET /api/profesional/{token}` + `GET /api/horarios/por-token/{token}`

#### RESERVAR CITA (`reservar.f7`)
- **Selección de servicio**: si el profesional tiene varios
- **Calendario**: selector de fecha (Flatpickr o FullCalendar)
- **Horarios disponibles**: slots horarios
- **Modalidad**: presencial / online
- **Notas**: campo de texto libre
- **API**: `POST /api/horarios-por-localidad` (horarios disponibles)

#### CONFIRMAR RESERVA (`confirmar_reserva.f7`)
- **Resumen**: profesional, servicio, fecha, hora, modalidad, precio
- **Botón confirmar**: `POST /api/reserva`
- **Feedback**: SweetAlert éxito/error + redirección a citas

#### MIS CITAS (`citas.f7`)
- **Tabs**: Activas / Completadas / Canceladas
- **Cards**: profesional, servicio, fecha, hora, estado
- **Acción**: cancelar cita (en activas)
- **Detalle**: navegación a `manage-bookings` con mapa y datos completos
- **Pull-to-refresh**
- **API**: `GET /api/mis-citas`

#### DETALLE CITA (`cita_detalle.f7`)
- **Datos completos**: profesional, servicio, fecha, hora, duración, precio, modalidad, notas
- **Acciones**: cancelar (si activa), contactar profesional
- **API**: `POST /api/citas/{id}/cancelar`

---

## 5. Endpoints API a consumir

### 5.1 Autenticación

| Endpoint | Método | Parámetros | Uso en app |
|----------|--------|-----------|------------|
| `/api/login` | POST | email, password, remember | Login paciente |
| `/api/register` | POST | nombre, apellidos, telefono, email, password, password_confirmation, empresa_id? | Registro paciente |
| `/api/logout` | POST | — (Bearer token) | Cerrar sesión |
| `/api/forgot-password` | POST | email | Recuperar contraseña |
| `/api/user` | GET | — (Bearer token) | Obtener datos usuario logueado |
| `/api/user/update` | POST | name, email, (foto) | Actualizar perfil |
| `/api/password/reset-from-token` | POST | token, password, password_confirmation | Reset final de contraseña |

### 5.2 Búsqueda y profesionales

| Endpoint | Método | Parámetros | Uso en app |
|----------|--------|-----------|------------|
| `/api/ultimos-profesionales` | GET | — | Carrusel home |
| `/api/localidades` | POST | — | Selector localidades (búsqueda) |
| `/api/servicios` | POST | localidad (uso actual front) | Cargar servicios del buscador |
| `/api/horarios-por-localidad` | POST | localidad, place_id, fecha, dias, paciente_id, servicio_id, empresa_id, query, origen | Búsqueda horarios disponibles |
| `/api/profesional/{token}` | GET | — | Perfil completo profesional |
| `/api/horarios/por-token/{token}` | GET | fecha, servicio_id | Horarios de un profesional específico |

### 5.3 Reservas y citas

| Endpoint | Método | Parámetros | Uso en app |
|----------|--------|-----------|------------|
| `/api/reserva` | POST | paciente_id, servicio_id, empleado_id, fecha, hora_inicio, hora_fin, empresa_id, metodo, nota, origen | Crear reserva |
| `/api/mis-citas` | GET | start, end, per_page, activas_page, canceladas_page, completadas_page | Listar citas del paciente |
| `/api/citas/{id}/cancelar` | POST | — | Cancelar cita |

### 5.4 Favoritos

| Endpoint | Método | Parámetros | Uso en app |
|----------|--------|-----------|------------|
| `/api/favoritos` | GET | — | Listar favoritos |
| `/api/favoritos/add` | POST | empleado_id | Añadir a favoritos |
| `/api/favoritos/remove` | POST | empleado_id | Eliminar de favoritos |

### 5.5 Contenido dinámico

| Endpoint | Método | Parámetros | Uso en app |
|----------|--------|-----------|------------|
| `/api/cargarContenido` | GET | funct | Cargar términos, privacidad, etc. |
| `/api/condiciones/{tipo}` | GET | — | Detalle de condiciones |

### 5.6 Endpoints que PUEDE SER NECESARIO CREAR en el backend

| Endpoint propuesto | Método | Motivo |
|-------------------|--------|--------|
| `/api/register-device` | POST | Registrar token FCM del dispositivo (para push notifications) |
| `/api/notificaciones` | GET | Listar notificaciones del usuario |
| `/api/notificaciones/{id}` | GET | Detalle de notificación |
| `/api/notificaciones/nuevas` | GET | Contar notificaciones nuevas (badge) |
| `/api/notificaciones/{id}/eliminar` | DELETE | Eliminar notificación |
| `/api/app-version` | GET | Check versión mínima de la app |
| `/api/cambiar-pass` | POST | Cambiar contraseña (autenticado) |
| `/api/eliminar-cuenta` | POST | Eliminar cuenta usuario |

> **NOTA**: Revisar si estos endpoints ya existen o si hay que crearlos. Comparar con los endpoints de Buktiem en `/Volumes/web/00-TMWEBS-8/BUKTIEM_L/routes/api.php` como referencia de implementación.

### 5.7 Endpoints confirmados tras analizar el backend

- `POST /api/citas/{id}/cancelar` existe y ya lo usa la web paciente.
- `POST /api/user/update` existe y soporta actualización de datos y foto.
- `GET /api/user` devuelve estructura con `paciente`, `paciente_id`, `imagen_url`, `email`, `name`.
- `POST /api/servicios` en backend actual devuelve catálogo activo y el front web lo sigue invocando desde búsqueda.

---

## 6. Autenticación y sesión

### 6.1 Diferencia clave con Buktiem

| Aspecto | Buktiem | VitaMind |
|---------|---------|----------|
| Token | Custom (query string `?token=...`) | **Sanctum Bearer token** (header `Authorization`) |
| Almacenamiento | `buktiem_AUTH_TOKEN` en localStorage | **`sanctum_token` y `paciente_id`** en web actual |
| Envío | Parámetro GET en cada request | Header `Authorization: Bearer {token}` |
| Roles | admin, empleado, cliente (paciente) | superadmin, admin, psicologo, paciente |
| Acceso app | Dual | **Solo paciente** |

### 6.2 Implementación en utils.js

```javascript
// Función base para todas las llamadas API
async function fetchAPI(endpoint, options = {}) {
    const { method = "GET", data = null } = options;
    const token = localStorage.getItem("vitamind_token");

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (data && method !== "GET") {
        config.body = JSON.stringify(data);
    }

    const url = `${env.apiUrl}${endpoint}`;
    const response = await fetch(method === "GET" && data
        ? `${url}?${new URLSearchParams(data)}`
        : url, config);

    if (response.status === 401 || response.status === 403) {
        // Token inválido → limpiar y redirigir a login
        localStorage.removeItem("vitamind_token");
        localStorage.removeItem("vitamind_paciente_id");
        localStorage.removeItem("vitamind_datos_usu");
        tmApp.f7.views.main.router.navigate("/login/");
        throw new Error("Sesión expirada");
    }

    return response.json();
}
```

### 6.3 Datos en localStorage

```javascript
// Claves detectadas en la web actual
sanctum_token             // Token Sanctum (Bearer)
paciente_id               // ID del paciente
perfilProfesional         // Cache temporal al navegar a perfil/reserva
// Recomendación para app
vitamind_idioma           // Idioma seleccionado (es/en)
vitamind_coordenadas      // {latitud, longitud, timestamp} — cache 30min
vitamind_registrationId   // Token FCM push notifications
```

### 6.4 Flujo de login

```
1. Usuario introduce email + password
2. POST /api/login → { token, user:{..., paciente_id} }
3. Validar que `user.paciente_id` exista
4. Guardar `sanctum_token` y `paciente_id`
5. Navegar a Home
```

### 6.5 Flujo de registro

```
1. Usuario rellena nombre, apellidos, email, password y confirmación
2. POST /api/register → { success, token, user:{..., paciente_id} }
3. Backend crea User + Paciente + rol "paciente"
4. Backend envía email verificación
5. Guardar token y datos en localStorage
6. Navegar a Home
```

---

## 7. Multiidioma (i18n)

### 7.1 Arquitectura

VitaMind soporta **español (es)** e **inglés (en)**, igual que Buktiem. Se usa **i18next** para la app.

### 7.2 Archivos de traducciones

```
public/locales/
├── es.json     # Español (idioma por defecto)
└── en.json     # Inglés
```

### 7.3 Fuentes de traducciones existentes

| Fuente | Ubicación | Claves aprox. | Notas |
|--------|-----------|---------------|-------|
| Frontend web VitaMind | `/VITAMIND/frontend/lang/es.json` y `en.json` | ~200+ | Punto de partida para textos de la app |
| Backend VitaMind | `/VITAMIND/backend/lang/es.json` y `en.json` | ~200+ | Mensajes de API y emails |
| App Buktiem | `/buktiem_L/public/locales/es.json` y `en.json` | ~300+ | Referencia para textos UI nativos de app |

### 7.4 Inicialización i18next

```javascript
import i18next from 'i18next';

// Detectar idioma del dispositivo o usar guardado
const savedLang = localStorage.getItem('vitamind_idioma');
const deviceLang = navigator.language?.substring(0, 2);
const defaultLang = savedLang || (deviceLang === 'en' ? 'en' : 'es');

i18next.init({
    lng: defaultLang,
    fallbackLng: 'es',
    resources: {
        es: { translation: null }, // se carga async
        en: { translation: null },
    }
});

// Cargar JSON de traducciones
async function loadTranslations(lang) {
    const response = await fetch(`/locales/${lang}.json`);
    const translations = await response.json();
    i18next.addResourceBundle(lang, 'translation', translations, true, true);
}

// Cargar idioma actual al iniciar
await loadTranslations(defaultLang);
```

### 7.5 Uso en páginas .f7

```html
<!-- En templates -->
<p>${$t('buscar_profesionales')}</p>
<button>${$t('reservar_cita')}</button>

<!-- En JavaScript -->
const msg = i18next.t('cita_confirmada');
tmApp.f7.dialog.alert(i18next.t('error_login'));
```

### 7.6 Cambio de idioma en runtime

```javascript
async function cambiarIdioma(lang) {
    await loadTranslations(lang);
    i18next.changeLanguage(lang);
    localStorage.setItem('vitamind_idioma', lang);
    // Recargar vista actual para aplicar traducciones
    tmApp.f7.views.current.router.refreshPage();
}
```

### 7.7 Estructura del JSON de traducciones (ejemplo)

```json
{
    "app_name": "VitaMind",
    "inicio": "Inicio",
    "buscar": "Buscar",
    "mis_citas": "Mis citas",
    "cuenta": "Cuenta",
    "buscar_profesionales": "Buscar profesionales",
    "localidad": "Localidad",
    "seleccionar_localidad": "Seleccionar localidad",
    "servicios": "Servicios",
    "reservar_cita": "Reservar cita",
    "confirmar_reserva": "Confirmar reserva",
    "cancelar_cita": "Cancelar cita",
    "cita_confirmada": "Tu cita ha sido confirmada",
    "cita_cancelada": "Tu cita ha sido cancelada",
    "iniciar_sesion": "Iniciar sesión",
    "registrarse": "Registrarse",
    "email": "Email",
    "contrasena": "Contraseña",
    "nombre": "Nombre",
    "apellidos": "Apellidos",
    "telefono": "Teléfono",
    "guardar": "Guardar",
    "cancelar": "Cancelar",
    "cerrar_sesion": "Cerrar sesión",
    "favoritos": "Favoritos",
    "notificaciones": "Notificaciones",
    "perfil": "Perfil",
    "editar_perfil": "Editar perfil",
    "cambiar_contrasena": "Cambiar contraseña",
    "eliminar_cuenta": "Eliminar cuenta",
    "error_login": "Email o contraseña incorrectos",
    "error_conexion": "Sin conexión a internet",
    "sesion_expirada": "Tu sesión ha expirado",
    "presencial": "Presencial",
    "online": "Online",
    "precio": "Precio",
    "duracion": "Duración",
    "fecha": "Fecha",
    "hora": "Hora",
    "notas": "Notas",
    "activas": "Activas",
    "completadas": "Completadas",
    "canceladas": "Canceladas",
    "sin_resultados": "No se encontraron resultados",
    "cargando": "Cargando...",
    "olvidaste_contrasena": "¿Olvidaste tu contraseña?",
    "recordar_contrasena": "Recuperar contraseña",
    "enviar": "Enviar",
    "volver": "Volver",
    "terminos_condiciones": "Términos y condiciones",
    "politica_privacidad": "Política de privacidad",
    "info_legal": "Información legal"
}
```

### 7.8 Consideraciones importantes

- **Textos del backend**: los mensajes de error y validación que devuelve la API del backend ya están traducidos. El backend detecta el idioma por el header `Accept-Language` o por un parámetro `ln`. Verificar qué método usa VitaMind backend y enviar el idioma en cada request si es necesario.
- **Nuevos textos**: cualquier texto nuevo en la app debe añadirse a AMBOS archivos (`es.json` y `en.json`).
- **No hardcodear**: NUNCA poner textos directamente en las vistas `.f7`. Siempre usar `i18next.t('clave')` o `$t('clave')`.
- **Claves consistentes**: usar snake_case para las claves de traducción (ej: `buscar_profesionales`, no `buscarProfesionales`).
- **Reutilizar claves del frontend web**: partir de las claves existentes en `/VITAMIND/frontend/lang/es.json` para mantener consistencia.

---

## 8. Navegación y routing

### 8.1 Tab Layout (4 tabs)

```
┌─────────┬───────────┬──────────┬──────────┐
│  Inicio │  Buscar   │  Citas   │  Cuenta  │
│  🏠     │  🔍      │  📅     │  👤      │
└─────────┴───────────┴──────────┴──────────┘
```

Cada tab tiene su propia pila de navegación (view independiente).

### 8.2 routes.js

```javascript
const routes = [
    // Root
    { path: '/', redirect: '/home/' },

    // Home
    { path: '/home/', componentUrl: './pages/home.f7' },

    // Búsqueda
    { path: '/search/', componentUrl: './pages/search.f7' },
    { path: '/profesional/:token/', componentUrl: './pages/profesional.f7' },
    { path: '/reservar/:token/', componentUrl: './pages/reservar.f7' },
    { path: '/confirmar-reserva/', componentUrl: './pages/confirmar_reserva.f7' },

    // Citas
    { path: '/citas/', componentUrl: './pages/citas.f7' },
    { path: '/cita-detalle/:id/', componentUrl: './pages/cita_detalle.f7' },

    // Cuenta
    { path: '/settings/', componentUrl: './pages/settings.f7' },
    { path: '/login/', componentUrl: './pages/login.f7' },
    { path: '/registro/', componentUrl: './pages/registro.f7' },
    { path: '/forgot-password/', componentUrl: './pages/forgot_password.f7' },
    { path: '/editar-perfil/', componentUrl: './pages/editar_perfil.f7' },
    { path: '/cambiar-pass/', componentUrl: './pages/cambiar_pass.f7' },
    { path: '/favoritos/', componentUrl: './pages/favoritos.f7' },

    // Notificaciones
    { path: '/notificaciones/', componentUrl: './pages/notificaciones.f7' },
    { path: '/notificacion/:id/', componentUrl: './pages/notificacion.f7' },

    // Contenido dinámico
    { path: '/terminos/', componentUrl: './pages/terminos.f7' },
    { path: '/normas/', componentUrl: './pages/normas.f7' },
    { path: '/info/', componentUrl: './pages/info.f7' },

    // 404
    { path: '(.*)', componentUrl: './pages/404.f7' },
];
```

### 8.3 Deep linking

```
vitamind://profesional/{token}     → Abre perfil profesional
vitamind://citas                   → Abre mis citas
vitamind://notificaciones          → Abre notificaciones
```

---

## 9. Plugins nativos (Capacitor)

### 9.1 Plugins necesarios

| Plugin | Uso en VitaMind | Prioridad |
|--------|----------------|-----------|
| `@capacitor/app` | Back button, resume, deep links | ALTA |
| `@capacitor/geolocation` | Detectar localidad cercana para búsqueda | ALTA |
| `@capacitor/push-notifications` | Notificaciones push (FCM) | ALTA |
| `@capacitor/keyboard` | Gestión teclado en formularios | ALTA |
| `@capacitor/network` | Detectar offline/online | ALTA |
| `@capacitor/splash-screen` | Pantalla de carga | ALTA |
| `@capacitor/status-bar` | Color barra estado | ALTA |
| `@capacitor/camera` | Foto de perfil | MEDIA |
| `@capacitor/share` | Compartir profesional | MEDIA |
| `@capacitor/browser` | Abrir enlaces externos | MEDIA |
| `@capacitor/device` | Info dispositivo (para registro FCM) | MEDIA |

### 9.2 Plugins que NO se necesitan (diferencia con Buktiem)

| Plugin Buktiem | Razón de exclusión en VitaMind |
|---------------|-------------------------------|
| `@capacitor/filesystem` | No hay firma digital ni partes de trabajo |
| `@capawesome/capacitor-screen-orientation` | No necesario para el flujo de VitaMind |
| `@hugotomazi/capacitor-navigation-bar` | Personalización extra Android, puede añadirse después |

---

## 10. Diseño y UI

### 10.1 Paleta de colores

Tomar los colores del frontend web de VitaMind. Referencia en `/VITAMIND/frontend/resources/scss/_variables.scss`.

```css
:root {
    --vm-primary: #f4934e;      /* Confirmado en _variables.scss */
    --vm-secondary: #1d2a3b;    /* Definir a partir del layout de navegación */
    --vm-success: #28a745;
    --vm-danger: #dc3545;
    --vm-warning: #ffc107;
    --vm-bg: #f7f7f7;
    --vm-text: #333333;
    --vm-text-muted: #6c757d;
}
```

> **CONFIRMADO**: el color primario del frontend web actual es `#f4934e`.

### 10.2 Tipografía

Usar la misma familia de fuentes que el frontend web de VitaMind para mantener consistencia visual.

### 10.3 Componentes UI principales

- **Cards de profesional**: foto redonda, nombre, especialidad, localidad, rating — calco del frontend web
- **Cards de cita**: profesional, servicio, fecha, hora, estado con color
- **Formularios**: inputs con labels flotantes (estilo Material o Bootstrap)
- **Botones**: primario (color principal), secundario, outline, danger
- **Navbar**: logo centrado, icono notificaciones derecha
- **Tabs**: 4 tabs con icono + texto

### 10.4 Dark mode

Framework7 soporta dark mode automático. Configurar siguiendo el patrón de Buktiem y los colores del frontend web de VitaMind.

---

## 11. Funcionalidades detalladas

### 11.1 Fase 1 — Core (MVP)

#### F1.1 — Búsqueda de profesionales
- Selector de localidad con Google Places o entrada manual
- Filtro por texto libre (`query`) y servicio
- Lista de resultados agrupada por disponibilidad
- Card: foto, nombre, empresa, distancia y horarios
- Tap → perfil profesional

**APIs**: `POST /api/localidades`, `POST /api/servicios`, `POST /api/horarios-por-localidad`, `GET /api/ultimos-profesionales`

#### F1.2 — Perfil profesional
- Datos completos del profesional
- Lista de servicios (precio, duración, modalidad)
- Botón reservar → pantalla reserva
- Botón favorito (toggle)
- Mapa ubicación

**APIs**: `GET /api/profesional/{token}`, `POST /api/favoritos/add|remove`

#### F1.3 — Reserva de cita
- Selección servicio → selección fecha → selección hora
- Modalidad (presencial/online)
- Notas opcionales
- Pantalla resumen + confirmación
- Feedback éxito/error

**APIs**: `POST /api/horarios-por-localidad`, `GET /api/horarios/por-token/{token}`, `POST /api/reserva`

#### F1.4 — Mis citas
- Listado con tabs: Activas / Completadas / Canceladas
- Detalle de cita
- Cancelar cita (solo activas)
- Pull-to-refresh

**APIs**: `GET /api/mis-citas`, `POST /api/citas/{id}/cancelar`

#### F1.5 — Autenticación
- Login (email + password)
- Registro (nombre, apellidos, email, password)
- Olvidé contraseña
- Logout
- Persistencia de sesión
- Validación estricta de rol paciente

**APIs**: `POST /api/login`, `POST /api/register`, `POST /api/logout`, `POST /api/forgot-password`, `GET /api/user`

### 11.2 Fase 2 — Funcionalidades secundarias

#### F2.1 — Favoritos
- Lista de profesionales favoritos
- Añadir/eliminar desde perfil
- Navegar a perfil desde favoritos

**APIs**: `GET /api/favoritos`, `POST /api/favoritos/add|remove`

#### F2.2 — Notificaciones push
- Registro FCM al login
- Recepción en foreground/background
- Badge en tab/navbar
- Listado de notificaciones
- Deep linking desde notificación

**APIs**: `POST /api/register-device` (crear si no existe), `GET /api/notificaciones` (crear si no existe)

#### F2.3 — Perfil de usuario
- Ver datos (nombre, email, foto)
- Editar nombre/email
- Subir foto perfil (cámara o galería)
- Cambiar contraseña
- Eliminar cuenta

**APIs**: `GET /api/user`, `POST /api/user/update`, `POST /api/cambiar-pass` (crear), `POST /api/eliminar-cuenta` (crear)

### 11.3 Fase 3 — Polish

#### F3.1 — Offline resilience
- Detectar cambio red → popup
- Al reconectar → refresh

#### F3.2 — Check versión
- Al abrir app → `GET /api/app-version`
- Si hay versión nueva → dialog con link a store

#### F3.3 — Contenido dinámico
- Términos, normas, info legal desde API
- Deep links para estas páginas

#### F3.4 — Compartir profesional
- Botón share nativo → URL del perfil web del profesional

---

## 12. Diferencias clave Buktiem vs VitaMind

| Aspecto | Buktiem | VitaMind | Acción |
|---------|---------|----------|--------|
| **Auth** | Token custom en query string | Sanctum Bearer header | Cambiar fetchAPI |
| **Tipos usuario app** | Cliente + Empleado (dual) | Solo Paciente | Eliminar modo profesional |
| **Pagos** | Stripe (Cashier) | Redsys InSite | No aplica en app (pagos solo web) |
| **Fidelización** | Tarjeta de sellos/stamps | No existe | Eliminar pantallas |
| **Partes trabajo** | Time tracking + firma | No existe | Eliminar pantallas |
| **Multi-empresa** | Login empleado multi-empresa | No aplica | Eliminar selector |
| **Búsqueda** | Por centros (empresas) | Por profesionales (empleados) | Adaptar search |
| **Reserva** | Centro → servicio → profesional → hora | Profesional → servicio → fecha → hora | Adaptar flujo |
| **Favoritos** | Centros visitados (local) | Profesionales favoritos (API) | Nuevo endpoint |
| **Categorías** | 16 categorías (peluquería, spa, etc.) | Servicios de psicología/salud | Adaptar filtros |
| **Valoraciones** | No implementado (pendiente) | No implementado | — |
| **Geolocalización** | Nominatim (OSM) | Google Places + Geocoding en web actual | Decidir continuidad en app |
| **Mapa** | Leaflet + Nominatim | Google Maps en detalle de cita y geocoding | Evaluar coste y alternativa |
| **Contenido HTML** | API devuelve HTML pre-renderizado | API devuelve JSON | Adaptar renderizado |
| **Acceso paciente** | No tan restrictivo | Login bloqueado si no existe `paciente_id` | Replicar la restricción |

### Resumen de pantallas a ELIMINAR vs. Buktiem

Pantallas de Buktiem que NO van en VitaMind:
- `home_prof.f7` → No hay modo profesional en app
- `pro_settings.f7` → No hay settings profesional
- `pro_citas.f7` (partes) → No hay time tracking
- `profesionales_login.f7` → No hay login dual
- `add_citas.f7` → Solo lo hace el profesional
- `fidelizacion.f7` y `fidelizacion_centros.f7` → No hay fidelización
- `centro_detalles.f7` → Se sustituye por `profesional.f7`
- `filtros.f7` → Se integra en `search.f7`
- `ubicacion.f7` → Se integra en `search.f7` o `home.f7`

### Pantallas NUEVAS en VitaMind (no existen en Buktiem):
- `favoritos.f7` → Profesionales favoritos (Buktiem no tiene favoritos en API)
- `confirmar_reserva.f7` → Pantalla de confirmación previa (en Buktiem es inline)

---

## 13. Fases de desarrollo

### FASE 1 — MVP (Estimación: core funcional)

**Objetivo**: App funcional con búsqueda, reservas y autenticación.

| Tarea | Pantallas | Estado |
|-------|----------|--------|
| 1.1 Setup proyecto (copiar Buktiem, adaptar config) | — | ⬜ |
| 1.2 Configurar env.js, capacitor.config.json | — | ⬜ |
| 1.3 Adaptar app.js (init F7, quitar modo profesional) | — | ⬜ |
| 1.4 Adaptar utils.js (fetchAPI con Bearer, quitar funciones no usadas) | — | ⬜ |
| 1.5 Configurar i18next + archivos es.json/en.json | — | ⬜ |
| 1.6 Tab layout + routes.js | `app.f7` | ⬜ |
| 1.7 Home (carrusel, buscador) | `home.f7` | ⬜ |
| 1.8 Búsqueda profesionales | `search.f7` | ⬜ |
| 1.9 Perfil profesional | `profesional.f7` | ⬜ |
| 1.10 Reservar cita | `reservar.f7` | ⬜ |
| 1.11 Confirmar reserva | `confirmar_reserva.f7` | ⬜ |
| 1.12 Login | `login.f7` | ⬜ |
| 1.13 Registro | `registro.f7` | ⬜ |
| 1.14 Forgot password | `forgot_password.f7` | ⬜ |
| 1.15 Mis citas | `citas.f7` | ⬜ |
| 1.16 Detalle cita + cancelar | `cita_detalle.f7` | ⬜ |
| 1.17 Settings (cuenta, sin edición) | `settings.f7` | ⬜ |
| 1.18 Estilos VitaMind (colores, logo, fuentes) | `app.css` | ⬜ |
| 1.19 Build iOS + Android | — | ⬜ |
| 1.20 Testing manual completo | — | ⬜ |

### FASE 2 — Funcionalidades secundarias

| Tarea | Pantallas | Estado |
|-------|----------|--------|
| 2.1 Favoritos | `favoritos.f7` | ⬜ |
| 2.2 Editar perfil + foto | `editar_perfil.f7` | ⬜ |
| 2.3 Cambiar contraseña | `cambiar_pass.f7` | ⬜ |
| 2.4 Push notifications (FCM) | `notificaciones.f7`, `notificacion.f7` | ⬜ |
| 2.5 Crear endpoints backend faltantes | — | ⬜ |

### FASE 3 — Polish

| Tarea | Pantallas | Estado |
|-------|----------|--------|
| 3.1 Offline detection | — | ⬜ |
| 3.2 Check versión app | — | ⬜ |
| 3.3 Contenido dinámico (términos, normas) | `terminos.f7`, `normas.f7`, `info.f7` | ⬜ |
| 3.4 Share profesional | — | ⬜ |
| 3.5 Deep linking | — | ⬜ |
| 3.6 Dark mode ajustado | — | ⬜ |
| 3.7 Splash screen personalizado | — | ⬜ |
| 3.8 Publicar en App Store / Play Store | — | ⬜ |

---

## 14. Convenciones de código

### 14.1 Archivos y nomenclatura
- Páginas: `snake_case.f7` (ej: `cita_detalle.f7`)
- Variables JS: `camelCase`
- Claves localStorage: `vitamind_` prefijo (ej: `vitamind_token`)
- Claves i18n: `snake_case` (ej: `buscar_profesionales`)
- CSS clases custom: `vm-` prefijo (ej: `vm-card-profesional`)

### 14.2 Estructura de una página .f7

```html
<template>
  <div class="page" data-name="nombre-pagina">
    <div class="navbar">
      <div class="navbar-bg"></div>
      <div class="navbar-inner">
        <div class="left"><a class="link back"><i class="icon icon-back"></i></a></div>
        <div class="title">${$t('titulo_pagina')}</div>
      </div>
    </div>
    <div class="page-content">
      <!-- Contenido -->
    </div>
  </div>
</template>

<style>
  /* Estilos específicos de la página */
</style>

<script>
  export default (props, { $f7, $on, $t }) => {
    $on('pageInit', () => {
      // Inicialización
    });

    $on('pageBeforeRemove', () => {
      // Limpieza
    });

    return $render;
  };
</script>
```

### 14.3 Gestión de estado
- **localStorage** para persistencia entre sesiones
- **Variables en utils.js** para estado en memoria
- **NO** usar Vuex/Redux/Pinia — mantener simple como Buktiem
- **Patrón**: cargar datos en `pageInit`, actualizar DOM directo

### 14.4 Manejo de errores
- Try/catch en todas las llamadas API
- Feedback al usuario con diálogos F7 o SweetAlert
- Log a consola en desarrollo, silenciar en producción
- Token expirado → redirect a login automático

---

## 15. Testing y despliegue

### 15.1 Desarrollo local

```bash
cd /Volumes/web/00-TMWEBS-8/VITAMIND/app
yarn install
yarn dev          # Vite dev server con HMR (prueba en navegador)
```

### 15.2 Build y sincronizar

```bash
yarn build                     # Genera www/
npx cap sync                   # Sincroniza con iOS/Android
npx cap open ios               # Abre en Xcode
npx cap open android           # Abre en Android Studio
```

### 15.3 Testing manual checklist

- [ ] Login / logout funciona
- [ ] Registro crea usuario
- [ ] Búsqueda devuelve profesionales
- [ ] Perfil profesional carga datos
- [ ] Reserva se completa correctamente
- [ ] Mis citas muestra citas del usuario
- [ ] Cancelar cita funciona
- [ ] Favoritos add/remove funciona
- [ ] Push notification llega
- [ ] Offline detection funciona
- [ ] Cambio idioma ES/EN funciona
- [ ] Deep links abren pantalla correcta
- [ ] GPS detecta localidad
- [ ] Foto perfil sube correctamente

### 15.4 Entorno de prueba

- **Backend API**: `https://app.vitamind.es/api` (producción) o servidor staging si existe
- **Banner dev**: mostrar banner rojo con URL API en entorno de desarrollo (como Buktiem)

---

## Anexo A — Archivos de referencia

### Buktiem (app base a copiar)
```
/Users/toni/Desarrollo/APP/buktiem_L/
├── src/js/app.js              # Inicialización F7 + Capacitor
├── src/js/routes.js           # Rutas
├── src/js/utils.js            # Lógica negocio (3900 líneas) — ADAPTAR
├── src/js/env.js              # Config URLs
├── src/js/capacitor-app.js    # Eventos nativos
├── src/pages/*.f7             # 26 páginas — ADAPTAR/ELIMINAR
├── src/css/app.css            # Estilos — REHACER para VitaMind
├── public/locales/            # Traducciones — REHACER para VitaMind
├── capacitor.config.json      # Config nativa — ADAPTAR
└── package.json               # Dependencias — ADAPTAR
```

### VitaMind Frontend (referencia visual y funcional)
```
C:\Users\home\Desktop\Desarrollo\vitamind-front-end\
├── public/js/utils.js                          # Lógica real web paciente — REFERENCIA PRINCIPAL
├── resources/views/directory/                  # Home, resultados, perfil, confirmar reserva
├── resources/views/auth/                       # Login, registro, forgot, reset
├── resources/views/account/                    # Perfil, bookings, favoritos
├── resources/scss/_variables.scss              # Color primario `#f4934e`
├── lang/es.json, en.json                       # Traducciones
└── resources/js/functions.js                   # Inicialización de librerías y helpers
```

### VitaMind Backend (API)
```
C:\Users\home\Desktop\Desarrollo\vitamind-backend\
├── routes/api.php                              # TODAS las rutas API — REFERENCIA PRINCIPAL
├── app/Http/Controllers/authentications/       # LoginBasic (auth/register/forgot)
├── app/Http/Controllers/Pages/                 # Calendario, Empleado, User, Reserva
├── app/Models/Pages/                           # Modelos dominio
└── lang/es.json, en.json                       # Traducciones backend
```

---

## Anexo B — Decisiones pendientes

| Decisión | Opciones | Recomendación |
|---------|---------|---------------|
| Mapas | Google Maps (pago) vs Leaflet + Nominatim (gratis) | Leaflet + Nominatim (como Buktiem) salvo que el frontend ya pague Google Maps |
| App ID | `es.vitamind.app` | Confirmar con Toni |
| Nombre stores | "VitaMind" | Confirmar |
| Cuenta Apple Developer | Existente o nueva | Verificar |
| Cuenta Google Play | Existente o nueva | Verificar |
| Staging API | ¿Existe entorno staging? | Preguntar |
| Endpoints faltantes | ¿Crearlos antes o durante app? | Crear en Fase 2 (paralelo) |

---

*Documento generado el 2026-03-16. Mantener actualizado conforme avance el desarrollo.*
