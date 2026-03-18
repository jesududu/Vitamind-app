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

var routes = [
  {
    path: '/',
    redirect: '/cli/',
  },
  {
    path: '/cli/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/cli/settings/',
    name: 'settings',
    component: SettingsPage,
  },

  {
    path: '/home/',
    redirect: '/cli/',
  },
  {
    path: '/settings/',
    redirect: '/cli/settings/',
  },

  {
    path: '/notificaciones/',
    name: 'notificaciones',
    component: NotificacionesPage,
  },
  {
    path: '/notificacion/:id/',
    name: 'notificacion',
    component: NotificacionPage,
  },

  {
    path: '/citas/',
    name: 'citas',
    component: CitasPage,
  },
  {
    path: '/cita-detalle/:id/',
    name: 'detalle_cita',
    component: CitaDetallePage,
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
  },
  {
    path: '/confirmar-reserva/',
    name: 'confirmar_reserva',
    component: ConfirmarReservaPage,
  },

  {
    path: '/editar-perfil/',
    name: 'editar_perfil',
    component: EditarPerfilPage,
  },
  {
    path: '/cambiar-pass/',
    name: 'cambiar_pass',
    component: CambiarPassPage,
  },
  {
    path: '/favoritos/',
    name: 'favoritos',
    component: FavoritosPage,
  },

  {
    path: '/login/',
    name: 'login',
    component: LoginPage,
  },
  {
    path: '/registro/',
    name: 'registro',
    component: RegistroPage,
  },
  {
    path: '/forgot-password/',
    name: 'forgot_password',
    component: ForgotPasswordPage,
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
