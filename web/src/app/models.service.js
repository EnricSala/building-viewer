class Models {

  constructor($http) {
    this.$http = $http;
  }

  load(name) {
    const path = `/models/${name}.json`;
    console.log(`Loading model from: ${path}`);
    return this.$http.get(path)
      .then(res => {
        var model = res.data;
        console.log(`Loaded model with name: ${model.name}`);
        return model;
      });
  }

}

Models.$inject = ['$http'];
export default Models;
