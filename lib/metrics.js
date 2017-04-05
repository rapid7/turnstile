'use strict';

const StatsD = require('hot-shots');

global.Metrics = new StatsD(Object.assign({}, Config.get('metrics:client'), {
  errorHandler: (error) => {
    Log.error(error);
  },
  mock: !Config.get('metrics:enabled')
}));
