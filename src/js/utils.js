import env from './env.js';

const apiUrl = env.apiUrl;
const appUrl = env.appUrl;

export const storageKeys = {
  token: 'sanctum_token',
  pacienteId: 'paciente_id',
  user: 'vitamind_datos_usu',
  appointmentDraft: 'vitamind_reserva_borrador',
  appointmentSelected: 'vitamind_cita_seleccionada',
  professionalMap: 'vitamind_professional_map',
};

export const missingApiEndpoints = {
  registerDevice: '/register-device',
  notifications: '/notificaciones',
  notificationDetail: '/notificaciones/{id}',
  notificationsUnreadCount: '/notificaciones/nuevas',
  deleteNotification: '/notificaciones/{id}/eliminar',
  appVersion: '/app-version',
  changePassword: '/cambiar-pass',
  deleteAccount: '/eliminar-cuenta',
};

var vista_anterior = null;
var handlingInvalidToken = false;

var tmApp = {
  f7: null,
  i18n: null,
  apiUrl,
  appUrl,
  vista_anterior,
  handlingInvalidToken,
  pagination: {
    limit: 10,
    offset: 0,
  },

  init: function (f7, i18n = null) {
    tmApp.f7 = f7;
    tmApp.i18n = i18n;
  },

  getSession: function () {
    return getSession();
  },
  isAuthenticated: function () {
    return isAuthenticated();
  },
  saveSession: function (payload = {}) {
    return saveSession(payload);
  },
  clearSession: function () {
    return clearSession();
  },

  fetchAPI: function (endpoint, options = {}) {
    return fetchAPI(endpoint, options);
  },

  login: function (data) {
    return login(data);
  },
  register: function (data) {
    return register(data);
  },
  logout: function () {
    return logout();
  },
  forgotPassword: function (email) {
    return forgotPassword(email);
  },
  resendVerificationEmail: function (email) {
    return resendVerificationEmail(email);
  },
  resetPasswordFromToken: function (data) {
    return resetPasswordFromToken(data);
  },
  getCurrentUser: function () {
    return getCurrentUser();
  },
  updateProfile: function (data, file = null) {
    return updateProfile(data, file);
  },

  getLatestProfessionals: function () {
    return getLatestProfessionals();
  },
  getHomeProfessionals: function () {
    return getHomeProfessionals();
  },
  getLocalidades: function () {
    return getLocalidades();
  },
  getServicios: function (localidad = '') {
    return getServicios(localidad);
  },
  searchProfessionals: function (filters = {}) {
    return searchProfessionals(filters);
  },
  getProfessionalsList: function (params = {}) {
    return getProfessionalsList(params);
  },
  getProfessionalProfile: function (token) {
    return getProfessionalProfile(token);
  },
  getProfessionalSlots: function (token, params = {}) {
    return getProfessionalSlots(token, params);
  },
  resolveProfessionalTokenByEmployeeId: function (employeeId) {
    return resolveProfessionalTokenByEmployeeId(employeeId);
  },

  createReservation: function (data) {
    return createReservation(data);
  },
  getMyAppointments: function (params = {}) {
    return getMyAppointments(params);
  },
  cancelAppointment: function (id) {
    return cancelAppointment(id);
  },

  getFavorites: function () {
    return getFavorites();
  },
  addFavorite: function (empleadoId) {
    return addFavorite(empleadoId);
  },
  removeFavorite: function (empleadoId) {
    return removeFavorite(empleadoId);
  },

  getDynamicContent: function (funct) {
    return getDynamicContent(funct);
  },
  getConditionDetail: function (tipo) {
    return getConditionDetail(tipo);
  },

  registerDevice: function () {
    return registerDevice();
  },
  getNotifications: function () {
    return getNotifications();
  },
  getNotificationDetail: function () {
    return getNotificationDetail();
  },
  getNotificationsUnreadCount: function () {
    return getNotificationsUnreadCount();
  },
  deleteNotification: function () {
    return deleteNotification();
  },
  getAppVersion: function () {
    return getAppVersion();
  },
  changePassword: function () {
    return changePassword();
  },
  deleteAccount: function () {
    return deleteAccount();
  },

  setStoredObject: function (key, value) {
    return setStoredObject(key, value);
  },
  getStoredObject: function (key) {
    return getStoredObject(key);
  },
  runApiDiagnostics: function () {
    return runApiDiagnostics();
  },
  getApiErrorMessage: function (error, fallback) {
    return getApiErrorMessage(error, fallback);
  },
};

