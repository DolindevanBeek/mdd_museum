
//imports
import './style.css';
import * as THREE from 'three';
//import * as ammo from 'ammo.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader2 } from 'three/examples/jsm/loaders/OBJLoader2.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { MtlObjBridge } from 'three/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js';
//import THREEx from './threex.keyboardstate.js';

//standard global variables
var scene, camera, renderer, controls, MovingCube;
var clock = new THREE.Clock();

var keyboard = new THREEx.KeyboardState();

//custom global variables
const canvas = document.querySelector('#c');

init();
animate();

function init(){

  //create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color('black');

  // const fov = 45;
  // const aspect = 2;  // the canvas default
  // const near = 0.1;
  // const far = 100;
  // camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  // camera.position.set(-2, 0.7, 10);

  var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
  var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0, 150, 400);
  camera.lookAt(scene.position);

  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  controls = new OrbitControls(camera, canvas);
  //controls.target.set(0, 5, 0);
  controls.update();

  //plane
  // {

  //   const loader = new THREE.TextureLoader();
  //   const floorTexture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
  //   floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  //   floorTexture.repeat.set(10, 10);
  //   floorTexture.magFilter = THREE.NearestFilter;

  //   //const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
  //   const floorGeometry = new THREE.PlaneGeometry(100000, 100000, 10, 10);
  //   const floorMaterial = new THREE.MeshPhongMaterial({
  //     map: floorTexture,
  //     side: THREE.DoubleSide,
  //   });
  //   const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  //   floor.position.y = -0.5;
  //   floor.rotation.x = Math.PI / 2;
  //   scene.add(floor);
  // }

  //Fit camera to object
  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // compute a unit vector that points in the direction the camera is now
    // in the xz plane from the center of the box
    const direction = (new THREE.Vector3())
      .subVectors(camera.position, boxCenter)
      .multiply(new THREE.Vector3(1, 0, 1))
      .normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  //Object
  {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/200605_graduation_studio_v2.mtl', (mtlParseResult) => {
      const objLoader = new OBJLoader2();
      const materials = MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
      objLoader.addMaterials(materials);

      objLoader.load('./objects/200605_graduation_studio_v2.obj', (museum) => {
        museum.updateMatrixWorld();
        scene.add(museum);
        museum.castShadow = true;
        museum.receiveShadow = true;

        // compute the box that contains all the stuff
        // from root and below
        const box = new THREE.Box3().setFromObject(museum);

        const boxSize = box.getSize(new THREE.Vector3()).length();
        const boxCenter = box.getCenter(new THREE.Vector3());

        // set the camera to frame the box
        frameArea(boxSize * 1.2, boxSize, boxCenter, camera);

        // update the Trackball controls to handle the new size
        controls.maxDistance = boxSize * 10;
        controls.target.copy(boxCenter);
        controls.update();
      });
    });
  }

  //ambient light

  // {
  //   const color = 0xFFFFFF;
  //   const intensity = 1;
  //   const light = new THREE.AmbientLight(color, intensity);
  //   scene.add(light);
  // }

  //hemisphere light
  {
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  //Directional light
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    light.castShadow = true;
    scene.add(light);
    scene.add(light.target);
  }

  //Cube
  {
    var cubeSize = 1000;
    var cubeGeo = new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize);
    var cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
    MovingCube = new THREE.Mesh(cubeGeo, cubeMat);
    MovingCube.position.set(cubeSize + 1, cubeSize / 2 + 100, 0);
    //MovingCube.position.set(0, 1, 0);
    scene.add(MovingCube);
  }

}

function animate() {
  requestAnimationFrame(animate);
  render();
  update();
}

