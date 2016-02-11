angular
  .module('app.directives')
  .directive('building', BuildingDirective);

function BuildingDirective() {
  return {
    restrict: 'E',
    link: BuildingDirectiveLink
  };
}

function BuildingDirectiveLink(scope, element, attrs) {
  var renderer, scene, camera;

  init();
  animate();

  function init() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(20, width / height, 0.1, 10000);
    camera.position.x = 100;
    camera.position.y = -300;
    camera.position.z = 400;
    camera.lookAt({
      x: camera.position.x,
      y: 200,
      z: 0
    });

    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setClearColor(0xf0f0f0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    //Add the renderer to the DOM
    element[0].appendChild(renderer.domElement);

    var light = new THREE.DirectionalLight(0xff5050, 1);
    light.position.set(0.5, 0, 1);
    scene.add(light);

    scene.add(testDrawStuff());
    scene.add(drawGrid());
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    // var timer = Date.now() * 0.0001;

    // camera.position.x = Math.cos(timer) * 200;
    // camera.position.z = Math.sin(timer) * 200;
    // camera.position.x = 200;
    // camera.position.y = 200;
    // camera.position.z = 200;
    // camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  //////////////////////////////////////////////////////////////
  function testDrawStuff() {
    // var material = new THREE.MeshNormalMaterial({ color: 0x808080 });
    var material = new THREE.MeshLambertMaterial({
      color: 0x80808080
    });
    var group = new THREE.Group();

    material.opacity = 0.5;
    material.transparent = true;

    var c1 = new THREE.BoxGeometry(100, 100, 100);
    var mesh1 = new THREE.Mesh(c1, material);
    mesh1.position.x = -100;
    mesh1.position.y = 50;
    mesh1.position.z = 50;
    mesh1.matrixAutoUpdate = false;
    mesh1.updateMatrix();
    group.add(mesh1);

    var c2 = new THREE.BoxGeometry(50, 50, 50);
    var mesh2 = new THREE.Mesh(c2, material);
    mesh2.position.x = 110 + 25;
    mesh2.position.y = 25;
    mesh2.position.z = 25;
    mesh2.matrixAutoUpdate = false;
    mesh2.updateMatrix();
    group.add(mesh2);

    var c3 = new THREE.BoxGeometry(50, 50, 50);
    var mesh3 = new THREE.Mesh(c2, material);
    mesh3.position.x = 25;
    mesh3.position.y = 110 + 25;
    mesh3.position.z = 25;
    mesh3.matrixAutoUpdate = false;
    mesh3.updateMatrix();
    group.add(mesh3);

    var c4 = new THREE.BoxGeometry(50, 50, 50);
    var mesh4 = new THREE.Mesh(c2, material);
    mesh4.position.x = 25;
    mesh4.position.y = 25;
    mesh4.position.z = 110 + 25;
    mesh4.matrixAutoUpdate = false;
    mesh4.updateMatrix();
    group.add(mesh4);

    return group;
  }

  function drawGrid() {
    var size = 500;
    var step = 25;

    var geometry = new THREE.Geometry();

    for (var i = -size; i <= size; i += step) {
      geometry.vertices.push(new THREE.Vector3(-size, i, 0));
      geometry.vertices.push(new THREE.Vector3(size, i, 0));

      geometry.vertices.push(new THREE.Vector3(i, -size, 0));
      geometry.vertices.push(new THREE.Vector3(i, size, 0));
    }

    var material = new THREE.LineBasicMaterial({
      color: 0x000000,
      opacity: 0.2
    });

    return new THREE.LineSegments(geometry, material);
  }

}
