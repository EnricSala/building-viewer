import THREE from 'three';

export default class Building {

  constructor() {
    this.restrict = 'E';
    this.scope = { model: '=', metrics: '=' };
  }

  link(scope, element, attrs) {
    init(element);
    animate();

    scope.$watch('model', () => redrawModel(scope.model));
    scope.$watch('metrics', () => applyMetrics(scope.metrics));
  }

}

let camera, scene, renderer;
const cameraTarget = new THREE.Vector3(425, 5, 248);
const baseColor = new THREE.Color(0.5, 0.5, 0.5);
const defaultColor = new THREE.Color(0.3, 0.3, 0.3);
const cameraDistance = 800;

function init(element) {
  // Camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(0, 0, 0);

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x72645b, 1000, 150000);

  // Ground
  const plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(4000, 4000),
    new THREE.MeshPhongMaterial({ color: 0x999999, specular: 0x101010 })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -100;
  plane.receiveShadow = true;
  scene.add(plane);

  // Lights
  scene.add(new THREE.HemisphereLight(0x443333, 0x111122));
  addShadowedLight(1, 1, 1, 0xffffff, 1.35);
  addShadowedLight(0.5, 1, -1, 0xffaa00, 1);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(scene.fog.color);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.renderReverseSided = false;

  // Add the renderer to the DOM
  element[0].appendChild(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  const timer = Date.now() * 0.0005;
  camera.position.x = Math.cos(timer) * cameraDistance + 425;
  camera.position.z = Math.sin(timer) * cameraDistance + 248;
  camera.position.y = 300;
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

function redrawModel(model) {
  if (!model.name) return;
  console.log('Redrawing model: ' + model.name);
  const group = new THREE.Group();
  model.base.forEach(obj => group.add(drawObject(obj, 1)));
  model.objects.forEach(obj => group.add(drawObject(obj, 0.7)));
  scene.add(group);
}

function drawObject(obj, opacity) {
  const pos = obj.body.pos;
  const size = obj.body.size;
  const config = {
    color: baseColor,
    opacity: opacity,
    transparent: true
  };

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[2], size[1]),
    new THREE.MeshLambertMaterial(config)
  );
  mesh.position.x = pos[0] + size[0] / 2;
  mesh.position.y = pos[2] + size[2] / 2;
  mesh.position.z = pos[1] + size[1] / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.wireframe = true;
  mesh.obj = obj;
  return mesh;
}

function applyMetrics(metrics) {
  if (!metrics.points) return;
  console.log('Applying metrics');
}
