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

      // Create color gradients
      for (let prop in model.sensors) {
        let s = model.sensors[prop];
        this.Colors.create(prop, s.min, s.max, s.spectrum);
      }
      const min = model.sensors['temperature'].min;
      const max = model.sensors['temperature'].max;
      const temperatureColors = [];
      for (let i = Math.floor(min); i <= Math.ceil(max); i++) {
        const colorStr = this.Colors.getRainbow('temperature').colorAt(i);
        temperatureColors.push({
          val: i,
          style: { 'background-color': `#${colorStr}` }
        });
      }
      this.colors = temperatureColors;
      this.colors.min = min;
      this.colors.max = max;
      this.model = model;
    });

    // Add clock
    const updateClock = () => this.clock = moment().format('HH:mm');
    updateClock();
    this.$interval(updateClock, 1000);
  }

}

MainController.$inject = ['$interval', 'Models', 'Colors'];
export default MainController;
