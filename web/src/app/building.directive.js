import THREE from 'three';
import TWEEN from 'tween.js';
import SunCalc from 'suncalc';

require('./ext/AMFLoader.js');
require('./ext/SkyShader.js');

class Building {

  constructor() {
    this.restrict = 'E';
    this.scope = { model: '=' };
  }

  link(scope, element, attrs) {
    console.log("Linking Building directive");
    init(element);
    animate();

    scope.$watch('model', () => drawModel(scope.model));
  }

  controller(Metrics, Colors) {
    console.log("Starting Controller for Building directive");
    metricsService = Metrics;
    colorsService = Colors;
  }

}

let metricsService, colorsService;
let camera, scene, renderer;
let dirLight, hemiLight;
let sky, sunSphere;

const buildingX = 29.8 * 2;
const buildingZ = 17.5 * 2;

const cameraTarget = new THREE.Vector3(buildingX / 2, 12, -buildingZ / 2);
let cameraDistance = 60;
let cameraDistanceX = cameraDistance;
let cameraDistanceZ = cameraDistance;

const defaultColor = new THREE.Color(0.7, 0.7, 0.7);
const structureColor = new THREE.Color(0.5, 0.5, 0.5);

// Sample coordinates to calculate Sun position
const SUN_LAT = 41.562533;
const SUN_LNG = 2.020699;

function init(element) {
  // Scene
  scene = new THREE.Scene();

  // Camera
  const aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(40, aspectRatio, 10, 2000000);
  camera.up.set(0, 1, 0);
  scene.add(camera);

  // Hemisphere light
  hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.4);
  hemiLight.color.setRGB(0.1, 0.1, 0.1);
  hemiLight.groundColor.setRGB(1, 1, 1);
  hemiLight.position.set(0, 0, 0);
  scene.add(hemiLight);

  // Sunlight
  dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setRGB(1, 1, 1); // (0.21, 1, 0.8)
  dirLight.position.set(0, -1, 0);
  dirLight.position.multiplyScalar(50);
  dirLight.castShadow = true;
  dirLight.shadowMapWidth = 2048;
  dirLight.shadowMapHeight = 2048;
  let d = 50;
  dirLight.shadowCameraLeft = -d;
  dirLight.shadowCameraRight = d;
  dirLight.shadowCameraTop = d;
  dirLight.shadowCameraBottom = -d;
  dirLight.shadowCameraFar = 300;
  dirLight.shadowBias = -0.0001;
  dirLight.shadowCameraVisible = true;
  scene.add(dirLight);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  // renderer.setClearColor(scene.fog.color);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.gammaInput = false;
  renderer.gammaOutput = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMapSoft = true;

  // Init Sky Shader
  initSky();

  // Add the renderer to the DOM
  element[0].appendChild(renderer.domElement);
}

function initSky() {
  // Add Sky Mesh
  sky = new THREE.Sky();
  scene.add(sky.mesh);

  // Add Sun Helper
  sunSphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(20000, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  sunSphere.position.y = -700000;
  sunSphere.visible = false;
  scene.add(sunSphere);

  // GUI
  var effectController = {
    turbidity: 10,
    reileigh: 2,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    luminance: 1,
    inclination: 0.1, // elevation / inclination
    azimuth: 0.2, // Facing front
    sun: true
  };
  var distance = 400000;

  function guiChanged() {
    var uniforms = sky.uniforms;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.reileigh.value = effectController.reileigh;
    uniforms.luminance.value = effectController.luminance;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;
    var theta = Math.PI * (effectController.inclination - 0.5);
    var phi = 2 * Math.PI * (effectController.azimuth - 0.5);

    updateSkyPosition(theta, phi);
    updateSunlight();
  }

  function updateSkyPosition(phi, theta) {
    sunSphere.position.x = distance * Math.cos(phi);
    sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
    sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);
    sunSphere.visible = effectController.sun;
    sky.uniforms.sunPosition.value.copy(sunSphere.position);
  }

  function updateSunlight() {
    let x, y, z;
    x = sunSphere.position.x - cameraTarget.x;
    y = sunSphere.position.y - cameraTarget.y;
    z = sunSphere.position.z - cameraTarget.z;
    let mod = Math.sqrt(x * x + y * y + z * z);
    dirLight.position.set(x / mod, y / mod, z / mod);
  }

  var gui = new dat.GUI();
  gui.close();
  gui.add(effectController, "turbidity", 1.0, 20.0, 0.1).onChange(guiChanged);
  gui.add(effectController, "reileigh", 0.0, 4, 0.001).onChange(guiChanged);
  gui.add(effectController, "mieCoefficient", 0.0, 0.1, 0.001).onChange(guiChanged);
  gui.add(effectController, "mieDirectionalG", 0.0, 1, 0.001).onChange(guiChanged);
  gui.add(effectController, "luminance", 0.0, 2).onChange(guiChanged);
  gui.add(effectController, "inclination", 0, 1, 0.0001).onChange(guiChanged);
  gui.add(effectController, "azimuth", 0, 1, 0.0001).onChange(guiChanged);
  gui.add(effectController, "sun").onChange(guiChanged);
  guiChanged();

  // Update sun position
  const time = new Date();
  const sunPosition = SunCalc.getPosition(time, SUN_LAT, SUN_LNG);
  const inclination = sunPosition.altitude;
  const azimuth = sunPosition.azimuth + Math.PI / 2;
  console.log(`Sun incl/az is: ${inclination} / ${azimuth}`);
  updateSkyPosition(inclination, azimuth);
  updateSunlight();
}

