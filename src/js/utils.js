import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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
      profileImageDraft: 'vitamind_profile_image_draft',
      searchCoordinates: 'vitamind_search_coordinates',
      searchGeoFailedAt: 'vitamind_search_geo_failed_at',
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

  isNativeApp: function () {
    return Capacitor.isNativePlatform();
  },

  parseHttpResponseData: function (data) {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        return { message: data || 'Respuesta no valida del servidor' };
      }
    }

    return data ?? null;
  },

  requestNativeHttp: async function (url, options = {}) {
    const {
      method = 'GET',
      data = null,
      headers = {},
      timeout = 20000,
      isFormData = false,
    } = options;

    const requestOptions = {
      url,
      method,
      headers,
      data,
      connectTimeout: timeout,
      readTimeout: timeout,
    };

    if (isFormData) {
      requestOptions.dataType = 'formData';
      requestOptions.data = tmApp.formDataToNativeData(data);
    }

    const response = await CapacitorHttp.request(requestOptions);

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: tmApp.parseHttpResponseData(response.data),
    };
  },

  formDataToNativeData: function (formData) {
    if (!formData || typeof formData.entries !== 'function') {
      return formData;
    }

    const nativeData = {};

    for (const [key, value] of formData.entries()) {
      nativeData[key] = value;
    }

    return nativeData;
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
      if (tmApp.isNativeApp() && !isFormData) {
        const nativeResponse = await tmApp.requestNativeHttp(url, {
          method,
          data: isFormData ? data : (method === 'GET' ? null : data),
          headers,
          timeout,
          isFormData,
        });
        response = {
          ok: nativeResponse.ok,
          status: nativeResponse.status,
        };
        raw = JSON.stringify(nativeResponse.data ?? {});
      } else {
        response = await fetch(url, config);
        raw = await response.text();
      }

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
      if (tmApp.isNativeApp() && !isFormData) {
        const nativeResponse = await tmApp.requestNativeHttp(url, {
          method,
          data: isFormData ? data : (method === 'GET' ? null : data),
          headers,
          timeout,
          isFormData,
        });
        response = {
          ok: nativeResponse.ok,
          status: nativeResponse.status,
        };
        raw = JSON.stringify(nativeResponse.data ?? {});
      } else {
        response = await fetch(url, config);
        raw = await response.text();
      }

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

    if (typeof error === 'string') {
      return error;
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

    if (typeof error.payload === 'string' && error.payload.trim()) {
      return error.payload;
    }

    if (typeof error.payload?.message === 'string' && error.payload.message.trim()) {
      return error.payload.message;
    }

    if (typeof error.status === 'number') {
      return `${fallback} (HTTP ${error.status})`;
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

  refreshCurrentUser: async function () {
    const response = await tmApp.getCurrentUser();
    const session = tmApp.getSession();
    tmApp.saveSession({
      token: session.token,
      user: response && response.user ? response.user : response,
    });
    return tmApp.getSession();
  },

  updateProfile: function (data, file = null) {
    const url = apiUrl + '/user/update';
    const fullUrl = url;

    if (!file) {
      return tmApp.ajaxPostData(fullUrl, data);
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    formData.append('imagen', file, file.name || 'perfil.jpg');

    return tmApp.ajaxPostData(fullUrl, formData, {
      isFormData: true,
    });
  },

  updateProfileImage: async function (file) {
    const currentUser = await tmApp.getCurrentUser();
    const paciente = currentUser && currentUser.paciente ? currentUser.paciente : {};

    return tmApp.updateProfile({
      nombre: paciente.nombre || (currentUser && currentUser.name ? String(currentUser.name).split(' ')[0] : ''),
      apellidos: paciente.apellidos || (currentUser && currentUser.name ? String(currentUser.name).split(' ').slice(1).join(' ') : ''),
      email: (currentUser && currentUser.email) || paciente.email || '',
      telefono: paciente.telefono || currentUser?.telefono || '',
    }, file);
  },

  dataUrlToFile: function (dataUrl, fileName = 'perfil.jpg') {
    const parts = String(dataUrl).split(',');
    const match = parts[0].match(/:(.*?);/);
    const mime = match ? match[1] : 'image/jpeg';
    const binary = atob(parts[1] || '');
    let length = binary.length;
    const bytes = new Uint8Array(length);

    while (length--) {
      bytes[length] = binary.charCodeAt(length);
    }

    return new File([bytes], fileName, { type: mime });
  },

  setProfileImageDraft: function (draft = null) {
    if (!draft) {
      localStorage.removeItem(tmApp.storageKeys.profileImageDraft);
      return;
    }

    localStorage.setItem(tmApp.storageKeys.profileImageDraft, JSON.stringify(draft));
  },

  getProfileImageDraft: function () {
    const raw = localStorage.getItem(tmApp.storageKeys.profileImageDraft);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  },

  clearProfileImageDraft: function () {
    localStorage.removeItem(tmApp.storageKeys.profileImageDraft);
  },

  selectProfileImage: async function (source = 'photos') {
    const sourceType = source === 'camera' ? CameraSource.Camera : CameraSource.Photos;
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: sourceType,
      width: 500,
      height: 500,
      correctOrientation: true,
    });

    if (!image || !image.dataUrl) {
      throw new Error('No se ha seleccionado imagen');
    }

    return {
      file: tmApp.dataUrlToFile(image.dataUrl, `perfil.${image.format || 'jpg'}`),
      previewUrl: image.dataUrl,
    };
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
    const url = apiUrl + '/notificaciones';
    return tmApp.ajaxData(url);
  },

  getNotificationDetail: function (id) {
    const url = apiUrl + `/notificaciones/${id}`;
    return tmApp.ajaxData(url);
  },

  getNotificationsUnreadCount: function () {
    const url = apiUrl + '/notificaciones/nuevas';
    return tmApp.ajaxData(url);
  },

  deleteNotification: function (id) {
    const url = apiUrl + `/notificaciones/${id}/eliminar`;
    return tmApp.ajaxPostData(url, {});
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

  normalizeProfessionalImage: function (image) {
    if (!image || typeof image !== 'string') {
      const fallbackSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#f3efe9"/><circle cx="80" cy="62" r="28" fill="#d7c8bc"/><path d="M36 132c8-24 28-38 44-38s36 14 44 38" fill="#d7c8bc"/></svg>';
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(fallbackSvg)}`;
    }

    if (image.startsWith('http') || image.startsWith('data:') || image.startsWith('blob:')) {
      return image;
    }

    return `${appUrl}${String(image).replace(/^\/+/, '')}`;
  },

  normalizeHomeProfessional: function (professional = {}) {
    return {
      id: professional.id || null,
      token: professional.token || professional.id || null,
      nombre: professional.nombre || professional.nombre_completo || 'Profesional',
      direccion: professional.direccion || professional.empresa_nombre || '',
      imagen: tmApp.normalizeProfessionalImage(professional.imagen || professional.imagen_url),
    };
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
        return items
          .map((item) => tmApp.normalizeHomeProfessional(item))
          .filter((item) => item.token);
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
          return tmApp.normalizeHomeProfessional({
            ...profile,
            token,
          });
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

  getVisitedCenters: async function () {
    const coords = tmApp.getStoredObject(tmApp.storageKeys.searchCoordinates);
    const url = apiUrl + '/centros-visitados';
    const query = tmApp.objectToQueryString({
      lat: coords?.lat || '',
      lng: coords?.lng || '',
    });
    const fullUrl = query ? `${url}?${query}` : url;
    return tmApp.ajaxData(fullUrl);
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

    getCurrentLocation: function (options = {}) {
      const {
        enableHighAccuracy = true,
        timeout = 8000,
        maximumAge = 120000,
    } = options;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalizacion no disponible en este dispositivo.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(error && error.message ? error.message : 'No se pudo obtener tu ubicacion.'));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        },
        );
      });
    },

    getSearchCoordinates: async function (options = {}) {
      const {
        forcePrompt = false,
      } = options;
      const expiration = 15 * 60 * 1000;
      const now = Date.now();
      const cached = tmApp.getStoredObject(tmApp.storageKeys.searchCoordinates);
      const geoFailedAt = Number(localStorage.getItem(tmApp.storageKeys.searchGeoFailedAt) || 0);

      if (!forcePrompt && cached && cached.lat && cached.lng && cached.timestamp && (now - cached.timestamp < expiration)) {
        return {
          lat: cached.lat,
          lng: cached.lng,
          source: 'cache',
        };
      }

      if (!forcePrompt && geoFailedAt && (now - geoFailedAt < expiration)) {
        return null;
      }

      try {
        const location = await tmApp.getCurrentLocation({
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: expiration,
        });

        const coords = {
          lat: location.lat,
          lng: location.lng,
          timestamp: now,
        };

        tmApp.setStoredObject(tmApp.storageKeys.searchCoordinates, coords);
        localStorage.removeItem(tmApp.storageKeys.searchGeoFailedAt);

        return {
          lat: coords.lat,
          lng: coords.lng,
          source: 'gps',
        };
      } catch (error) {
        localStorage.setItem(tmApp.storageKeys.searchGeoFailedAt, String(now));
        return null;
      }
    },

    searchProfessionals: function (filters = {}) {
      const url = apiUrl + '/horarios-por-localidad';
      const fullUrl = url;
      const payload = {
        origen: 'app',
        dias: 5,
        ...filters,
      };
      const session = tmApp.getSession();

      if (session.pacienteId) {
        payload.paciente_id = session.pacienteId;
      }

      if (!tmApp.isAuthenticated()) {
        return tmApp.fetchPublicData(fullUrl, {
          method: 'POST',
          data: payload,
        });
      }

      return tmApp.ajaxPostData(fullUrl, payload, {
        auth: true,
      });
    },

    searchDirectoryProfessionals: function (filters = {}) {
      const url = apiUrl + '/buscar';
      const fullUrl = url;
      return tmApp.fetchPublicData(fullUrl, {
        method: 'POST',
        data: {
          localidad: filters.localidad || '',
          query: filters.query || '',
        },
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

    searchProfessionalsCatalog: async function (filters = {}) {
      const params = {};

      if (typeof filters.lat === 'number' && typeof filters.lng === 'number') {
        params.lat = filters.lat;
        params.lng = filters.lng;
      }

      const response = await tmApp.getProfessionalsList(params);
      const tokens = Array.isArray(response?.empleados) ? response.empleados : [];
      const normalizedQuery = String(filters.query || '').trim().toLowerCase();
      const normalizedLocalidad = String(filters.localidad || '').trim().toLowerCase();

      if (!tokens.length) {
        return [];
      }

      const profiles = await Promise.allSettled(
        tokens.slice(0, 40).map(async (token) => {
          const profile = await tmApp.getProfessionalProfile(token);
          return {
            ...profile,
            token,
          };
        }),
      );

      return profiles
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter((profile) => {
          const fullName = String(profile.nombre_completo || profile.nombre || '').toLowerCase();
          const localityText = String(profile.localidad || profile.empresa?.localidad || profile.direccion || '').toLowerCase();
          const services = Array.isArray(profile.servicios) ? profile.servicios : [];
          const servicesText = services.map((item) => String(item.titulo || '')).join(' ').toLowerCase();

          const matchesQuery = !normalizedQuery || fullName.includes(normalizedQuery) || servicesText.includes(normalizedQuery);
          const matchesLocalidad = !normalizedLocalidad || localityText.includes(normalizedLocalidad);

          return matchesQuery && matchesLocalidad;
        });
    },

  getProfessionalSlots: function (token, params = {}) {
    const queryString = tmApp.objectToQueryString({
      ...params,
    });
    const url = apiUrl + `/horarios/por-token/${token}`;
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return tmApp.ajaxData(fullUrl, {
      auth: tmApp.isAuthenticated(),
    });
  },

  getProfessionalAvailabilityHtml: function ({ fecha, servicio_id, empleado_id, empresa_id = null, paciente_id = null }) {
    const url = apiUrl + '/horarios-disponibles';
    const fullUrl = url;
    return tmApp.fetchPublicData(fullUrl, {
      method: 'POST',
      data: {
        fecha,
        servicio_id,
        empleado_id,
        paciente_id,
        empresa_id,
      },
    });
  },

  buildHorarioRowsHtml: function (slots = []) {
    let filas = '';

    slots.forEach((slot) => {
      if ((typeof slot.disponible !== 'undefined' && !slot.disponible) || slot.fuera_de_rango) {
        return;
      }

      const inicio = String(slot.inicio || '').substring(0, 5);
      const fin = String(slot.fin || '').substring(0, 5);

      filas += '<div class="horario hora" data-selected="false" data-daypart="morning" ' +
        `data-hora-servicio="${tmApp.escapeHtml(inicio)}" data-horafin-servicio="${tmApp.escapeHtml(fin)}" ` +
        'style="margin-top:20px;padding:15px;color:#000;">' +
        `<div class="time-slot-container"><div class="">${tmApp.escapeHtml(inicio)}</div></div>` +
        '</div>';
    });

    return filas;
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

  getAppointmentCenterName: function (appointment = {}) {
    const props = appointment.extendedProps || {};
    return props.empresa_razon_social || props.empresa || props.centro || appointment.empresa || 'No especificado';
  },

  getAppointmentAddress: function (appointment = {}) {
    const props = appointment.extendedProps || {};
    return props.direccion || appointment.direccion || '';
  },

  getAppointmentMapsEmbedUrl: function (appointment = {}) {
    const addressText = tmApp.getAppointmentAddress(appointment);
    if (!addressText) return '';
    return `https://www.google.com/maps?q=${encodeURIComponent(addressText)}&output=embed`;
  },

  getAppointmentCenterImage: function (appointment = {}) {
    const props = appointment.extendedProps || {};
    const image = props.empresa_imagen || props.empresa_imagen_url || props.imagen_empresa || props.logo_empresa || props.user_imagen || props.usuario_imagen || props.imagen || appointment.imagen || '';
    return tmApp.normalizeProfessionalImage(image);
  },

  getAppointmentDetailHtml: function (appointment = {}) {
    if (!appointment || !appointment.id) {
      return '<div class="block"><p class="vm-empty">No se ha encontrado la cita seleccionada.</p></div>';
    }

    const props = appointment.extendedProps || {};
    const centerName = tmApp.getAppointmentCenterName(appointment);
    const addressText = tmApp.getAppointmentAddress(appointment);
    const mapsEmbedUrl = tmApp.getAppointmentMapsEmbedUrl(appointment);
    const serviceName = appointment.title || props.servicio || 'Cita';
    const professionalName = props.empleado || '';
    const startTime = tmApp.formatTime(appointment.start);
    const noteText = String(props.nota || '').trim();
    const dateText = tmApp.formatDate(appointment.start);

    return `
      <div class="block vm-cita-detalle-top">
        <div class="vm-cita-detalle-datetime">${tmApp.escapeHtml(startTime)} - ${tmApp.escapeHtml(dateText)}</div>
      </div>

      <div class="card vm-cita-detalle-card">
        <div class="card-content card-content-padding">
          <div class="vm-cita-detalle-servicio">${tmApp.escapeHtml(String(serviceName).toUpperCase())}</div>
          ${professionalName ? `<div class="vm-cita-detalle-profesional">con ${tmApp.escapeHtml(professionalName)}</div>` : ''}
          ${noteText ? `<div class="vm-cita-detalle-extra">${tmApp.escapeHtml(noteText)}</div>` : ''}
        </div>
      </div>

      ${appointment.estado === 'activa' ? `
        <div class="block vm-cita-detalle-cancel-block">
          <a href="#" class="button button-outline color-red vm-cita-cancel-btn btnCancelar" data-clase="${tmApp.escapeHtml(appointment.id)}">
            <i class="icon f7-icons">xmark_circle</i>
            <span>Cancelar cita</span>
          </a>
        </div>
      ` : ''}

      <div class="card vm-cita-detalle-card">
        <div class="card-content card-content-padding">
          <div class="vm-cita-detalle-centro">${tmApp.escapeHtml(centerName)}</div>
          ${addressText ? `<div class="vm-cita-detalle-direccion">${tmApp.escapeHtml(addressText)}</div>` : ''}
        </div>
      </div>

      ${mapsEmbedUrl ? `
        <div class="vm-map-embed vm-map-embed-full">
          <iframe
            src="${mapsEmbedUrl}"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>
      ` : ''}

    `;
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

  cargarContenido: async function (funct, contenedor) {
    const target = document.querySelector(`.${contenedor}`);
    if (!target) return;

    target.innerHTML = '<div class="vm-loading">Cargando contenido...</div>';

    try {
      const response = await tmApp.getDynamicContent(funct);
      const contenido = response && response.contenido ? response.contenido : {};
      target.innerHTML = contenido.descripcion || '<p class="vm-empty">No hay contenido disponible.</p>';
    } catch (error) {
      target.innerHTML = `<p class="vm-empty">${tmApp.escapeHtml(tmApp.getApiErrorMessage(error, 'No se pudo cargar el contenido'))}</p>`;
    }
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

  formatTime: function (value) {
    if (!value) return '';

    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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
