
//imports
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

import { OBJLoader2 } from 'three/examples/jsm/loaders/OBJLoader2.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { MtlObjBridge } from 'three/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';


//standard global variables
var scene, camera, renderer, museum; //basics
var composer, effectScreen, effectFXAA, effectSSAO, depthMaterial, depthTarget; //postprocessing
var hemiLight, spotLight; //lights
var MovingCube, controls, boxsizeWithSpace, trigger, collisionName, project_data; //elements and controls
var relativeCameraOffset, cameraOffset; //camera related
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();

//modal variables
var video_container = document.getElementById("project_view_video");
var video = document.getElementById("project_view_video_iframe");
var title = document.getElementById("project_view_content_title");
var text = document.getElementById("project_view_content_text");
var link = document.getElementById("project_view_content_link");
var students = document.getElementById("project_view_students");

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
  var VIEW_ANGLE = 55, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 3000;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0, 1, 4);

  //Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  //renderer = new THREE.WebGLRenderer({ canvas });
  //renderer.autoClear = false;
  //renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //renderer.setPixelRatio(window.devicePixelRatio); //wow this fucks up bad :P dont use this

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  //renderer.outputEncoding = THREE.sRGBEncoding;
  //renderer.physicallyBasedShading = true;

  // var axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);

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
    camera.near = boxSize / 700;
    camera.far = boxSize * 700;

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
    dirLight.position.set(- 1, 2.75, 1);
    dirLight.position.multiplyScalar(30); //30
    scene.add(dirLight);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    var d = 90;

    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = - 0.0001;

    //var dirLightHeper = new THREE.DirectionalLightHelper(dirLight, 10);
    //scene.add(dirLightHeper);

    //var shadowHelper = new THREE.CameraHelper(dirLight.shadow.camera);
    //scene.add(shadowHelper);

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

  var skyGeo = new THREE.SphereBufferGeometry(200, 32, 15);
    var skyMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide
    });

    var sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

  //thankgoditsfridayeventhoughitsmondayloader

  var loader = new GLTFLoader();
  // Load a glTF resource
  loader.load(
    // resource URL
    './objects/200703_gITF_07/200703_graduation_gallery.gltf',
    // called when the resource is loaded
    function (gltf) {

      //gltf.scene.scale.set(0.005, 0.005, 0.005) // scale here

      scene.add(gltf.scene);

      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Group
      gltf.scenes; // Array<THREE.Group>
      gltf.cameras; // Array<THREE.Camera>
      gltf.asset; // Object

      gltf.scene.traverse(function (child) {

        child.frustumCulled = false;

        collidableMeshList.push(child);

        //if child name is glass then don't cast shadow, otherwise ,do
        if (child.name.match(/\b(glass_\w_*\d*)\b/g) && child.name.match(/\b(\w*floor\w*)\b/g)) {
          child.receiveShadow = true;
        }
        else {
          child.castShadow = true;
          child.receiveShadow = true;
        }

      });

      //console.log(collidableMeshList);

      // compute the box that contains all the stuff from root and below
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const boxSize = box.getSize(new THREE.Vector3()).length();
      const boxCenter = box.getCenter(new THREE.Vector3());

      // set the camera to frame the box
      boxsizeWithSpace = boxSize * 1.2;
      frameArea(boxsizeWithSpace, boxSize, boxCenter, camera);

      museum = gltf.scene;
      console.log(museum);

    },
    // called while loading is progressing
    function (xhr) {

      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      var percentageLoaded = (xhr.loaded / xhr.total * 100) + '%';

      var splashView = document.getElementById("splash_view");
      var loadingBar = document.getElementById("progress_bar");
      var loadingBarContainer = document.getElementById("progress_bar_container");
      var splashButton = document.getElementById("splash_button");

      loadingBar.style.width = percentageLoaded;
      console.log(percentageLoaded);

      if (percentageLoaded === "100%"){
        loadingBarContainer.classList.add("hidden");
        setTimeout(function () { loadingBarContainer.style.display = "none"; }, 300);
        setTimeout(function () { splashButton.style.opacity = 1; }, 400);
      }

    },
    // called when loading has errors
    function (error) {

      console.log('error');

    }
  );

  //Cube

  {
    var cubeHeight = 1.7;
    var cubeGeo = new THREE.CubeGeometry(0.5, cubeHeight, 0.5, 1, 1, 1);
    //var cubeMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    var cubeMat = new THREE.MeshLambertMaterial({color: 0xCC0000});
    MovingCube = new THREE.Mesh(cubeGeo, cubeMat);
    MovingCube.position.set(0, cubeHeight / 2 + 0.9, 0);
    MovingCube.material.transparent = true;
    MovingCube.material.opacity = 0;
    scene.add(MovingCube);
  }

  //Orbitcontrols
    controls = new OrbitControls(camera, canvas);
    //controls.maxPolarAngle = Math.PI / 2; //dont let it go below ground
    controls.update();


  //POSTPROCESSING

  // var width = window.innerWidth;
  // var height = window.innerHeight;

  // var renderPass = new RenderPass(scene, camera);

  // var ssaoPass = new SSAOPass(scene, camera, width, height);
  // ssaoPass.kernelRadius = 10;


  // var fxaaPass = new ShaderPass(FXAAShader);

  // var pixelRatio = renderer.getPixelRatio();

  // fxaaPass.material.uniforms['resolution'].value.x = 1 / (canvas.offsetWidth * pixelRatio);
  // fxaaPass.material.uniforms['resolution'].value.y = 1 / (canvas.offsetHeight * pixelRatio);

  // composer = new EffectComposer(renderer);
  // composer.addPass(renderPass);
  // composer.addPass(fxaaPass);
  // composer.addPass(ssaoPass);

  //LOADJSON
  JSONLoader();

  // MODAL

  //don't display the video
  video_container.style.display = "none";

  //change title
  title.innerHTML = "Info not available";
  text.innerHTML = "Oops, we couldn't find this info, try moving around a bit and hitting space again, or try another sign!";

  //don't display link or students
  link.style.display = "none";
  students.style.display = "none";
}

