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
    name: 'VitaMind',
    theme: 'auto',
    colors: {
      primary: '#f4934e',
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

  app.on('init', function () {
    var f7 = this;

    if (f7.device.capacitor) {
      capacitorApp.init(f7);
    }

    utils.init(f7);

    if (process.env.NODE_ENV !== 'production') {
      console.log('VitaMind app inicializada con API:', env.apiUrl);
    }
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
