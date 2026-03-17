import HomePage from '../pages/home.f7';
import SearchPage from '../pages/search.f7';
import ProfesionalPage from '../pages/profesional.f7';
import CitasPage from '../pages/citas.f7';
import SettingsPage from '../pages/settings.f7';
import LoginPage from '../pages/login.f7';
import RegistroPage from '../pages/registro.f7';
import ForgotPasswordPage from '../pages/forgot_password.f7';
import NotFoundPage from '../pages/404.f7';

const routes = [
  { path: '/', redirect: '/home/' },
  { path: '/home/', component: HomePage },
  { path: '/search/', component: SearchPage },
  { path: '/profesional/:token/', component: ProfesionalPage },
  { path: '/citas/', component: CitasPage },
  { path: '/settings/', component: SettingsPage },
  { path: '/login/', component: LoginPage },
  { path: '/registro/', component: RegistroPage },
  { path: '/forgot-password/', component: ForgotPasswordPage },
  { path: '(.*)', component: NotFoundPage },
];

export default routes;
