class MainController {

  constructor(Models) {
    this.Models = Models;
    this.model = {};
  }

  $onInit() {
    this.Models.load('gaia-p1')
      .then(model => {
        console.log(`Loaded model: ${model.name}`);
        this.model = model;
      });
  }

}

MainController.$inject = ['Models'];
export default MainController;
