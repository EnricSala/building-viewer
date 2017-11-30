import THREE from 'three';
import TWEEN from 'tween.js';
import SunCalc from 'suncalc';

import Elevator from './elevator.js';

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
const floorHeight = 4;

const SUN_DISTANCE = 500;
const SUN_RADIUS = 50;

const cameraTarget = new THREE.Vector3(buildingX / 2, 12, -buildingZ / 2);
let cameraDistance = 60;
let cameraDistanceX = cameraDistance;
let cameraDistanceZ = cameraDistance;
const cameraOffset = new THREE.Vector3(0, 0, 0);
const cameraTargetOffset = new THREE.Vector3(0, 0, 0);

const defaultColor = new THREE.Color(0.7, 0.7, 0.7);
const structureColor = new THREE.Color(0.5, 0.5, 0.5);
const platformColor = new THREE.Color(0.7, 0.6, 0.5);
const blueStructureColor = new THREE.Color(0.5, 0.6, 0.8);

// Sample coordinates to calculate Sun position
const BUILDING_LAT = 41.562533;
const BUILDING_LNG = 2.020699;
const BUILDING_ORIENTATION = 17.042 * Math.PI / 180;

// Element groups by floor
let floorElementList;

// Store opacities before animation
const DEFAULT_OPACITY = 0
let originalProperties;

// Elevator controller
let elevator;

function init(element) {
  // Scene
  scene = new THREE.Scene();

  // Camera
  const aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(40, aspectRatio, 10, 2000000);
  camera.up.set(0, 1, 0);
  scene.add(camera);

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404050, 0.15);
  scene.add(ambientLight);

  // Hemisphere light
  hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
  hemiLight.color.setRGB(0.1, 0.1, 0.1);
  hemiLight.groundColor.setRGB(1, 1, 1);
  hemiLight.position.set(0, 0, 0); // canviat de (0,0,0) --> (0,50,0)
  scene.add(hemiLight);

  // Sun light
  dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setRGB(1, 1, 1); // (0.21, 1, 0.8)
  dirLight.position.set(1, 1, 2);
  dirLight.position.multiplyScalar(100);
  dirLight.castShadow = true;
  dirLight.shadowMapWidth = 2048 * 2;
  dirLight.shadowMapHeight = 2048 * 2;
  let d = buildingX * 1.5;
  dirLight.shadowCameraLeft = -d + buildingX / 2;
  dirLight.shadowCameraRight = d + buildingX / 2;
  dirLight.shadowCameraTop = d + buildingZ / 2;
  dirLight.shadowCameraBottom = -d + buildingZ / 2;
  dirLight.shadowCameraFar = 300;
  dirLight.shadowBias = -0.001;
  dirLight.shadowDarkness = 1;
  dirLight.shadowCameraVisible = true;
  scene.add(dirLight);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  // renderer.setClearColor(scene.fog.color);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMapCullFace = THREE.CullFaceBack;
  renderer.shadowMapSoft = true;
  renderer.shadowMapType = THREE.PCFShadowMap;

  scene.fog = new THREE.Fog(0x222233, 0, 120);
  renderer.setClearColor(scene.fog.color, 1);

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
    new THREE.SphereBufferGeometry(SUN_RADIUS, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  sunSphere.position.y = 0;
  sunSphere.visible = false;
  scene.add(sunSphere);

  // GUI
  const effectController = {
    turbidity: 10,
    reileigh: 2,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    luminance: 1,
    inclination: 45,
    azimuth: 30,
    sun: false,
  };

  function guiChanged() {
    const uniforms = sky.uniforms;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.reileigh.value = effectController.reileigh;
    uniforms.luminance.value = effectController.luminance;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;
    sunSphere.visible = effectController.sun;

    const inclination = effectController.inclination * Math.PI / 180;
    const azimuth = effectController.azimuth * Math.PI / 180;
    // console.log(`Sun alt/azi is: ${inclination} / ${azimuth}`);

    const position = sunPositionFrom(inclination, azimuth);
    updateSky(position);
  }

  function updateSky({ x, y, z }) {
    const R = Math.sqrt(x * x + y * y + z * z);
    console.log(`Sun: x: ${Math.round(x)}, z: ${Math.round(z)}, y: ${Math.round(y)}, R: ${Math.round(R)}`);

    // Update Sun position
    sunSphere.position.x = x;
    sunSphere.position.y = y;
    sunSphere.position.z = z;

    // Update Sky position
    sky.uniforms.sunPosition.value.x = x;
    sky.uniforms.sunPosition.value.y = y;
    sky.uniforms.sunPosition.value.z = z;

    // Update Sun Light
    const dx = x - cameraTarget.x;
    const dy = y - cameraTarget.y;
    const dz = z - cameraTarget.z;
    const mod = Math.sqrt(dx * dx + dy * dy + dz * dz) / 80;
    dirLight.position.set(dx / mod, dy / mod, dz / mod);
    dirLight.intensity = y / R;
  }

  function calcSunPosition(time) {
    const position = SunCalc.getPosition(time, BUILDING_LAT, BUILDING_LNG);
    return sunPositionFrom(position.altitude, position.azimuth);
  }

  function sunPositionFrom(inclination, azimuth) {
    return {
      y: SUN_DISTANCE * Math.sin(inclination),
      x: -SUN_DISTANCE * Math.cos(azimuth + BUILDING_ORIENTATION) * Math.cos(inclination),
      z: SUN_DISTANCE * Math.sin(azimuth + BUILDING_ORIENTATION) * Math.cos(inclination)
    }
  }

  const gui = new dat.GUI();
  gui.close();
  gui.add(effectController, "turbidity", 1.0, 20.0, 0.1).onChange(guiChanged);
  gui.add(effectController, "reileigh", 0.0, 4, 0.001).onChange(guiChanged);
  gui.add(effectController, "mieCoefficient", 0.0, 0.1, 0.001).onChange(guiChanged);
  gui.add(effectController, "mieDirectionalG", 0.0, 1, 0.001).onChange(guiChanged);
  gui.add(effectController, "luminance", 0.0, 2).onChange(guiChanged);
  gui.add(effectController, "inclination", 0, 180, 0.1).onChange(guiChanged);
  gui.add(effectController, "azimuth", 0, 180, 0.1).onChange(guiChanged);
  gui.add(effectController, "sun").onChange(guiChanged);
  guiChanged();

  // Update sun position
  const position = calcSunPosition(new Date());
  updateSky(position);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  TWEEN.update();
}

