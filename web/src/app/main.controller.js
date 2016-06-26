export default class MainController {

  constructor(Models, Metrics) {
    this.model = {};
    this.metrics = {};

    Models.load('gaia-p1')
      .then(model => {
        console.log('Loaded model');
        this.model = model;
        const sensorIds = model.objects
          .map(obj => obj.sensorId)
          .filter(id => id);
        return Metrics.current(sensorIds);
      })
      .then(
        metrics => this.metrics = metrics,
        err => console.error(`Init failed: ${err.data}`));
  }

}
