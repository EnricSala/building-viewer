import THREE from 'three';

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

  controller(Metrics) {
    console.log("Starting Controller for Building directive");
    metricsService = Metrics;
  }

}

let metricsService;
let sky, sunSphere;
let camera, scene, renderer;
let dirLight;
const cameraTarget = new THREE.Vector3(29.8, -5, -17.5);
const cameraDistance = 60;

function init(element) {
  // Scene
  scene = new THREE.Scene();

  // Fog
  // scene.fog = new THREE.Fog(0xffffff, 1, 5000);
  // scene.fog.color.setHSL(0.6, 0, 1);

  // Camera
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 10, 2000000);
  camera.up.set(0, 1, 0);
  scene.add(camera);

  // Hemisphere light
  let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.4);
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

  // Ground
  // let groundGeo = new THREE.PlaneBufferGeometry(200, 200);
  // let groundMat = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x050505 });
  // groundMat.color.setHSL(0.095, 1, 0.75);
  // let ground = new THREE.Mesh(groundGeo, groundMat);
  // ground.rotation.x = -Math.PI / 2;
  // ground.position.y = -5;
  // ground.receiveShadow = true;
  // scene.add(ground);

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
    azimuth: 0.2, // Facing front,
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
    sunSphere.position.x = distance * Math.cos(phi);
    sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
    sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);
    sunSphere.visible = effectController.sun;
    sky.uniforms.sunPosition.value.copy(sunSphere.position);
    renderer.render(scene, camera);
    updateSunlight();
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
  gui.add(effectController, "turbidity", 1.0, 20.0, 0.1).onChange(guiChanged);
  gui.add(effectController, "reileigh", 0.0, 4, 0.001).onChange(guiChanged);
  gui.add(effectController, "mieCoefficient", 0.0, 0.1, 0.001).onChange(guiChanged);
  gui.add(effectController, "mieDirectionalG", 0.0, 1, 0.001).onChange(guiChanged);
  gui.add(effectController, "luminance", 0.0, 2).onChange(guiChanged);
  gui.add(effectController, "inclination", 0, 1, 0.0001).onChange(guiChanged);
  gui.add(effectController, "azimuth", 0, 1, 0.0001).onChange(guiChanged);
  gui.add(effectController, "sun").onChange(guiChanged);
  guiChanged();
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  const timer = Date.now() * 0.0002;
  camera.position.x = Math.cos(timer) * cameraDistance + cameraTarget.x;
  camera.position.z = Math.sin(timer) * cameraDistance + cameraTarget.z;
  camera.position.y = 15;
  camera.lookAt(cameraTarget);
  renderer.render(scene, camera);
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
        body.material.opacity = 0.35;
        body.material.color.setRGB(0.7, 0.7, 0.7);
      });
    });

    // Configure the floor
    const floor = findByName(amfModel, 'estructura_terra_1');
    floor.children.forEach(body => {
      body.transparent = false;
      body.material.opacity = 1;
      body.material.color.setRGB(0.5, 0.5, 0.5);
    });

    doMetrics(model, amfModel);
  });
}

function findByName(model, name) {
  return model.children.filter(it => it.name === name)[0];
}

function loadMetrics(model, sensor) {
  let metricIds = model.objects.map(obj => obj.sensors[sensor]);
  return metricsService.current(metricIds);
}

function doMetrics(model, amfModel) {
  loadMetrics(model, 'temperature').then(
    metrics => {
      console.log(`Loaded metrics: ${JSON.stringify(metrics)}`);
      applyMetrics(model, amfModel, metrics);
    },
    err => {
      console.error(`Error loading current metrics: ${err.data.message}`);
    }
  );
}

function applyMetrics(model, amfModel, metrics) {
  if (!metrics.points) return;
  console.log('Applying metrics');

  model.objects.forEach(obj => {
    console.log(`Coloring: ${obj.label}, with PartId: ${obj.partId}`);
    const part = findByName(amfModel, obj.partId);
    part.children.forEach(body => {
      const point = metrics.points[obj.sensors.temperature];
      const color = metricToColor(point, 23, 28);
      body.material.opacity = 0.7;
      body.material.color.set(color);
    });
  });
}

function metricToColor(point, min, max) {
  const value = point.value;
  if (Number.isFinite(value)) {
    const red = (value - min) / (max - min);
    return new THREE.Color(red * 0.9 + 0.1, 0.2, (1 - red) * 0.9 + 0.1)
  }
  return new THREE.Color(0.3, 0.3, 0.3);
}

Building.prototype.controller.$inject = ['Metrics'];
export default Building;
