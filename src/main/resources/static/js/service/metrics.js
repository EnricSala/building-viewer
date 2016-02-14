angular
  .module('app.services')
  .factory('Metrics', MetricsService);

function MetricsService($http) {

  return {
    current: queryCurrentValues,
    history: queryHistoricValues
  };

  function queryCurrentValues(metricIds) {
    var query = {
      metricIds: metricIds
    };
    return $http.post('/api/metrics/current', query)
      .then(function(response) {
        var metrics = response.data;
        return metrics;
      }, function(err) {
        console.log('Error reading current metrics!');
      });
  };

  function queryHistoricValues(metricIds, range) {
    var query = {
      metricIds: metricIds,
      after: range.after,
      before: range.before
    };
    return $http.post('/api/metrics/historic', query)
      .then(function(response) {
        var metrics = response.data;
        return metrics;
      }, function(err) {
        console.log('Error reading historic metrics!');
      });
  };

}

// "camera": {
//   "pos": {
//     "x": 425,
//     "y": -500,
//     "z": 700
//   },
//   "lookAt": {
//     "x": 425,
//     "y": 200,
//     "z": 0
//   }
// }
