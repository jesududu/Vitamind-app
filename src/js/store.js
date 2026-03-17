import { createStore } from 'framework7';
import { getSession } from './utils.js';

const store = createStore({
  state: {
    session: getSession(),
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
      state.session = getSession();
    },
  },
});

export default store;
