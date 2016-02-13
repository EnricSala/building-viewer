angular
  .module('app.controllers')
  .controller('MainController', MainController);

function MainController($scope, Models, Metrics) {

  $scope.model = {};
  $scope.metrics = {};

  Models.load('gaia-p1').then(function(model) {
    console.log('Controller loaded model: ' + model.name);
    $scope.model = model;
    var metricIds = model.objects.map(function(obj) {
      return obj.sensorId;
    });
    return Metrics.current(metricIds);
  }).then(function(metrics) {
    console.log('Controller loaded metrics');
    $scope.metrics = metrics;
  });

}
