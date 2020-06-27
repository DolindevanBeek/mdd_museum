
//imports
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader2 } from 'three/examples/jsm/loaders/OBJLoader2.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { MtlObjBridge } from 'three/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SSAOShader } from 'three/examples/jsm/shaders/SSAOShader.js';

//standard global variables
var scene, camera, renderer; //basics
var composer, depthMaterial, depthRenderTarget, ssaoPass; //postprocessing
var hemiLight, spotLight; //lights
var MovingCube, controls, boxsizeWithSpace; //elements and controls
var relativeCameraOffset, cameraOffset; //camera related
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();

//custom global variables
const canvas = document.querySelector('#c');
var collidableMeshList = [];

init();
animate();

function init(){

  //create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color('black');

  var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
  var VIEW_ANGLE = 90, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0, 1800, 2000);


  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
    camera.near = boxSize / 1000;
    camera.far = boxSize * 1000;

    camera.updateProjectionMatrix();

    // point the camera at the cube
    camera.lookAt(MovingCube.position);

  }

  //ambient light

  {
    const color = 0xFFFFFF;
    const intensity = 0.3;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);
  }

  //hemisphere light

  hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);


  //Directional light
  {
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(0, 1500, 800);
    dirLight.position.multiplyScalar(30);
    scene.add(dirLight);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 3048;
    dirLight.shadow.mapSize.height = 3048;

    var d = 80000;

    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;

    dirLight.shadow.camera.far = 80000;
    dirLight.shadow.bias = - 0.0001;

    // var dirLightHeper = new THREE.DirectionalLightHelper(dirLight, 10);
    // scene.add(dirLightHeper);

    // var shadowHelper = new THREE.CameraHelper(dirLight.shadow.camera);
    // scene.add(shadowHelper);

  }

  {
    // spotLight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 5, 0.3);
    // spotLight.position.set(0, 15000, 10000);
    // spotLight.target.position.set(0, 0, 0);

    // spotLight.castShadow = true;
    // spotLight.shadow.camera.near = 1200;
    // spotLight.shadow.camera.far = 2500;
    // spotLight.shadow.bias = 0.0001;

    // spotLight.shadow.mapSize.width = 2048;
    // spotLight.shadow.mapSize.height = 2048;

    // scene.add(spotLight);

    // var shadowHelper = new THREE.CameraHelper(spotLight.shadow.camera);
    // scene.add(shadowHelper);
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

  //Object

  {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/200627_graduation_studio.mtl', (mtlParseResult) => {
      const objLoader = new OBJLoader2();
      const materials = MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
      objLoader.addMaterials(materials);

      objLoader.load('./objects/200627_graduation_studio.obj', (museum) => {
        museum.updateMatrixWorld();
        museum.position.set(0,0,0);
        scene.add(museum);
        museum.castShadow = true;
        museum.receiveShadow = true;

        museum.traverse(function (child) {


          if (!child.name.match(/\b(dome_glass)\b/g) && !child.name.match(/\b(\w*roof\w*)\b/g) ){
            collidableMeshList.push(child);
          }

          //if child name is glass then don't cast shadow

          //if (child.name == 'Mesh7 glass_3 glass_section2 dome_glass dome_roof Model') {
          if (child.name.match(/\b(glass_\d_*\d*)\b/g)) {
            child.receiveShadow = true;
          }
          else {
            child.castShadow = true;
            child.receiveShadow = true;
          }

          //if (child.name == 'Mesh7 glass_3 glass_section2 dome_glass dome_roof Model') {
          // if (child.name.match(/\b(handrails)\b/g)) {
          //   console.log('handrails!');

          //   collidableMeshList.push(child);
          // }

        });

        // compute the box that contains all the stuff
        // from root and below
        const box = new THREE.Box3().setFromObject(museum);

        const boxSize = box.getSize(new THREE.Vector3()).length();
        const boxCenter = box.getCenter(new THREE.Vector3());

        // set the camera to frame the box
        boxsizeWithSpace = boxSize * 1.2;
        frameArea(boxsizeWithSpace, boxSize, boxCenter, camera);

        console.log(museum);
      });
    });
  }

  //Cube

  {
    var cubeSize = 1000;
    //var cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    //var cubeGeo = new THREE.CubeGeometry(164, 164, 164, 8, 8, 8);
    //var cubeGeo = new THREE.SphereGeometry(132, 8, 8);
    var cubeGeo = new THREE.CubeGeometry(500, 1800, 500, 1, 1, 1);
    //var cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
    var cubeMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    MovingCube = new THREE.Mesh(cubeGeo, cubeMat);
    MovingCube.position.set(0, cubeSize / 2 + 100, 0);
    //MovingCube.castShadow = true;
    //MovingCube.position.set(0, 0, 0);
    scene.add(MovingCube);
  }

  //Orbitcontrols
    controls = new OrbitControls(camera, canvas);
    //controls.target.set(MovingCube.position);
    //controls.maxPolarAngle = Math.PI / 2; //dont let it go below ground
    controls.update();


  //POSTPROCESSING

  //Renderpass
  var renderPass = new RenderPass(scene, camera);
  renderPass.renderToScreen = true;

  //Setup depth pass
  depthMaterial = new THREE.MeshDepthMaterial();
  depthMaterial.depthPacking = THREE.RGBADepthPacking;
  depthMaterial.blending = THREE.NoBlending;

  var pars = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter
  };
  depthRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, pars);

  //Setup SSAO pass

  //var ssaoPass = new SSAOPass(scene, camera, width, height);
  //ssaoPass.kernelRadius = 16;

  ssaoPass = new ShaderPass(SSAOShader);
  ssaoPass.renderToScreen = false;
  //console.log(ssaoPass);
  //ssaoPass.uniforms[ "tDiffuse" ].value will be set by ShaderPass
  //ssaoPass.uniforms["tDepth"].value = depthRenderTarget.texture;
  //ssaoPass.uniforms['size'].value.set(window.innerWidth, window.innerHeight);
  //ssaoPass.uniforms['cameraNear'].value = camera.near;
  //ssaoPass.uniforms['cameraFar'].value = camera.far;
  //ssaoPass.uniforms['onlyAO'].value = false;
  //ssaoPass.uniforms['aoClamp'].value = 0.3;
  //ssaoPass.uniforms['lumInfluence'].value = 0.5;

  //Add passes to composer
  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  //composer.addPass(ssaoPass);

}

