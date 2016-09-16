class Metrics {

  constructor($http) {
    this.$http = $http;
  }

  current(metricIds) {
    return this.$http
      .post('/api/metrics/current', { metricIds })
      .then(res => res.data);
  }

}

Metrics.$inject = ['$http'];
export default Metrics;
