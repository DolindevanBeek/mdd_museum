
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
var scene, camera, renderer, controls, MovingCube, hemiLight, boxsizeWithSpace, relativeCameraOffset, cameraOffset;
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

  var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
  var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(1001, 650, 5000);
  //camera.lookAt(scene.position);

  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  //orbitcontrols
  //controls = new OrbitControls(camera, canvas);
  //controls.target.set(0, 5, 0);
  //controls.update();

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
    //camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    //camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);

    // point the camera at the cube
    camera.lookAt(MovingCube.position);

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
        boxsizeWithSpace = boxSize * 1.2;
        frameArea(boxsizeWithSpace, boxSize, boxCenter, camera);

        // update the Trackball controls to handle the new size
        //controls.maxDistance = boxSize * 10;
        //controls.target.copy(boxCenter);
        //controls.update();
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

  hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);


  //Directional light
  {
    // const color = 0xFFFFFF;
    // const intensity = 1;
    // const light = new THREE.DirectionalLight(color, intensity);
    // light.position.set(0, 10, 0);
    // light.target.position.set(-5, 0, 0);
    // light.castShadow = true;
    // scene.add(light);
    // scene.add(light.target);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(- 1, 1.75, 1);
    dirLight.position.multiplyScalar(30);
    scene.add(dirLight);

    dirLight.castShadow = true;

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight2.color.setHSL(0.1, 1, 0.95);
    dirLight2.position.set(1, 1.75, -1);
    dirLight2.position.multiplyScalar(30);
    scene.add(dirLight2);

    dirLight2.castShadow = true;
  }

  // SKYDOME


    var vertexShader = document.getElementById('vertexShader').textContent;
    var fragmentShader = document.getElementById('fragmentShader').textContent;
    var uniforms = {
      "topColor": { value: new THREE.Color(0x0077ff) },
      "bottomColor": { value: new THREE.Color(0xffffff) },
      "offset": { value: 33 },
      "exponent": { value: 0.6 }
    };
    uniforms["topColor"].value.copy(hemiLight.color);

  var skyGeo = new THREE.SphereBufferGeometry(100000, 32, 15);
    var skyMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide
    });

    var sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);


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

  //Orbitcontrols
    controls = new OrbitControls(camera, canvas);
    //controls.target.set(MovingCube.position);
    controls.update();

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

  // Maybe still turn the cube but moving forward is minus the degree its just been turned?

  if (keyboard.pressed("up") || keyboard.pressed("down") || keyboard.pressed("left") || keyboard.pressed("right")){

    // move forwards/backwards/left/right
    if (keyboard.pressed("up"))
      MovingCube.translateZ(-moveDistance);
    if (keyboard.pressed("down"))
      MovingCube.translateZ(moveDistance);
    if (keyboard.pressed("left"))
      MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
    if (keyboard.pressed("right"))
      MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);

    relativeCameraOffset = new THREE.Vector3(0, 50, 5000);
    cameraOffset = relativeCameraOffset.applyMatrix4(MovingCube.matrixWorld);

    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
    camera.lookAt(MovingCube.position);
  }

  canvas.addEventListener('mousedown', function (e) {
    camera.position.set(camera.position.x, camera.position.y, camera.position.z);
    controls.target.copy(MovingCube.position);
    controls.update();
  }, false);

   // rotate left/right/up/down
  //var rotation_matrix = new THREE.Matrix4().identity();
  // if (keyboard.pressed("W"))
  //    //camera.rotation.x = camera.rotation.x - rotateAngle;
  //    MovingCube.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotateAngle);
  // if (keyboard.pressed("S"))
  //    //camera.rotation.x = camera.rotation.x + moveDistance;
  //    MovingCube.rotateOnAxis(new THREE.Vector3(1, 0, 0), -rotateAngle);

  // if (keyboard.pressed("Z")) {
  //   MovingCube.position.set(0, 25.1, 0);
  //   MovingCube.rotation.set(0, 0, 0);
  // }

  // relativeCameraOffset = new THREE.Vector3(0, 50, 5000);
  // cameraOffset = relativeCameraOffset.applyMatrix4(MovingCube.matrixWorld);

  // camera.position.x = cameraOffset.x;
  // camera.position.y = cameraOffset.y;
  // camera.position.z = cameraOffset.z;
  // camera.lookAt(MovingCube.position);
  //controls.target = MovingCube.position;

  // if (keyboard.pressed("up"))
  //   camera.position.z = camera.position.z - moveDistance;
  // if (keyboard.pressed("down"))
  //   camera.position.z = camera.position.z + moveDistance;
  // if (keyboard.pressed("left"))
  //   camera.rotation.y = camera.rotation.y + rotateAngle;
  // if (keyboard.pressed("right"))
  //   camera.rotation.y = camera.rotation.y - rotateAngle;

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

}

animate();