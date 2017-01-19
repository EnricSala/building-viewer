import moment from 'moment';

class MainController {

  constructor($interval, Models, Colors) {
    this.Models = Models;
    this.Colors = Colors;
    this.model = {};
    this.$interval = $interval;
  }

  $onInit() {
    this.Models.load('gaia').then(model => {
      console.log(`Loaded model: ${model.name}`);
      this.model = model;

      // Create color gradients
      for (let prop in model.sensors) {
        let s = model.sensors[prop];
        this.Colors.create(prop, s.min, s.max, s.spectrum);
      }

      // Configure the legend
      this.configureLegendFor('temperature');
    });

    // Add clock
    const updateClock = () => this.clock = moment().format('HH:mm');
    updateClock();
    this.$interval(updateClock, 1000);
  }

  configureLegendFor(sensor) {
    const config = this.model.sensors[sensor];
    const rainbow = this.Colors.getRainbow(sensor);

    const min = Math.floor(config.min);
    const max = Math.ceil(config.max);
    const colors = [];
    for (let i = min; i <= max; i++) {
      const colorStr = '#' + rainbow.colorAt(i);
      colors.push({ val: i, style: { 'background-color': colorStr } });
    }

    this.legend = {};
    this.legend.colors = colors;
    this.legend.label = config.label;
    this.legend.units = config.units;
    this.legend.max = max;
    this.legend.min = min;
  }

}

MainController.$inject = ['$interval', 'Models', 'Colors'];
export default MainController;
