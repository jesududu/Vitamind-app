import $ from 'dom7';
import Framework7, { getDevice } from 'framework7/bundle';

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

function initApp() {
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
      iosOverlaysWebView: true,
      androidOverlaysWebView: false,
    },
  });

  app.on('pageInit', function () {
    var authToken = localStorage.getItem(utils.storageKeys.token);
    if (authToken) {
      utils.refreshCurrentUser().catch(function () {
        // Si falla, seguimos mostrando la app con la sesion local.
      });
    }
  });

  app.on('init', function () {
    var f7 = this;

    if (f7.device.capacitor) {
      capacitorApp.init(f7);
    }

    utils.init(f7);

    if (process.env.NODE_ENV !== 'production') {
      console.log('VitaMind app inicializada con API:', env.apiUrl);
    }

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
    const hasId = this.id && this.id.length > 0;
    const hasActionRole = this.classList.contains('link') || this.classList.contains('button');
    if (hasActionRole || hasId) {
      event.preventDefault();
    }
  });

  return app;
}

initApp();
