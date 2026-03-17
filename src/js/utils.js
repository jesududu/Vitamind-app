import env from './env.js';

const apiUrl = env.apiUrl;
const appUrl = env.appUrl;

var vista_anterior;
var model;
var platform;
var version;
var manufacturer;
var nombreEmpresa = 'vitamind';
const idiomaAlmacenado = localStorage.getItem('vitamind_idioma');
let handlingInvalidToken = false;
let agendaFC = null;

var tmApp = {
  f7: null,
  i18n: null,
  apiUrl,
  appUrl,
  vista_anterior,
  model,
  platform,
  version,
  manufacturer,
  nombreEmpresa,
  idiomaAlmacenado,
  handlingInvalidToken,
  storageKeys: {
    token: 'sanctum_token',
    pacienteId: 'paciente_id',
    user: 'vitamind_datos_usu',
    appointmentDraft: 'vitamind_reserva_borrador',
    appointmentSelected: 'vitamind_cita_seleccionada',
    professionalMap: 'vitamind_professional_map',
  },
  missingApiEndpoints: {
    registerDevice: '/register-device',
    notifications: '/notificaciones',
    notificationDetail: '/notificaciones/{id}',
    notificationsUnreadCount: '/notificaciones/nuevas',
    deleteNotification: '/notificaciones/{id}/eliminar',
    appVersion: '/app-version',
    changePassword: '/cambiar-pass',
    deleteAccount: '/eliminar-cuenta',
  },
  pagination: {
    limit: 10,
    offset: 0,
  },
  _buscando: false,
  _searchId: 0,
  agendaFC,

  objectToQueryString: function (obj = {}) {
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return params.toString();
  },

  fetchAPI: async function (endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      auth = true,
      isFormData = false,
      timeout = 20000,
    } = options;

    const session = tmApp.getSession();
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
      const query = tmApp.objectToQueryString(data);
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

      const causeMessage = error?.message ? ` Causa: ${error.message}` : '';
      const networkError = new Error(`No se pudo conectar con la API en ${apiUrl}.${causeMessage}`);
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
      tmApp.clearSession();
    }

    if (!response.ok) {
      const error = new Error(payload?.message || 'No se pudo completar la solicitud');
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  },

  fetchPublicData: async function (fullUrl, options = {}) {
    const {
      method = 'GET',
      data = null,
      isFormData = false,
      timeout = 20000,
    } = options;

    const headers = {
      Accept: 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const config = {
      method,
      headers,
      signal: controller.signal,
    };

    let url = fullUrl;

    if (data && method === 'GET') {
      const query = tmApp.objectToQueryString(data);
      if (query) {
        url += url.includes('?') ? `&${query}` : `?${query}`;
      }
    } else if (data) {
      if (isFormData) {
        config.body = data;
      } else {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(data);
      }
    }

    console.log('[VitaMind][fetchPublic] Request', {
      method,
      url,
      hasData: Boolean(data),
    });

    let response;
    let raw = '';

    try {
      response = await fetch(url, config);
      raw = await response.text();
      console.log('[VitaMind][fetchPublic] Response', {
        status: response.status,
        ok: response.ok,
        rawPreview: raw ? raw.slice(0, 240) : '',
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[VitaMind][fetchPublic] Network error', {
        method,
        url,
        message: error?.message || error,
      });

      if (error.name === 'AbortError') {
        const timeoutError = new Error('La API publica ha tardado demasiado en responder.');
        timeoutError.code = 'API_TIMEOUT';
        throw timeoutError;
      }

      const causeMessage = error?.message ? ` Causa: ${error.message}` : '';
      const networkError = new Error(`No se pudo conectar con la API publica en ${url}.${causeMessage}`);
      networkError.code = 'API_UNREACHABLE';
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

    if (!response.ok) {
      const error = new Error(payload?.message || 'No se pudo completar la solicitud');
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  },

  ajaxData: function (fullUrl, options = {}) {
    const endpoint = fullUrl.replace(apiUrl, '');
    return tmApp.fetchAPI(endpoint, {
      method: 'GET',
      ...options,
    });
  },

  ajaxPostData: function (fullUrl, data = {}, options = {}) {
    const endpoint = fullUrl.replace(apiUrl, '');
    return tmApp.fetchAPI(endpoint, {
      method: 'POST',
      data,
      ...options,
    });
  },

  getApiErrorMessage: function (error, fallback = 'No se pudo completar la solicitud') {
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
  },

  createMissingEndpointError: function (key) {
    const endpoint = tmApp.missingApiEndpoints[key];
    const error = new Error(`Endpoint pendiente en backend: ${endpoint}`);
    error.code = 'API_ENDPOINT_PENDING';
    error.endpoint = endpoint;
    return error;
  },

  login: async function (data) {
    const url = apiUrl + '/login';
    const fullUrl = url;
    const response = await tmApp.fetchPublicData(fullUrl, {
      method: 'POST',
      data,
    });

    if (!response?.user?.paciente_id) {
      throw new Error(response?.message || 'Este acceso es exclusivo para pacientes.');
    }

    tmApp.saveSession(response);
    return response;
  },

  register: async function (data) {
    const url = apiUrl + '/register';
    const fullUrl = url;
    const response = await tmApp.fetchPublicData(fullUrl, {
      method: 'POST',
      data,
    });

    tmApp.saveSession(response);
    return response;
  },

  forgotPassword: function (email) {
    const url = apiUrl + '/forgot-password';
    const fullUrl = url;
    return tmApp.fetchPublicData(fullUrl, {
      method: 'POST',
      data: { email },
    });
  },

  resendVerificationEmail: function (email) {
    const url = apiUrl + '/email/resend';
    const fullUrl = url;
    return tmApp.fetchPublicData(fullUrl, {
      method: 'POST',
      data: { email },
    });
  },

  resetPasswordFromToken: function (data) {
    const url = apiUrl + '/password/reset-from-token';
    const fullUrl = url;
    return tmApp.fetchPublicData(fullUrl, {
      method: 'POST',
      data,
    });
  },

  logout: function () {
    const url = apiUrl + '/logout';
    const fullUrl = url;
    return tmApp.ajaxPostData(fullUrl, {});
  },

  getSession: function () {
    const token = localStorage.getItem(tmApp.storageKeys.token);
    const pacienteId = localStorage.getItem(tmApp.storageKeys.pacienteId);
    const rawUser = localStorage.getItem(tmApp.storageKeys.user);

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
  },

  isAuthenticated: function () {
    return Boolean(tmApp.getSession().token);
  },

  saveSession: function (payload = {}) {
    const token = payload.token || null;
    const user = payload.user || null;

    if (token) {
      localStorage.setItem(tmApp.storageKeys.token, token);
    }

    if (user?.paciente_id) {
      localStorage.setItem(tmApp.storageKeys.pacienteId, String(user.paciente_id));
    }

    if (user) {
      localStorage.setItem(tmApp.storageKeys.user, JSON.stringify(user));
    }

    return tmApp.getSession();
  },

  clearSession: function () {
    Object.values(tmApp.storageKeys).forEach((key) => localStorage.removeItem(key));
  },

  getCurrentUser: function () {
    const url = apiUrl + '/user';
    const fullUrl = url;
    return tmApp.ajaxData(fullUrl);
  },

  updateProfile: function (data, file = null) {
    const url = apiUrl + '/user/update';
    const fullUrl = url;

    if (!file) {
      return tmApp.ajaxPostData(fullUrl, data);
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    formData.append('imagen', file);

    return tmApp.ajaxPostData(fullUrl, formData, {
      isFormData: true,
    });
  },

  changePassword: function () {
    throw tmApp.createMissingEndpointError('changePassword');
  },

  deleteAccount: function () {
    throw tmApp.createMissingEndpointError('deleteAccount');
  },

  setStoredObject: function (key, value) {
    if (value === null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  },

  getStoredObject: function (key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  },

  getNotifications: function () {
    throw tmApp.createMissingEndpointError('notifications');
  },

  getNotificationDetail: function () {
    throw tmApp.createMissingEndpointError('notificationDetail');
  },

  getNotificationsUnreadCount: function () {
    throw tmApp.createMissingEndpointError('notificationsUnreadCount');
  },

  deleteNotification: function () {
    throw tmApp.createMissingEndpointError('deleteNotification');
  },

  registerDevice: function () {
    throw tmApp.createMissingEndpointError('registerDevice');
  },

  getAppVersion: function () {
    throw tmApp.createMissingEndpointError('appVersion');
  },

  runApiDiagnostics: async function () {
    const diagnostics = {
      apiUrl,
      checks: [],
    };

    const checks = [
      {
        name: 'ultimos-profesionales',
        run: () => tmApp.getLatestProfessionals(),
      },
      {
        name: 'localidades',
        run: () => tmApp.getLocalidades(),
      },
      {
        name: 'user',
        requiresAuth: true,
        run: () => tmApp.getCurrentUser(),
      },
    ];

    for (const check of checks) {
      if (check.requiresAuth && !tmApp.isAuthenticated()) {
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
          message: tmApp.getApiErrorMessage(error),
        });
      }
    }

    return diagnostics;
  },

  getLatestProfessionals: function () {
    const url = apiUrl + '/ultimos-profesionales';
    const fullUrl = url;
    return tmApp.fetchPublicData(fullUrl);
  },

  getHomeProfessionals: async function () {
    let latestError = null;

    console.log('[VitaMind][home] Iniciando carga de profesionales');

    try {
      const response = await tmApp.getLatestProfessionals();
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
        message: tmApp.getApiErrorMessage(error),
        endpoint: error?.endpoint || '/ultimos-profesionales',
      });
    }

    let listError = null;
    let tokens = [];

    try {
      const tokensResponse = await tmApp.getProfessionalsList();
      tokens = tokensResponse?.empleados || [];
      console.log('[VitaMind][home] Resultado /profesionales', {
        total: tokens.length,
        responseKeys: tokensResponse ? Object.keys(tokensResponse) : [],
      });
    } catch (error) {
      listError = error;
      console.error('[VitaMind][home] Error /profesionales', {
        message: tmApp.getApiErrorMessage(error),
        endpoint: error?.endpoint || '/profesionales',
      });
    }

    const professionals = [];

    if (tokens.length) {
      const profiles = await Promise.allSettled(
        tokens.slice(0, 6).map(async (token) => {
          const profile = await tmApp.getProfessionalProfile(token);
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
      const primaryMessage = latestError ? tmApp.getApiErrorMessage(latestError) : 'Sin datos en /ultimos-profesionales';
      const fallbackMessage = listError
        ? tmApp.getApiErrorMessage(listError)
        : (tokens.length ? 'Los perfiles individuales no devolvieron datos' : 'Sin tokens en /profesionales');
      throw new Error(`No se pudieron cargar profesionales. Principal: ${primaryMessage}. Fallback: ${fallbackMessage}.`);
    }

    return professionals;
  },

  getLocalidades: function () {
    const url = apiUrl + '/localidades';
    const fullUrl = url;
    return tmApp.fetchPublicData(fullUrl, {
      method: 'POST',
      data: {},
    });
  },

  getServicios: function (localidad = '') {
    const url = apiUrl + '/servicios';
    const fullUrl = url;
    return tmApp.fetchPublicData(fullUrl, {
      method: 'POST',
      data: { localidad },
    });
  },

  searchProfessionals: function (filters = {}) {
    const url = apiUrl + '/horarios-por-localidad';
    const fullUrl = url;
    return tmApp.ajaxPostData(fullUrl, {
      origen: 'app',
      paciente_id: tmApp.getSession().pacienteId,
      dias: 5,
      ...filters,
    }, {
      auth: tmApp.isAuthenticated(),
    });
  },

  getProfessionalsList: function (params = {}) {
    const queryString = tmApp.objectToQueryString(params);
    const url = apiUrl + '/profesionales';
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return tmApp.fetchPublicData(fullUrl);
  },

  getProfessionalProfile: function (token) {
    const url = apiUrl + `/profesional/${token}`;
    const fullUrl = url;
    return tmApp.fetchPublicData(fullUrl);
  },

  getProfessionalSlots: function (token, params = {}) {
    const queryString = tmApp.objectToQueryString({
      paciente_id: tmApp.getSession().pacienteId,
      ...params,
    });
    const url = apiUrl + `/horarios/por-token/${token}`;
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return tmApp.ajaxData(fullUrl, {
      auth: tmApp.isAuthenticated(),
    });
  },

  resolveProfessionalTokenByEmployeeId: async function (employeeId) {
    const cache = tmApp.getStoredObject(tmApp.storageKeys.professionalMap) || {};
    if (cache[employeeId]) {
      return cache[employeeId];
    }

    const response = await tmApp.getProfessionalsList();
    const tokens = response?.empleados || [];

    for (const token of tokens) {
      try {
        const profile = await tmApp.getProfessionalProfile(token);
        if (Number(profile?.id) === Number(employeeId)) {
          cache[employeeId] = token;
          tmApp.setStoredObject(tmApp.storageKeys.professionalMap, cache);
          return token;
        }
      } catch (error) {
        // Ignoramos fallos de perfiles individuales al resolver el token.
      }
    }

    return null;
  },

  createReservation: function (data) {
    const url = apiUrl + '/reserva';
    const fullUrl = url;
    return tmApp.ajaxPostData(fullUrl, {
      origen: 'app',
      ...data,
    });
  },

  getMyAppointments: function (params = {}) {
    const queryString = tmApp.objectToQueryString(params);
    const url = apiUrl + '/mis-citas';
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return tmApp.ajaxData(fullUrl);
  },

  cancelAppointment: function (id) {
    const url = apiUrl + `/citas/${id}/cancelar`;
    const fullUrl = url;
    return tmApp.ajaxPostData(fullUrl, {});
  },

  getFavorites: function () {
    const url = apiUrl + '/favoritos';
    const fullUrl = url;
    return tmApp.ajaxData(fullUrl);
  },

  addFavorite: function (empleadoId) {
    const url = apiUrl + '/favoritos/add';
    const fullUrl = url;
    return tmApp.ajaxPostData(fullUrl, { empleado_id: empleadoId });
  },

  removeFavorite: function (empleadoId) {
    const url = apiUrl + '/favoritos/remove';
    const fullUrl = url;
    return tmApp.ajaxPostData(fullUrl, { empleado_id: empleadoId });
  },

  getDynamicContent: function (funct) {
    const queryString = tmApp.objectToQueryString({ funct });
    const url = apiUrl + '/cargarContenido';
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return tmApp.fetchPublicData(fullUrl);
  },

  getConditionDetail: function (tipo) {
    const url = apiUrl + `/condiciones/${tipo}`;
    const fullUrl = url;
    return tmApp.fetchPublicData(fullUrl);
  },

  escapeHtml: function (value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  },

  formatDate: function (value) {
    if (!value) return '';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  },

  formatPrice: function (value) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(value || 0));
  },

  formatDateTime: function (value) {
    if (!value) return '';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  },

  init: function (f7, i18n = null) {
    tmApp.f7 = f7;
    tmApp.i18n = i18n;
  },
};

export default tmApp;
