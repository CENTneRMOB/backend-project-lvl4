// @ts-check

import i18next from 'i18next';
import _ from 'lodash';

const Rollbar = require('rollbar');

export default (app) => ({
  route(name, obj = {}) {
    return app.reverse(name, obj);
  },
  t(key) {
    return i18next.t(key);
  },
  _,
  getAlertClass(type) {
    switch (type) {
      // case 'failure':
      //   return 'danger';
      case 'error':
        return 'danger';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        throw new Error(`Unknown flash type: '${type}'`);
    }
  },
  formatDate(str) {
    const date = new Date(str);
    return date.toLocaleString();
  },
  logger(message) {
    const rollbar = new Rollbar({
      accessToken: process.env.ROLLBAR_KEY,
      captureUncaught: true,
      captureUnhandledRejections: true,
    });

    rollbar.log(message);
  },
});