function animate() {
  requestAnimationFrame(animate);
  render();
  TWEEN.update();
}

function render() {
  const timer = -Date.now() * 0.0002;
  camera.position.x = Math.cos(timer) * cameraDistanceX + cameraTarget.x;
  camera.position.z = Math.sin(timer) * cameraDistanceZ + cameraTarget.z;
  updateViewPoint();
  renderer.render(scene, camera);
}

function updateViewPoint() {
  const currentFloor = 1;
  const floorHeight = 4;
  cameraDistanceX = currentFloor > 1 ? 50 : 60;
  cameraDistanceZ = currentFloor > 1 ? 50 : 60;
  cameraTarget.x = currentFloor > 1 ? buildingX / 2 - 3.5 : buildingX / 2;
  cameraTarget.y = floorHeight * (currentFloor - 1);
  cameraTarget.z = currentFloor > 1 ? -27.5 : -buildingZ / 2;
  camera.position.y = cameraTarget.y + floorHeight * 4 + 4;
  camera.lookAt(cameraTarget);
}

function drawModel(model) {
  if (!model.name) return;
  console.log('Redrawing model: ' + model.name);

  const loader = new THREE.AMFLoader();
  loader.load(`./models/${model.file}`, amfModel => {

    // Fix rotation and add the model
    amfModel.rotation.x = -Math.PI / 2;
    scene.add(amfModel);

    // Configure default colors
    amfModel.children.forEach(part => {
      part.children.forEach(body => {
        body.material.transparent = true;
        body.material.opacity = 0.2;
        body.material.color.set(defaultColor);
      });
    });

    // Configure the base
    const base = findByName(amfModel, 'contorn_N1');
    base.children.forEach(body => {
      body.material.transparent = true;
      body.material.opacity = 1;
      body.material.color.set(structureColor);
    });

    // Configure the structure
    const floors = findByRegex(amfModel, /^estructura_terra/);
    floors.forEach(part => {
      part.children.forEach(body => {
        body.material.transparent = true;
        body.material.opacity = 1;
        body.material.color.set(structureColor);
      });
    });

    // Use metrics to color parts of the model
    colorUsingSensor(model, amfModel, 'temperature');
    colorUsingSensor(model, amfModel, 'solar');

    // Get reference to objects for animation
    const elevator = findByName(amfModel, 'ascensor_0');
    elevator.children.forEach(body => {
      body.material.opacity = 0.9;
      body.material.color.set(defaultColor);
    });

    // Define elevator animations
    const goP1 = new TWEEN.Tween(elevator.position)
      .to({ z: 12 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut);
    const goP2 = new TWEEN.Tween(elevator.position)
      .to({ z: 8 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut);
    const goP3 = new TWEEN.Tween(elevator.position)
      .to({ z: 16.1 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut);
    const goP0 = new TWEEN.Tween(elevator.position)
      .to({ z: 0 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    // Chain elevator animations in infinite loop
    goP0.chain(goP1);
    goP1.chain(goP2);
    goP2.chain(goP3);
    goP3.chain(goP0);
  });
}

function findByName(amfModel, name) {
  return amfModel.children.filter(it => it.name === name)[0];
}

function findByRegex(amfModel, expression) {
  return amfModel.children.filter(it => expression.test(it.name));
}

function loadMetrics(amfModel, sensor) {
  let metricIds = amfModel.objects.map(obj => obj.sensors[sensor]);
  return metricsService.current(metricIds);
}

function colorUsingSensor(model, amfModel, sensor) {
  loadMetrics(model, sensor).then(
    metrics => {
      console.log(`Loaded metrics: ${JSON.stringify(metrics)}`);
      applyMetrics(model, amfModel, sensor, metrics);
    },
    err => {
      console.error(`Error loading current metrics: ${err.data.message}`);
    }
  );
}

function applyMetrics(model, amfModel, sensor, metrics) {
  if (!metrics.points) return;
  console.log(`Applying ${sensor} metrics`);
  model.objects.forEach(obj => {
    const part = findByName(amfModel, obj.partId);
    part.children.forEach(body => {
      const point = metrics.points[obj.sensors[sensor]];
      if (point) {
        const color = metricToColor(sensor, point.value, 23, 28);
        body.material.opacity = 0.80;
        body.material.color.set(color);
      }
    });
  });
}

function metricToColor(sensor, value, min, max) {
  if (Number.isFinite(value)) {
    let color = colorsService.getRainbow(sensor).colorAt(value);
    return new THREE.Color(parseInt(color, 16));
  }
  return defaultColor;
}

Building.prototype.controller.$inject = ['Metrics', 'Colors'];
export default Building;
