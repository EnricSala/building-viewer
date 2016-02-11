angular
  .module('app.controllers')
  .controller('MainController', MainController);

function MainController($scope, Metrics) {

  var metricIds = ['patata', 'catsup'];

  Metrics.current(metricIds).then(function(data) {
    console.log('Read metrics: ' + JSON.stringify(data));
  });

}
