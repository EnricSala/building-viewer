angular
  .module('app.controllers')
  .controller('MainController', MainController);

function MainController($scope, Models, Metrics) {

  $scope.model = {};
  $scope.metrics = {};

  Models.load('gaia-p1').then(function(model) {
    console.log('Controller loaded model: ' + model.name);
    $scope.model = model;
    var sensorIds = getSensorIdList(model);
    return Metrics.current(sensorIds);
  }).then(function(metrics) {
    console.log('Controller loaded metrics');
    $scope.metrics = metrics;
  });

  function getSensorIdList(model) {
    return model.objects
      .map(function(obj) {
        return obj.sensorId;
      })
      .filter(function(sensorId) {
        return sensorId;
      });
  }

}
