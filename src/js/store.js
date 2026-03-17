import { createStore } from 'framework7';
import utils from './utils.js';

const store = createStore({
  state: {
    session: utils.getSession(),
  },
  getters: {
    isAuthenticated({ state }) {
      return Boolean(state.session.token);
    },
    currentUser({ state }) {
      return state.session.user;
    },
  },
  actions: {
    refreshSession({ state }) {
      state.session = utils.getSession();
    },
  },
});

export default store;
