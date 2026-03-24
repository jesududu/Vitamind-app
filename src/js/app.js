import $ from 'dom7';
import Framework7, { getDevice } from 'framework7/bundle';

import { PushNotifications } from '@capacitor/push-notifications';
import { Device as CapacitorDevice } from '@capacitor/device';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';

import 'framework7/css/bundle';

import '../css/icons.css';
import '../css/app.css';

import capacitorApp from './capacitor-app.js';
import routes from './routes.js';
import store from './store.js';
import App from '../app.f7';
import env from './env.js';
import utils from './utils.js';

var device = getDevice();
let pushSetupDone = false;

function initApp() {
  document.documentElement.style.setProperty('--vm-home-navbar-bg', '#f4934e');
  document.documentElement.style.setProperty('--vm-home-navbar-text', '#ffffff');

  var app = new Framework7({
    name: 'vitamind',
    theme: 'auto',
    colors: {
      primary: '#202020',
    },
    el: '#app',
    component: App,
    store,
    routes,
    input: {
      scrollIntoViewOnFocus: device.capacitor,
      scrollIntoViewCentered: device.capacitor,
    },
    statusbar: {
      iosOverlaysWebView: false,
      androidOverlaysWebView: false,
    },
  });

  app.on('pageInit', function () {
    updateStatusBarFromActiveView();

    var authToken = localStorage.getItem(utils.storageKeys.token);
    if (authToken) {
      utils.refreshCurrentUser().catch(function () {
        // Mantenemos la sesion local aunque falle el refresco remoto.
      });
      safeRun(function () {
        setupPushNotifications(app);
      }, 'push-pageinit');
    }
  });

  app.on('pageAfterIn', function () {
    updateStatusBarFromActiveView();
  });

  app.on('init', function () {
    var f7 = this;

    utils.init(f7);

    if (f7.device.capacitor) {
      try {
        capacitorApp.init(f7);
      } catch (error) {
        console.error('Error inicializando capacitorApp:', error);
      }

      safeInitNativeFeatures(f7);

      var authTokenOnInit = localStorage.getItem(utils.storageKeys.token);
      if (authTokenOnInit) {
        safeRun(function () {
          setupPushNotifications(f7);
        }, 'push-init');
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('VitaMind app inicializada con API:', env.apiUrl);
    }

    document.addEventListener('deviceready', function () {
      var authToken = localStorage.getItem(utils.storageKeys.token);
      if (authToken) {
        utils.refreshCurrentUser().catch(function () {
          // No bloqueamos la app si falla.
        });
      } else {
        f7.preloader.hide();
      }
    });

    document.addEventListener('resume', function () {
      var currentView = f7.views.current;
      var authToken = localStorage.getItem(utils.storageKeys.token);

      if (authToken && currentView && currentView.router && currentView.router.currentRoute) {
        currentView.router.navigate(currentView.router.currentRoute.url, {
          ignoreCache: true,
          reloadCurrent: true,
        });
      }
    });

    document.addEventListener('pause', function () {
      // Reservado para logica futura.
    }, false);

    $('#btnHome').off('click.vitamind').on('click.vitamind', function () {
      var view = f7.views.get('#view-home');
      if (view && view.router) {
        view.router.navigate('/cli/', {
          ignoreCache: true,
          reloadCurrent: true,
        });
      }
    });

    $('#btnBusqueda').off('click.vitamind').on('click.vitamind', function () {
      var view = f7.views.get('#view-busqueda');
      if (view && view.router) {
        view.router.navigate('/search/', {
          ignoreCache: true,
          reloadCurrent: true,
        });
      }
    });

    $('#btnCitas').off('click.vitamind').on('click.vitamind', function () {
      var view = f7.views.get('#view-citas');
      if (view && view.router) {
        view.router.navigate('/citas/', {
          ignoreCache: true,
          reloadCurrent: true,
        });
      }
    });

    $('#btnCuenta').off('click.vitamind').on('click.vitamind', function () {
      var view = f7.views.get('#view-settings');
      if (view && view.router) {
        view.router.navigate('/cli/settings/', {
          ignoreCache: true,
          reloadCurrent: true,
        });
      }
    });
  });

  $(document).on('click', 'a[href="#"]', function (event) {
    var hasId = this.id && this.id.length > 0;
    var hasActionRole = this.classList.contains('link') || this.classList.contains('button');
    if (hasActionRole || hasId) {
      event.preventDefault();
    }
  });

  return app;
}

function updateStatusBarFromActiveView() {
  var activeEl = document.querySelector('.view.tab.tab-active');
  if (!activeEl) return;

  var view = activeEl.f7View;
  if (!view || !view.router || !view.router.currentRoute) return;

  var routeUrl = view.router.currentRoute.url || '';
  var routeName = view.router.currentRoute.name || '';

  if (routeUrl === '/cli/' || routeUrl === '/search/' || routeName === 'home' || routeName === 'search') {
    setupStatusBar(routeName || routeUrl);
  } else {
    setupStatusBar('default');
  }
}

function safeInitNativeFeatures(f7) {
  safeRun(function () {
    initNetworkListener(f7);
  }, 'network');

  safeRun(function () {
    checkPushNotificationPermission();
  }, 'push-permissions');
}

function safeRun(fn, label) {
  try {
    var result = fn();
    if (result && typeof result.catch === 'function') {
      result.catch(function (error) {
        console.error('Error en ' + label + ':', error);
      });
    }
  } catch (error) {
    console.error('Error en ' + label + ':', error);
  }
}

async function setupStatusBar(origen) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });

    var color = '#F7F7F7';
    var style = Style.Dark;

    if (origen === 'home' || origen === '/cli/' || origen === 'search' || origen === '/search/') {
      color = '#f4934e';
      style = Style.Light;
    }

    await StatusBar.setBackgroundColor({ color: color });
    await StatusBar.setStyle({ style: style });
    SplashScreen.hide();
  } catch (error) {
    console.error('Error configurando StatusBar:', error);
  }
}