function animate() {
  requestAnimationFrame(animate);
  render();
  update();
}

function update() {

  // collision detection

  var originPoint = MovingCube.position.clone();
  var collided = false;

  for (var vertexIndex = 0; vertexIndex < MovingCube.geometry.vertices.length; vertexIndex++) {
    var localVertex = MovingCube.geometry.vertices[vertexIndex].clone();
    var globalVertex = localVertex.applyMatrix4(MovingCube.matrix);
    var directionVector = globalVertex.sub(MovingCube.position);
    var distance = 100;

    var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
    var collisionResults = ray.intersectObjects(collidableMeshList);

    if (collisionResults.length > 0 && collisionResults[0].point.y){
      MovingCube.position.y = collisionResults[0].point.y + 1000; //height of square
    }

    // add and if its not a ramp or a staircase or a floor
    if (collisionResults.length > 0 && collisionResults[0].distance <= directionVector.length()){

      var collisionName = collisionResults[0].object.name;
      var staircase = collisionName.match(/\b(\w*stair\w*)\b/g);
      var floor = collisionName.match(/\b(\w*floor\w*)\b/g);

      console.log(collisionName);

      if (!staircase && !floor){
        console.log('frontal collision');
        collided = true;
        //console.log(collisionResults[0]);
      }

      //If collisionResults[0].name === staircase { var staircase = true }
      //if collisionResults[0].name === triggeroverlay { var overlay = true }

    }
    else {
      collided = false;
    }
  }

  //keyboard movement
  var delta = clock.getDelta(); // seconds.
  var moveDistance = 5000 * delta; // 200 pixels per second
  var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second

  // IF keyboard: set camera behind cube and move cube
  if (keyboard.pressed("up") || keyboard.pressed("down") || keyboard.pressed("left") || keyboard.pressed("right")) {

    // move forwards/backwards/left/right
    if (keyboard.pressed("up") && collided === false)
      MovingCube.translateZ(-moveDistance);
    if (keyboard.pressed("down"))
      MovingCube.translateZ(moveDistance);
    if (keyboard.pressed("left"))
      MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
    if (keyboard.pressed("right"))
      MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);

    relativeCameraOffset = new THREE.Vector3(0, 650, 2000);
    cameraOffset = relativeCameraOffset.applyMatrix4(MovingCube.matrixWorld);

    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
    camera.lookAt(MovingCube.position);
  }

  // IF mousedown: activate orbitcontrols
  canvas.addEventListener('mousedown', function (e) {
    camera.position.set(camera.position.x, camera.position.y, camera.position.z);
    controls.target.copy(MovingCube.position);
    controls.update();
  }, false);


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

  //renderer.render(scene, camera);
  composer.render();

}

animate();