//load JSON data
function loadJSON(callback) {

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', 'projects.json', true); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);

}

function JSONLoader() {
  loadJSON(function (response) {
    // Parse JSON string into object

    setInterval(() => {
      project_data = JSON.parse(response);
    }, 1000);

  });
}

function putDataInModal(){
  //console.log(project_data);

  trigger = false;

  for (var project in project_data) {

    //console.log(collisionName);
    var collisionNameShortened = collisionName.split('_');
    //console.log(collisionNameShortened[1]);

    //let myString = "welcome_0";
    //let myVariable = "welcome";

    let myReg = new RegExp("trigger_" + collisionNameShortened[1], 'gi');
    //let myMatch = myString.match(myReg);
    //console.log('hi' + myMatch);

    if (project_data[project].id.match(myReg)) {

      console.log('match' + project_data[project].id);

      var video_link = project_data[project].video_link;
      var video_id = video_link.substr(video_link.lastIndexOf('/') + 1);

      //check if video
      if (video_link) {
        video_container.style.display = "block";
        video.src = '//player.vimeo.com/video/' + video_id;
      }
      else {
        video_container.style.display = "none";
      }

      //check if project name and client
      if (project_data[project].project && project_data[project].client) {
        title.innerHTML = project_data[project].project + " - " + project_data[project].client;
      }
      else if (project_data[project].project) {
        title.innerHTML = project_data[project].project;
      }
      else if (project_data[project].client) {
        title.innerHTML = project_data[project].client;
      }

      //check if external link
      if (project_data[project].external_link) {
        link.style.display = "block";
        link.href = project_data[project].external_link;
      }
      else {
        link.style.display = "none";
      }

      if (project_data[project].Students) {
        students.style.display = "block";
        students.innerHTML = project_data[project].Students;
      }
      else {
        students.style.display = "none";
      }

      text.innerHTML = project_data[project].Text;

    }
  }
}

function openModal() {

  putDataInModal();

  var project_view = document.getElementById("project_view_overlay");
  project_view.style.display = "block";
  setTimeout(function () { project_view.classList.add("visible"); }, 100);
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
    var collisionResults = ray.intersectObjects(collidableMeshList, true);

    if (collisionResults.length > 0){

      collisionName = collisionResults[0].object.name;
      var staircase = collisionName.match(/\b(\w*stair\w*)\b/g);
      var floor = collisionName.match(/\b(\w*floor\w*)\b/g);
      var footwalk = collisionName.match(/\b(\w*footwalk\w*)\b/g);

      if (collisionResults[0].point.y) {
        if (floor || staircase || footwalk){
          MovingCube.position.y = collisionResults[0].point.y + 0.9; //height of square
        }
      }

      if (collisionResults[0].distance <= directionVector.length() && !staircase && !floor && !footwalk){
        //console.log(collisionResults[0]);
        //console.log('frontal collision');
        console.log(collisionName);
        collided = true;
      }
      else {
        collided = false;
      }

      if (collisionName.match(/\b(\w*trigger\w*)\b/g)){
        //console.log('triggered!');
        trigger = true;
      }

    }

  }

  //keyboard movement
  var delta = clock.getDelta(); // seconds.
  var moveDistance = 5 * delta; // 200 pixels per second
  var rotateAngle = Math.PI / 3 * delta;   // pi/2 radians (90 degrees) per second

  // IF keyboard: set camera behind cube and move cube
  if (keyboard.pressed("up") || keyboard.pressed("down") || keyboard.pressed("left") || keyboard.pressed("right") || keyboard.pressed("space")) {

    // move forwards/backwards/left/right
    if (keyboard.pressed("up") && collided === false)
      MovingCube.translateZ(-moveDistance);
    if (keyboard.pressed("down"))
      MovingCube.translateZ(moveDistance);
    if (keyboard.pressed("left"))
      MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
    if (keyboard.pressed("right"))
      MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);
    if (keyboard.pressed("space") && trigger)
      openModal();

    relativeCameraOffset = new THREE.Vector3(0, 0.5, 2.8);
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
      //composer.setSize(width, height, false);
    }
    return needResize;
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
  //composer.render();

}

animate();