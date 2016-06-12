import angular from 'angular';

import MainController from './main.controller.js';
import Metrics from './metrics.service.js';
import Models from './models.service.js';
import Building from './building.directive.js';

import '../style/app.css';

const MODULE_NAME = 'app';

angular
  .module(MODULE_NAME, [])
  .service('Models', Models)
  .service('Metrics', Metrics)
  .directive('building', () => new Building)
  .directive('app', () => ({
    template: require('./app.html'),
    controller: MainController,
    controllerAs: 'app'
  }));

export default MODULE_NAME;
