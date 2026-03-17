import utils from './utils.js';

import HomePage from '../pages/home.f7';
import SettingsPage from '../pages/settings.f7';

import NotificacionesPage from '../pages/notificaciones.f7';
import NotificacionPage from '../pages/notificacion.f7';

import CitasPage from '../pages/citas.f7';
import CitaDetallePage from '../pages/cita_detalle.f7';

import SearchPage from '../pages/search.f7';
import ProfesionalPage from '../pages/profesional.f7';
import ReservarPage from '../pages/reservar.f7';
import ConfirmarReservaPage from '../pages/confirmar_reserva.f7';

import EditarPerfilPage from '../pages/editar_perfil.f7';
import CambiarPassPage from '../pages/cambiar_pass.f7';
import FavoritosPage from '../pages/favoritos.f7';

import LoginPage from '../pages/login.f7';
import RegistroPage from '../pages/registro.f7';
import ForgotPasswordPage from '../pages/forgot_password.f7';

import NormasPage from '../pages/normas.f7';
import TerminosPage from '../pages/terminos.f7';
import InfoPage from '../pages/info.f7';

import NotFoundPage from '../pages/404.f7';

function requireAuth(to, from, resolve, reject) {
  if (utils.isAuthenticated()) {
    resolve();
    return;
  }

  reject();
  const redirect = encodeURIComponent(to.url || '/home/');
  window.location.hash = `#/login/?redirect=${redirect}`;
}

function requireGuest(to, from, resolve, reject) {
  if (!utils.isAuthenticated()) {
    resolve();
    return;
  }

  reject();
  window.location.hash = '#/home/';
}

var routes = [
  { path: '/', redirect: '/home/' },
  {
    path: '/home/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/settings/',
    name: 'settings',
    component: SettingsPage,
    beforeEnter: requireAuth,
  },

  {
    path: '/notificaciones/',
    name: 'notificaciones',
    component: NotificacionesPage,
    beforeEnter: requireAuth,
  },
  {
    path: '/notificacion/:id/',
    name: 'notificacion',
    component: NotificacionPage,
    beforeEnter: requireAuth,
  },

  {
    path: '/citas/',
    name: 'citas',
    component: CitasPage,
    beforeEnter: requireAuth,
  },
  {
    path: '/cita-detalle/:id/',
    name: 'detalle_cita',
    component: CitaDetallePage,
    beforeEnter: requireAuth,
  },

  {
    path: '/search/',
    name: 'search',
    component: SearchPage,
  },
  {
    path: '/profesional/:token/',
    name: 'detalle_profesional',
    component: ProfesionalPage,
  },
  {
    path: '/reservar/:token/',
    name: 'reservar',
    component: ReservarPage,
    beforeEnter: requireAuth,
  },
  {
    path: '/confirmar-reserva/',
    name: 'confirmar_reserva',
    component: ConfirmarReservaPage,
    beforeEnter: requireAuth,
  },

  {
    path: '/editar-perfil/',
    name: 'editar_perfil',
    component: EditarPerfilPage,
    beforeEnter: requireAuth,
  },
  {
    path: '/cambiar-pass/',
    name: 'cambiar_pass',
    component: CambiarPassPage,
    beforeEnter: requireAuth,
  },
  {
    path: '/favoritos/',
    name: 'favoritos',
    component: FavoritosPage,
    beforeEnter: requireAuth,
  },

  {
    path: '/login/',
    name: 'login',
    component: LoginPage,
    beforeEnter: requireGuest,
  },
  {
    path: '/registro/',
    name: 'registro',
    component: RegistroPage,
    beforeEnter: requireGuest,
  },
  {
    path: '/forgot-password/',
    name: 'forgot_password',
    component: ForgotPasswordPage,
    beforeEnter: requireGuest,
  },

  {
    path: '/normas/',
    name: 'normas',
    component: NormasPage,
  },
  {
    path: '/terminos/',
    name: 'terminos',
    component: TerminosPage,
  },
  {
    path: '/info/',
    name: 'info',
    component: InfoPage,
  },
  { path: '(.*)', component: NotFoundPage },
];

export default routes;
