import HomePage from '../pages/home.f7';
import SearchPage from '../pages/search.f7';
import ProfesionalPage from '../pages/profesional.f7';
import ReservarPage from '../pages/reservar.f7';
import ConfirmarReservaPage from '../pages/confirmar_reserva.f7';
import CitasPage from '../pages/citas.f7';
import CitaDetallePage from '../pages/cita_detalle.f7';
import SettingsPage from '../pages/settings.f7';
import LoginPage from '../pages/login.f7';
import RegistroPage from '../pages/registro.f7';
import ForgotPasswordPage from '../pages/forgot_password.f7';
import EditarPerfilPage from '../pages/editar_perfil.f7';
import CambiarPassPage from '../pages/cambiar_pass.f7';
import FavoritosPage from '../pages/favoritos.f7';
import NotificacionesPage from '../pages/notificaciones.f7';
import NotificacionPage from '../pages/notificacion.f7';
import TerminosPage from '../pages/terminos.f7';
import NormasPage from '../pages/normas.f7';
import InfoPage from '../pages/info.f7';
import NotFoundPage from '../pages/404.f7';

const routes = [
  { path: '/', redirect: '/home/' },
  { path: '/home/', component: HomePage },
  { path: '/search/', component: SearchPage },
  { path: '/profesional/:token/', component: ProfesionalPage },
  { path: '/reservar/:token/', component: ReservarPage },
  { path: '/confirmar-reserva/', component: ConfirmarReservaPage },
  { path: '/citas/', component: CitasPage },
  { path: '/cita-detalle/:id/', component: CitaDetallePage },
  { path: '/settings/', component: SettingsPage },
  { path: '/login/', component: LoginPage },
  { path: '/registro/', component: RegistroPage },
  { path: '/forgot-password/', component: ForgotPasswordPage },
  { path: '/editar-perfil/', component: EditarPerfilPage },
  { path: '/cambiar-pass/', component: CambiarPassPage },
  { path: '/favoritos/', component: FavoritosPage },
  { path: '/notificaciones/', component: NotificacionesPage },
  { path: '/notificacion/:id/', component: NotificacionPage },
  { path: '/terminos/', component: TerminosPage },
  { path: '/normas/', component: NormasPage },
  { path: '/info/', component: InfoPage },
  { path: '(.*)', component: NotFoundPage },
];

export default routes;