function render() {
  const timer = -Date.now() * 0.0002;
  camera.position.x = Math.cos(timer) * cameraDistanceX + cameraTarget.x + cameraOffset.x;
  camera.position.z = Math.sin(timer) * cameraDistanceZ + cameraTarget.z + cameraOffset.z;
  updateViewPoint();
  renderer.render(scene, camera);
}

function updateViewPoint() {
  const floor = 1;
  cameraDistanceX = floor > 1 ? 50 : 60;
  cameraDistanceZ = floor > 1 ? 50 : 60;
  cameraTarget.x = floor > 1 ? buildingX / 2 - 3.5 : buildingX / 2 + cameraTargetOffset.x;
  cameraTarget.y = floorHeight * (floor - 1) + cameraTargetOffset.y;
  cameraTarget.z = floor > 1 ? -27.5 : -buildingZ / 2 + cameraTargetOffset.z;
  camera.position.y = cameraTarget.y + floorHeight * 4 + 4 + cameraOffset.y;
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

    // Configure defaults
    amfModel.children.forEach(part => {
      part.children.forEach(body => {
        body.material.transparent = true;
        body.material.opacity = 1;
        body.material.color.set(defaultColor);
      });
    });

    // Configure the base
    const base = findByName(amfModel, 'contorn_N1');
    base.children.forEach(body => {
      body.material.opacity = 1;
      body.material.color.set(platformColor);
      body.receiveShadow = true;
    });

    // Configure the structure
    const structures = findByRegex(amfModel, /^estructura_terra/);
    structures.forEach(part => {
      part.children.forEach(body => {
        body.material.opacity = 1;
        body.material.color.set(structureColor);
        body.castShadow = true;
        body.receiveShadow = true;
      });
    });

    // Configure the walls
    const walls = findByRegex(amfModel, /^tancaments_/);
    walls.forEach(part => {
      part.children.forEach(body => {
        body.material.opacity = 1;
        body.material.color.set(structureColor);
        body.castShadow = true;
        body.receiveShadow = true;
      });
    });

    // blueStructureColor = new THREE.Color(0.5, 0.6, 0.8);
    const blueStructures = [
      findByName(amfModel, 'tancaments_0_1'),
      findByName(amfModel, 'tancaments_1_10')
    ];
    blueStructures.forEach(part => {
      part.children.forEach(body => {
        body.material.color.set(blueStructureColor);
      });
    });

    // Rename the impulsion/return pumps
    console.log(amfModel.children.map(it => it.name))
    findByRegex(amfModel, /^climatitzacio_4_imp_/)
      .forEach((part, idx) => part.name = part.name + (idx + 1));
    findByRegex(amfModel, /^climatitzacio_4_ret_/)
      .forEach((part, idx) => part.name = part.name + (idx + 1));
    console.log(amfModel.children.map(it => it.name))

    // Use metrics to color parts of the model
    colorUsingSensor(model, amfModel, 'temperature');
    colorUsingSensor(model, amfModel, 'solar');
    colorUsingSensor(model, amfModel, 'enable');
    colorUsingSensor(model, amfModel, 'cooling');
    colorUsingSensor(model, amfModel, 'heating');
    colorUsingSensor(model, amfModel, 'heatTransfer');

    // Configure the elevator
    const floors = [
      { floor: 0, z: 0 },
      { floor: 1, z: 4 },
      { floor: 2, z: 8 },
      { floor: 3, z: 12 },
      { floor: 4, z: 16 }
    ];
    const elevatorPart = findByName(amfModel, 'ascensor_0');
    elevatorPart.children.forEach(body => { body.material.opacity = 1; });
    elevator = new Elevator(elevatorPart, floors);
    elevator.animate()

    // Group parts by floor
    floorElementList = initFloorGroups(amfModel);

    const floor3 = findByFloor(amfModel, 3);
    floor3.forEach(
      part => part.children.forEach(
        body => body.material.opacity = 1));

    // Animate a floor
    let targetFloor = floors[Math.floor(Math.random() * floors.length)].floor;
    setTimeout(() => { animateFloor(amfModel, targetFloor, true) }, 20000);
    setTimeout(() => { animateFloor(amfModel, targetFloor, false) }, 40000);
  });
}