function update() {

  var delta = clock.getDelta(); // seconds.
  var moveDistance = 5000 * delta; // 200 pixels per second
  var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second

  // local transformations

  // move forwards/backwards/left/right
  if (keyboard.pressed("up"))
    MovingCube.translateZ(-moveDistance);
  if (keyboard.pressed("down"))
    MovingCube.translateZ(moveDistance);
  if (keyboard.pressed("left"))
    MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
    //MovingCube.translateX(-moveDistance);
  if (keyboard.pressed("right"))
    MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);
    //MovingCube.translateX(moveDistance);

   // rotate left/right/up/down
  var rotation_matrix = new THREE.Matrix4().identity();
  if (keyboard.pressed("A"))
    //MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
  if (keyboard.pressed("D"))
    //MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);
  if (keyboard.pressed("W"))
    camera.position.z = camera.position.z - moveDistance;
    //MovingCube.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotateAngle);
  if (keyboard.pressed("S"))
    camera.position.z = camera.position.z + moveDistance;
    //MovingCube.rotateOnAxis(new THREE.Vector3(1, 0, 0), -rotateAngle);

  if (keyboard.pressed("Z")) {
    MovingCube.position.set(0, 25.1, 0);
    MovingCube.rotation.set(0, 0, 0);
  }

  var relativeCameraOffset = new THREE.Vector3(0, 50, 5000);

  var cameraOffset = relativeCameraOffset.applyMatrix4(MovingCube.matrixWorld);

  camera.position.x = cameraOffset.x;
  camera.position.y = cameraOffset.y;
  camera.position.z = cameraOffset.z;
  camera.lookAt(MovingCube.position);

  // var delta = clock.getDelta(); // seconds.
  // var moveDistance = 10 * delta; // 100 pixels per second
  // var rotateAngle = Math.PI / 2 * delta;

  // if (keyboard.pressed("up"))
  //   camera.position.z = camera.position.z - moveDistance;
  // if (keyboard.pressed("down"))
  //   camera.position.z = camera.position.z + moveDistance;
  // if (keyboard.pressed("left"))
  //   camera.rotation.y = camera.rotation.y + rotateAngle;
  // if (keyboard.pressed("right"))
  //   camera.rotation.y = camera.rotation.y - rotateAngle;

  // console.log(controls.target);

  // keyboard.update();

  // var moveDistance = 50 * clock.getDelta();

  // if (keyboard.down("left"))
  //   mesh.translateX(-50);

  // if (keyboard.down("right"))
  //   mesh.translateX(50);

  // if (keyboard.pressed("A"))
  //   mesh.translateX(-moveDistance);

  // if (keyboard.pressed("D"))
  //   mesh.translateX(moveDistance);

  // if (keyboard.down("R"))
  //   mesh.material.color = new THREE.Color(0xff0000);
  // if (keyboard.up("R"))
  //   mesh.material.color = new THREE.Color(0x0000ff);

  // window.addEventListener("keydown", function (event) {
  //   if (event.defaultPrevented) {
  //     return; // Do nothing if the event was already processed
  //   }

  //   var delta = 10;
  //   var moveDistance = 50 * clock.getDelta();

  //   switch (event.key) {
  //     case "Down": // IE/Edge specific value
  //     case "ArrowDown":
  //       // Do something for "down arrow" key press.
  //       console.log('down');
  //       camera.position.z = camera.position.z + moveDistance;
  //       console.log(camera.position.z);
  //       camera.updateProjectionMatrix();
  //       break;
  //     case "Up": // IE/Edge specific value
  //     case "ArrowUp":
  //       // Do something for "up arrow" key press.
  //       console.log('up');
  //       camera.position.z = camera.position.z - moveDistance;
  //       camera.updateProjectionMatrix();
  //       break;
  //     case "Left": // IE/Edge specific value
  //     case "ArrowLeft":
  //       // Do something for "left arrow" key press.
  //       console.log('left');
  //       break;
  //     case "Right": // IE/Edge specific value
  //     case "ArrowRight":
  //       // Do something for "right arrow" key press.
  //       console.log('right');
  //       break;
  //     case "Enter":
  //       // Do something for "enter" or "return" key press.
  //       break;
  //     case "Esc": // IE/Edge specific value
  //     case "Escape":
  //       // Do something for "esc" key press.
  //       break;
  //     default:
  //       return; // Quit when this doesn't handle the key event.
  //   }

  //   // Cancel the default action to avoid it being handled twice
  //   event.preventDefault();
  // }, true);

  //controls.update();
}

function render() {

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);

  //requestAnimationFrame(render);
}

animate();