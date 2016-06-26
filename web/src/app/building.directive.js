import THREE from 'three';
require('./ext/AMFLoader.js');

export default class Building {

  constructor() {
    this.restrict = 'E';
    this.scope = { model: '=', metrics: '=' };
  }

  link(scope, element, attrs) {
    init(element);
    animate();

    scope.$watch('model', () => drawModel(scope.model));
    scope.$watch('metrics', () => applyMetrics(scope.metrics));
  }

}

let camera, scene, renderer;
const cameraTarget = new THREE.Vector3(30, 20, -5);
const baseColor = new THREE.Color(0.5, 0.5, 0.5);
const defaultColor = new THREE.Color(0.3, 0.3, 0.3);
const cameraDistance = 50;

function init(element) {
  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 500);
  camera.up.set(0, 0, 1);
  scene.add(camera);

  // Lights
  scene.add(new THREE.AmbientLight(0x999999));
  camera.add(new THREE.PointLight(0xffffff, 0.6));
  addShadowedLight(10, 0, 10, 0xffaa00, 0.3);

  // Ground
  const plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000, 1000),
    new THREE.MeshPhongMaterial({ color: 0xADD8E6, specular: 0x101010 })
  );
  plane.position.z = -5;
  plane.receiveShadow = false;
  scene.add(plane);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x999999);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  // Add the renderer to the DOM
  element[0].appendChild(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  const timer = Date.now() * 0.0002;
  camera.position.x = Math.cos(timer) * cameraDistance + cameraTarget.x;
  camera.position.y = Math.sin(timer) * cameraDistance + cameraTarget.y;
  camera.position.z = 15;
  camera.lookAt(cameraTarget);
  renderer.render(scene, camera);
}

function addShadowedLight(x, y, z, color, intensity) {
  const d = 1;
  const directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(x, y, z);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 4;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.bias = -0.005;
  scene.add(directionalLight);
}

function drawModel(model) {
  if (!model.name) return;
  console.log('Redrawing model: ' + model.name);

  const loader = new THREE.AMFLoader();
  loader.load(`./models/${model.file}`, amfModel => {
    scene.add(amfModel);
  });
}

function findByName(model, name) {
  return model.children.filter(it => it.name === name)[0];
}

function applyMetrics(metrics) {
  if (!metrics.points) return;
  console.log('Applying metrics');
}