function handleOffline(app) {
  console.log('Conexion perdida');
  app.preloader.hide();
}

function handleOnline(app) {
  console.log('Conexion restaurada');
}

function initNetworkListener(app) {
  Network.addListener('networkStatusChange', function (status) {
    if (!status.connected) {
      handleOffline(app);
    } else {
      handleOnline(app);
    }
  });

  Network.getStatus().then(function (status) {
    if (!status.connected) {
      handleOffline(app);
    }
  });
}

async function checkPushNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (!PushNotifications || typeof PushNotifications.checkPermissions !== 'function') {
      return;
    }

    var permissionStatus = await PushNotifications.checkPermissions();

    if (permissionStatus.receive !== 'granted') {
      await PushNotifications.requestPermissions();
    }
  } catch (error) {
    console.error('Error verificando permisos de notificaciones:', error);
  }
}

async function setupPushNotifications(app) {
  if (!Capacitor.isNativePlatform()) return;
  if (pushSetupDone) {
    var existingToken = localStorage.getItem('vitamind_registration_id');
    if (existingToken) {
      await registerPushToken(existingToken);
    }
    return;
  }

  pushSetupDone = true;

  PushNotifications.addListener('registration', function (token) {
    localStorage.setItem('vitamind_registration_id', token.value);
    registerPushToken(token.value).catch(function (error) {
      console.error('Error guardando token push en backend:', error);
    });
  });

  PushNotifications.addListener('registrationError', function (error) {
    console.error('Error en el registro de notificaciones:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', function (notification) {
    console.log('Notificacion recibida:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', function () {
    var view = app.views.current;
    if (view && view.router) {
      view.router.navigate('/notificaciones/');
    }
  });

  try {
    await PushNotifications.register();
    var storedToken = localStorage.getItem('vitamind_registration_id');
    if (storedToken) {
      await registerPushToken(storedToken);
    }
  } catch (error) {
    console.error('Error al registrar notificaciones push:', error);
  }
}

if (typeof window !== 'undefined') {
  window.vitaMindSetupPushNotifications = setupPushNotifications;
}

async function registerPushToken(tokenValue) {
  var authToken = localStorage.getItem(utils.storageKeys.token);
  if (!authToken || !tokenValue) return;

  try {
    var info = await CapacitorDevice.getInfo();
    await utils.registerDevice({
      regid: tokenValue,
      device: info.name || info.model || 'device',
      modelo: info.model || '',
      platform: info.platform || Capacitor.getPlatform(),
      version: info.osVersion || info.operatingSystem || '',
      manufacturer: info.manufacturer || '',
    });
  } catch (error) {
    console.error('Error registrando dispositivo en backend:', error);
  }
}

initApp();