function findByName(amfModel, name) {
  return amfModel.children.filter(it => it.name === name)[0];
}

function findByRegex(amfModel, expression) {
  return amfModel.children.filter(it => expression.test(it.name));
}

function findByFloor(amfModel, floor) {
  const regex = floor >= 0 ? /_(\d)/ : /_N(\d)/
  return amfModel.children.filter(it => {
    const match = it.name.match(regex)
    if (match) {
      const partFloor = match.pop()
      return partFloor == Math.abs(floor)
    }
    return false
  });
}

function loadMetrics(amfModel, sensor) {
  let metricIds = amfModel.objects.map(obj => obj.sensors[sensor]);
  return metricsService.current(metricIds);
}

function colorUsingSensor(model, amfModel, sensor) {
  loadMetrics(model, sensor).then(
    metrics => applyMetrics(model, amfModel, sensor, metrics),
    err => console.error(`Error loading current metrics: ${err.data.message}`));
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

function animateFloor(amfModel, floor, push) {
  if (push)
    storeAnimationProperties(amfModel);

  const SHIFT_DURATION = 4000;
  const DISTANCE = 20;
  const DELAY_SPACING = 750;

  const topGroups = floorElementList.filter(it => it.floor > floor);
  const botGroups = floorElementList.filter(it => it.floor < floor);

  const maxDist = Math.max(topGroups.length, botGroups.length);
  const opacityDelayOffset = push ? 0 : SHIFT_DURATION / 2;

  // Animate parts on floors on top of target
  const topShift = (push ? '+' : '-') + DISTANCE;
  topGroups.forEach(group => {
    const floorDelay = DELAY_SPACING * (push ?
      maxDist - Math.abs(group.floor - floor) :
      Math.abs(group.floor - floor) - 1);
    console.log(`Animating top floor=${group.floor} delay=${floorDelay}`);
    group.items.forEach(part => {
      const originalprop = originalProperties.filter(it => it.name == part.name).pop();
      const opacityTarget = push ? 0 : originalprop.opacity;

      // Animate z-offset
      new TWEEN.Tween(part.position)
        .to({ z: topShift }, SHIFT_DURATION)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .delay(floorDelay)
        .start();
      // Animate opacity
      part.children.forEach(body => {
        new TWEEN.Tween(body.material)
          .to({ opacity: opacityTarget }, SHIFT_DURATION / 2)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .delay(floorDelay + opacityDelayOffset)
          .start();
      });
    });
  });

  // Animate parts on floors below target
  const botShift = (push ? '-' : '+') + DISTANCE;
  botGroups.forEach(group => {
    const floorDelay = DELAY_SPACING * (push ?
      maxDist - Math.abs(group.floor - floor) :
      Math.abs(group.floor - floor) - 1);
    console.log(`Animating bot floor=${group.floor} delay=${floorDelay}`);
    group.items.forEach(part => {
      const originalprop = originalProperties.filter(it => it.name == part.name).pop();
      const opacityTarget = push ? 0 : originalprop.opacity;

      // Animate z-offset
      new TWEEN.Tween(part.position)
        .to({ z: botShift }, SHIFT_DURATION)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .delay(floorDelay)
        .start();
      // Animate opacity
      part.children.forEach(body => {
        new TWEEN.Tween(body.material)
          .to({ opacity: opacityTarget }, SHIFT_DURATION / 2)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .delay(floorDelay + opacityDelayOffset)
          .start();
      });
    });
  });

  // Animate camera
  const yTarget = push ? floorHeight * (floor - 1) : 0;
  const xTarget = push ? -3.5 : 0;
  const zTarget = push ? -buildingZ / 4 : 0;

  if (floor > 2) {
    new TWEEN.Tween(cameraOffset)
      .to({ y: yTarget, x: xTarget, z: zTarget }, SHIFT_DURATION)
      .start();
  } else {
    new TWEEN.Tween(cameraOffset)
      .to({ y: yTarget }, SHIFT_DURATION)
      .start();
  }

  // Animate camera target
  if (floor > 2) {
    new TWEEN.Tween(cameraTargetOffset)
      .to({ y: yTarget, z: zTarget, x: xTarget }, SHIFT_DURATION)
      .start();
  } else {
    new TWEEN.Tween(cameraTargetOffset)
      .to({ y: yTarget }, SHIFT_DURATION)
      .start();
  }
}

function storeAnimationProperties(model) {
  originalProperties = model.children
    .map(part => {
      if (part.children) {
        return {
          name: part.name,
          opacity: part.children.length > 0 ? part.children[0].material.opacity : DEFAULT_OPACITY
        }
      } else {
        return undefined
      }
    })
    .filter(it => it != undefined);
  console.log(originalProperties)
}

function initFloorGroups(amfModel) {
  const PN1 = { floor: -1, items: findByFloor(amfModel, -1) };
  const P0 = { floor: 0, items: findByFloor(amfModel, 0) };
  const P1 = { floor: 1, items: findByFloor(amfModel, 1) };
  const P2 = { floor: 2, items: findByFloor(amfModel, 2) };
  const P3 = { floor: 3, items: findByFloor(amfModel, 3) };
  const P4 = { floor: 4, items: findByFloor(amfModel, 4) };
  return [PN1, P0, P1, P2, P3, P4];
}

Building.prototype.controller.$inject = ['Metrics', 'Colors'];
export default Building;
