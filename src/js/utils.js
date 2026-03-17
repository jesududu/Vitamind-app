import env from './env.js';

export const storageKeys = {
  token: 'sanctum_token',
  pacienteId: 'paciente_id',
  user: 'vitamind_datos_usu',
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

export async function fetchAPI(endpoint, options = {}) {
  const {
    method = 'GET',
    data = null,
    auth = true,
    isFormData = false,
  } = options;

  const session = getSession();
  const headers = {
    Accept: 'application/json',
  };

  if (auth && session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const config = { method, headers };
  let url = `${env.apiUrl}${endpoint}`;

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

  const response = await fetch(url, config);
  const raw = await response.text();

  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch (error) {
    payload = { message: raw || 'Respuesta no válida del servidor' };
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

export function getCurrentUser() {
  return fetchAPI('/user');
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
  return fetchAPI('/ultimos-profesionales', { auth: false });
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

export function getProfessionalProfile(token) {
  return fetchAPI(`/profesional/${token}`, { auth: false });
}

export function getMyAppointments(params = {}) {
  return fetchAPI('/mis-citas', { data: params });
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