export function getSession() {
  const token = localStorage.getItem(storageKeys.token);
  const pacienteId = localStorage.getItem(storageKeys.pacienteId);
  const rawUser = localStorage.getItem(storageKeys.user);

  let user = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch (error) {
      user = null;
    }
  }

  return {
    token,
    pacienteId: pacienteId ? Number(pacienteId) : user?.paciente_id || null,
    user,
  };
}

export function isAuthenticated() {
  return Boolean(getSession().token);
}

export function saveSession(payload = {}) {
  const token = payload.token || null;
  const user = payload.user || null;

  if (token) {
    localStorage.setItem(storageKeys.token, token);
  }

  if (user?.paciente_id) {
    localStorage.setItem(storageKeys.pacienteId, String(user.paciente_id));
  }

  if (user) {
    localStorage.setItem(storageKeys.user, JSON.stringify(user));
  }

  return getSession();
}

export function clearSession() {
  Object.values(storageKeys).forEach((key) => localStorage.removeItem(key));
}

export function setStoredObject(key, value) {
  if (value === null) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredObject(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export async function fetchAPI(endpoint, options = {}) {
  const {
    method = 'GET',
    data = null,
    auth = true,
    isFormData = false,
    timeout = 20000,
  } = options;

  const session = getSession();
  const headers = {
    Accept: 'application/json',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (auth && session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const config = {
    method,
    headers,
    signal: controller.signal,
  };

  let url = `${apiUrl}${endpoint}`;

  if (data && method === 'GET') {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const query = params.toString();
    if (query) {
      url += `?${query}`;
    }
  } else if (data) {
    if (isFormData) {
      config.body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(data);
    }
  }

  console.log('[VitaMind][fetchAPI] Request', {
    endpoint,
    method,
    auth,
    url,
    hasData: Boolean(data),
  });

  let response;
  let raw = '';

  try {
    response = await fetch(url, config);
    raw = await response.text();
    console.log('[VitaMind][fetchAPI] Response', {
      endpoint,
      status: response.status,
      ok: response.ok,
      rawPreview: raw ? raw.slice(0, 240) : '',
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[VitaMind][fetchAPI] Network error', {
      endpoint,
      method,
      url,
      message: error?.message || error,
    });

    if (error.name === 'AbortError') {
      const timeoutError = new Error('La API ha tardado demasiado en responder.');
      timeoutError.code = 'API_TIMEOUT';
      timeoutError.endpoint = endpoint;
      throw timeoutError;
    }

    const networkError = new Error(`No se pudo conectar con la API en ${apiUrl}.`);
    networkError.code = 'API_UNREACHABLE';
    networkError.endpoint = endpoint;
    networkError.cause = error;
    throw networkError;
  }

  clearTimeout(timeoutId);

  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch (error) {
    payload = { message: raw || 'Respuesta no valida del servidor' };
  }

  if (response.status === 401) {
    clearSession();
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'No se pudo completar la solicitud');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function login(data) {
  const response = await fetchAPI('/login', {
    method: 'POST',
    auth: false,
    data,
  });

  if (!response?.user?.paciente_id) {
    throw new Error(response?.message || 'Este acceso es exclusivo para pacientes.');
  }

  saveSession(response);
  return response;
}

export async function register(data) {
  const response = await fetchAPI('/register', {
    method: 'POST',
    auth: false,
    data,
  });

  saveSession(response);
  return response;
}

export function forgotPassword(email) {
  return fetchAPI('/forgot-password', {
    method: 'POST',
    auth: false,
    data: { email },
  });
}

export function resendVerificationEmail(email) {
  return fetchAPI('/email/resend', {
    method: 'POST',
    auth: false,
    data: { email },
  });
}

export function resetPasswordFromToken(data) {
  return fetchAPI('/password/reset-from-token', {
    method: 'POST',
    auth: false,
    data,
  });
}

export function getCurrentUser() {
  return fetchAPI('/user');
}

export function logout() {
  return fetchAPI('/logout', {
    method: 'POST',
  });
}

export function updateProfile(data, file = null) {
  if (!file) {
    return fetchAPI('/user/update', {
      method: 'POST',
      data,
    });
  }

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  formData.append('imagen', file);

  return fetchAPI('/user/update', {
    method: 'POST',
    data: formData,
    isFormData: true,
  });
}

export function getLatestProfessionals() {
  return fetchAPI('/ultimos-profesionales', {
    auth: false,
  });
}

export async function getHomeProfessionals() {
  let latestError = null;

  console.log('[VitaMind][home] Iniciando carga de profesionales');

  try {
    const response = await getLatestProfessionals();
    const items = response?.profesionales || [];
    console.log('[VitaMind][home] Resultado /ultimos-profesionales', {
      total: items.length,
      responseKeys: response ? Object.keys(response) : [],
    });
    if (items.length) {
      return items;
    }
  } catch (error) {
    latestError = error;
    console.error('[VitaMind][home] Error /ultimos-profesionales', {
      message: getApiErrorMessage(error),
      endpoint: error?.endpoint || '/ultimos-profesionales',
    });
  }

  let listError = null;
  let tokens = [];

  try {
    const tokensResponse = await getProfessionalsList();
    tokens = tokensResponse?.empleados || [];
    console.log('[VitaMind][home] Resultado /profesionales', {
      total: tokens.length,
      responseKeys: tokensResponse ? Object.keys(tokensResponse) : [],
    });
  } catch (error) {
    listError = error;
    console.error('[VitaMind][home] Error /profesionales', {
      message: getApiErrorMessage(error),
      endpoint: error?.endpoint || '/profesionales',
    });
  }

  const professionals = [];

  if (tokens.length) {
    const profiles = await Promise.allSettled(
      tokens.slice(0, 6).map(async (token) => {
        const profile = await getProfessionalProfile(token);
        return {
          id: profile?.id,
          nombre: profile?.nombre_completo || profile?.nombre || 'Profesional',
          imagen: profile?.imagen || '/avatar.png',
          token,
        };
      }),
    );

    profiles.forEach((result) => {
      if (result.status === 'fulfilled') {
        professionals.push(result.value);
      } else {
        console.error('[VitaMind][home] Error cargando perfil individual', {
          message: result.reason?.message || result.reason,
        });
      }
    });
  }

  console.log('[VitaMind][home] Profesionales finales', {
    total: professionals.length,
  });

  if (!professionals.length) {
    const primaryMessage = latestError ? getApiErrorMessage(latestError) : 'Sin datos en /ultimos-profesionales';
    const fallbackMessage = listError ? getApiErrorMessage(listError) : (tokens.length ? 'Los perfiles individuales no devolvieron datos' : 'Sin tokens en /profesionales');
    throw new Error(`No se pudieron cargar profesionales. Principal: ${primaryMessage}. Fallback: ${fallbackMessage}.`);
  }

  return professionals;
}

export function getLocalidades() {
  return fetchAPI('/localidades', {
    method: 'POST',
    auth: false,
  });
}

export function getServicios(localidad = '') {
  return fetchAPI('/servicios', {
    method: 'POST',
    auth: false,
    data: { localidad },
  });
}

export function searchProfessionals(filters = {}) {
  return fetchAPI('/horarios-por-localidad', {
    method: 'POST',
    auth: isAuthenticated(),
    data: {
      origen: 'app',
      paciente_id: getSession().pacienteId,
      dias: 5,
      ...filters,
    },
  });
}

export function getProfessionalsList(params = {}) {
  return fetchAPI('/profesionales', {
    auth: false,
    data: params,
  });
}

export function getProfessionalProfile(token) {
  return fetchAPI(`/profesional/${token}`, {
    auth: false,
  });
}

export function getProfessionalSlots(token, params = {}) {
  return fetchAPI(`/horarios/por-token/${token}`, {
    auth: isAuthenticated(),
    data: {
      paciente_id: getSession().pacienteId,
      ...params,
    },
  });
}

export async function resolveProfessionalTokenByEmployeeId(employeeId) {
  const cache = getStoredObject(storageKeys.professionalMap) || {};
  if (cache[employeeId]) {
    return cache[employeeId];
  }

  const response = await getProfessionalsList();
  const tokens = response?.empleados || [];

  for (const token of tokens) {
    try {
      const profile = await getProfessionalProfile(token);
      if (Number(profile?.id) === Number(employeeId)) {
        cache[employeeId] = token;
        setStoredObject(storageKeys.professionalMap, cache);
        return token;
      }
    } catch (error) {
      // Ignoramos fallos de perfiles individuales al resolver el token.
    }
  }

  return null;
}

export function createReservation(data) {
  return fetchAPI('/reserva', {
    method: 'POST',
    data: {
      origen: 'app',
      ...data,
    },
  });
}

export function getMyAppointments(params = {}) {
  return fetchAPI('/mis-citas', {
    data: params,
  });
}

export function cancelAppointment(id) {
  return fetchAPI(`/citas/${id}/cancelar`, {
    method: 'POST',
  });
}

export function getFavorites() {
  return fetchAPI('/favoritos');
}

export function addFavorite(empleadoId) {
  return fetchAPI('/favoritos/add', {
    method: 'POST',
    data: { empleado_id: empleadoId },
  });
}

export function removeFavorite(empleadoId) {
  return fetchAPI('/favoritos/remove', {
    method: 'POST',
    data: { empleado_id: empleadoId },
  });
}

export function getDynamicContent(funct) {
  return fetchAPI('/cargarContenido', {
    auth: false,
    data: { funct },
  });
}

export function getConditionDetail(tipo) {
  return fetchAPI(`/condiciones/${tipo}`, {
    auth: false,
  });
}

function createMissingEndpointError(key) {
  const endpoint = missingApiEndpoints[key];
  const error = new Error(`Endpoint pendiente en backend: ${endpoint}`);
  error.code = 'API_ENDPOINT_PENDING';
  error.endpoint = endpoint;
  return error;
}

export function registerDevice() {
  throw createMissingEndpointError('registerDevice');
}

export function getNotifications() {
  throw createMissingEndpointError('notifications');
}

export function getNotificationDetail() {
  throw createMissingEndpointError('notificationDetail');
}

export function getNotificationsUnreadCount() {
  throw createMissingEndpointError('notificationsUnreadCount');
}

export function deleteNotification() {
  throw createMissingEndpointError('deleteNotification');
}

export function getAppVersion() {
  throw createMissingEndpointError('appVersion');
}

export function changePassword() {
  throw createMissingEndpointError('changePassword');
}

export function deleteAccount() {
  throw createMissingEndpointError('deleteAccount');
}

export async function runApiDiagnostics() {
  const diagnostics = {
    apiUrl,
    checks: [],
  };

  const checks = [
    {
      name: 'ultimos-profesionales',
      run: () => getLatestProfessionals(),
    },
    {
      name: 'localidades',
      run: () => getLocalidades(),
    },
    {
      name: 'user',
      requiresAuth: true,
      run: () => getCurrentUser(),
    },
  ];

  for (const check of checks) {
    if (check.requiresAuth && !isAuthenticated()) {
      diagnostics.checks.push({
        name: check.name,
        ok: false,
        skipped: true,
        message: 'Requiere sesion iniciada',
      });
      continue;
    }

    try {
      const payload = await check.run();
      diagnostics.checks.push({
        name: check.name,
        ok: true,
        message: 'OK',
        sample: payload ? Object.keys(payload).slice(0, 5).join(', ') : 'sin contenido',
      });
    } catch (error) {
      diagnostics.checks.push({
        name: check.name,
        ok: false,
        message: getApiErrorMessage(error),
      });
    }
  }

  return diagnostics;
}

export function getApiErrorMessage(error, fallback = 'No se pudo completar la solicitud') {
  if (!error) {
    return fallback;
  }

  if (error.code === 'API_UNREACHABLE' || error.code === 'API_TIMEOUT') {
    return error.message;
  }

  if (error.code === 'API_ENDPOINT_PENDING' && error.endpoint) {
    return `${error.message}.`;
  }

  const validationErrors = error.payload?.errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const firstField = Object.keys(validationErrors)[0];
    const firstMessage = validationErrors[firstField]?.[0];
    if (firstMessage) {
      return firstMessage;
    }
  }

  return error.message || fallback;
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatPrice(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

export function formatDateTime(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default tmApp;
