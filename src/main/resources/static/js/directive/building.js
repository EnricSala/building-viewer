angular
  .module('app.directives')
  .directive('building', BuildingDirective);

function BuildingDirective() {
  return {
    restrict: 'E',
    link: BuildingDirectiveLink,
    scope: {
      model: '=',
      metrics: '='
    }
  };
}

function BuildingDirectiveLink(scope, element, attrs) {
  var renderer, scene, camera, light;
  var group, currentBodies;
  var tempRange = {
    min: 17,
    max: 27
  };

  init();
  animate();

  scope.$watch('model', function() {
    if (scope.model.name) {
      console.log('Model changed, redrawing: ' + scope.model.name);
      setCamera(scope.model.camera);
      redrawModel();
    }
  });

  scope.$watch('metrics', function() {
    if (scope.metrics.points) {
      console.log('Metrics changed, updating colors');
      updateColors();
    }
  });

  function init() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    scene = new THREE.Scene();
    // scene.fog = new THREE.Fog(0x72645b, 600, 10000);

    camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 10000);

    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    renderer.setClearColor(0x222222);
    // renderer.setClearColor(scene.fog.color);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.cullFace = THREE.CullFaceBack;

    // Lights
    // scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));
    scene.add(new THREE.AmbientLight(0x303030));

    light = new THREE.PointLight(0xffff30, 1, 1500, 0.5);
    light.position.x = -50;
    light.position.y = -50;
    light.position.z = 300;
    scene.add(light);

    addShadowedLight(1, 1, 1, 0xffffff, 1.35);
    addShadowedLight(0.5, 1, -1, 0xffaa00, 1);

    // Add the renderer to the DOM
    element[0].appendChild(renderer.domElement);
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  function setCamera(config) {
    camera.position.x = config.pos.x;
    camera.position.y = config.pos.y;
    camera.position.z = config.pos.z;
    camera.lookAt(config.lookAt);
  }

  function redrawModel() {
    currentBodies = [];
    var model = scope.model;
    if (group) {
      scene.remove(group);
    }
    group = new THREE.Group();
    model.base.forEach(function(obj) {
      var mesh = drawObject(obj);
      group.add(mesh);
      currentBodies.push(mesh);
    });
    model.objects.forEach(function(obj) {
      var mesh = drawObject(obj);
      group.add(mesh);
      currentBodies.push(mesh);
    });
    scene.add(group);
  }

  function drawObject(obj) {
    var material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0.5, 0.5, 0.5),
      opacity: 1,
      transparent: true
    });

    var pos = obj.body.pos;
    var size = obj.body.size;

    var box = new THREE.BoxGeometry(size[0], size[1], size[2]);
    var mesh = new THREE.Mesh(box, material);
    mesh.position.x = pos[0] + size[0] / 2;
    mesh.position.y = pos[1] + size[1] / 2;
    mesh.position.z = pos[2] + size[2] / 2;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.obj = obj;

    return mesh;
  }

  function updateColors() {
    if (currentBodies && scope.metrics.points) {

      // Get min anx max values
      var minTemp = 100;
      var maxTemp = 0;
      for (var id in scope.metrics.points) {
        var point = scope.metrics.points[id];
        if (point && Number.isFinite(point.value)) {
          if (point.value < tempRange.min || point.value > tempRange.max) {
            // Convert to NaN values outside valid range
            point.value = NaN;
          } else {
            // Use the value to calculate the real range
            minTemp = Math.min(minTemp, point.value);
            maxTemp = Math.max(maxTemp, point.value);
          }
        }
      }
      console.log('Temperature range: ' + minTemp + '-' + maxTemp);
      currentBodies.forEach(function(mesh) {
        if (mesh.obj) {
          color = mesh.obj.sensorId ?
            sensorIdToColor(mesh.obj.sensorId, minTemp, maxTemp) :
            new THREE.Color(0.5, 0.5, 0.5);
          mesh.material.color.set(color);
        }
      });
    }
  }

  function sensorIdToColor(sensorId, min, max) {
    if (scope.metrics.points) {
      var point = scope.metrics.points[sensorId];
      if (point && Number.isFinite(point.value)) {
        var value = point.value
        var red = (value - min) / (max - min);
        return new THREE.Color(red, 0.2, (1 - red) * 0.9 + 0.1);
      }
    }
    return new THREE.Color(0.3, 0.3, 0.3);
  }

  function addShadowedLight(x, y, z, color, intensity) {
    var directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);

    directionalLight.castShadow = true;

    var d = 1;
    directionalLight.shadowCameraLeft = -d;
    directionalLight.shadowCameraRight = d;
    directionalLight.shadowCameraTop = d;
    directionalLight.shadowCameraBottom = -d;

    directionalLight.shadowCameraNear = 1;
    directionalLight.shadowCameraFar = 4;

    directionalLight.shadowMapWidth = 1024;
    directionalLight.shadowMapHeight = 1024;

    directionalLight.shadowBias = -0.005;
  }

}
