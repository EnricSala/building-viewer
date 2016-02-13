angular
  .module('app.services')
  .factory('Models', ModelsService);

function ModelsService($http) {

  return {
    load: loadModel
  };

  function loadModel(name) {
    var filename = name + '.json';
    return $http.get('/layers/' + filename)
      .then(function(response) {
        var model = response.data;
        console.log('Loaded model: ' + model.name);
        return model;
      }, function(err) {
        console.log('Error loading model: ' + filename);
      });
  };

}
