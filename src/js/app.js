import Framework7, { getDevice } from 'framework7/bundle';

import 'framework7/css/bundle';

import '../css/icons.css';
import '../css/app.css';

import capacitorApp from './capacitor-app.js';
import routes from './routes.js';
import store from './store.js';
import App from '../app.f7';

const device = getDevice();

new Framework7({
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
  on: {
    init() {
      if (this.device.capacitor) {
        capacitorApp.init(this);
      }
    },
  },
});
