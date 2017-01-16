import Rainbow from 'rainbowvis.js';

class Colors {

  constructor() {
    this.gradients = {};
  }

  create(name, min, max, spectrum) {
    console.log(`Creating rainbow: ${name}, ${min}, ${max}, ${spectrum}`);
    const rainbow = new Rainbow();
    rainbow.setSpectrum(...spectrum);
    rainbow.setNumberRange(min, max);
    this.gradients[name] = rainbow;
    return rainbow;
  }

  getRainbow(name) {
    return this.gradients[name];
  }

}

Colors.$inject = [];
export default Colors;
