// Inspired by nebula simulation from Red Stapler on YouTube: https://www.youtube.com/watch?v=5f5wwQb22tE&t=392s
// Slider code from W3Schools: https://www.w3schools.com/howto/howto_js_rangeslider.asp
// Code for dragging clouds from ThreeJS Tutorial on Raycaster (https://threejs.org/docs/#api/en/core/Raycaster) and CoPilot

import * as THREE from 'three';
import * as POSTPROCESSING from 'postprocessing';

// Event listener for the home button
document.getElementById("homeButton").addEventListener("click", () => {
  window.location.href = "../home.html";
});

// Event listener for the light slider
let slider = document.getElementById("lightRange");
let brightness = slider.value;

slider.oninput = function() {
  brightness = this.value;
}

// Initalizing the app object
let app = {
  el: document.getElementById("app"),
  scene: null,
  renderer: null,
  composer: null,
  camera: null
}

// Set global variables cloud array, point lights, and raycaster 
const cloudParticles = [];
let blueLight = new THREE.PointLight(0x3677ac, 700000);
let orangeLight = new THREE.PointLight(0xcc6600, 700000);
let redLight = new THREE.PointLight(0xd8547e, 700000);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Function to get mouse position
function onPointerMove( event ) {

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

const init = () => {
  // Set up the scene, camera, and renderer
    app.renderer = new THREE.WebGLRenderer();
    app.renderer.setSize ( window.innerWidth, window.innerHeight);
    app.el.appendChild (app.renderer.domElement);

    app.scene = new THREE.Scene();
    app.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000 );
    app.camera.position.z = 1;
    app.camera.rotation.x = 1.16;
    app.camera.rotation.y = -0.12;
    app.camera.rotation.z = 0.27;

    // Set up lights
    const ambient = new THREE.AmbientLight(0x555555);
    app.scene.add(ambient);

    let orangeLightx = Math.random() * 500 - 300;
    let orangeLightz = Math.random() * 500 - 300;
    orangeLight.position.set(orangeLightx, 300, orangeLightz);
    app.scene.add(orangeLight);

    let redLightx = Math.random() * 500 - 300;
    let redLightz = Math.random() * 500 - 300;
    while (redLightx == orangeLightx){
      redLightx += 500;
    }
    while (redLightz == orangeLightz){
      redLightz += 500;
    }
    redLight.position.set(redLightx, 300, redLightz);
    app.scene.add(redLight);

    let blueLightx = Math.random() * 500 - 300;
    let blueLightz = Math.random() * 500 - 300;
    while (blueLightx == redLightx || blueLightx == orangeLightx){
      blueLightx += 500;
    }
    while (blueLightz == orangeLightz || blueLightz == redLightz){
      blueLightz += 500;
    }
    blueLight.position.set(blueLightx, 300, blueLightz);
    app.scene.add(blueLight);

    const directionalLight = new THREE.DirectionalLight(0xff8c19, 1);
    directionalLight.position.set(0, 0, 1);
    app.scene.add(directionalLight);

    // Add fog
    app.scene.fog = new THREE.FogExp2(0x000001, 0.001);
    app.renderer.setClearColor(app.scene.fog.color);
    
    const textureLoader = new THREE.TextureLoader();

    // Add stars using postprocessing
    const starTexture = textureLoader.load("./stars.jpg");
    const starEffect = new POSTPROCESSING.TextureEffect({
        blendFunction: POSTPROCESSING.BlendFunction.COLOR_DODGE,
        texture: starTexture,
    });
    starEffect.blendMode.opacity.value = 0.2;

    // Clouds to shape nebula
    const cloudTexture = textureLoader.load("./smoke.png");
    const cloudGeo = new THREE.PlaneGeometry(500, 500);
    const cloudMaterial = new THREE.MeshLambertMaterial({
        map: cloudTexture, 
        transparent: true,
        emissive: 0x222222, 
        emissiveIntensity: 0.5,});

    for (let p = 0; p < 70; p++){
        const cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
        cloud.position.set(
            Math.random() * 800 - 400,
            500,
            Math.random() * 500 - 500
        );

        cloud.rotation.x = 1.16;
        cloud.rotation.y = -0.12;
        cloud.rotation.z = Math.random() * 2 * Math.PI;
        cloud.material.opacity = 0.55;
        cloudParticles.push(cloud);
        app.scene.add(cloud);
    }

    // Add post processing effects to scene and use as renderer
    const bloomEffect = new POSTPROCESSING.BloomEffect({
        blendFunction: POSTPROCESSING.BlendFunction.COLOR_DODGE,
        kernelSize: POSTPROCESSING.KernelSize.SMALL,
        useLuminanceFilter: true,
        luminanceThreshold: 0.3,
        luminanceSmoothing: 0.75
    });
    bloomEffect.blendMode.opacity.value = 1.5;

    const effectPass = new POSTPROCESSING.EffectPass(app.camera, bloomEffect, starEffect);
    effectPass.renderToScreen = true;

    app.composer = new POSTPROCESSING.EffectComposer(app.renderer);
    app.composer.addPass(new POSTPROCESSING.RenderPass(app.scene, app.camera));
    app.composer.addPass(effectPass);
};

// Move clouds based on arrow key pressed
let targetRotation = 0.001;
let rotationSpeed = 0.001;
let mvmntx = 0;
let mvmntz = 0;

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    targetRotation = -0.01;
    mvmntx = -0.01;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowRight') {
    targetRotation = 0.001;
    mvmntx = 0;
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    targetRotation = 0.01;
    mvmntx = 0.01;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft') {
    targetRotation = 0.001;
    mvmntx = 0;
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') {
    targetRotation = 0.01;
    mvmntz = -0.01;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp') {
    targetRotation = 0.001;
    mvmntz = 0;
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    targetRotation = -0.01;
    mvmntz = 0.01;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowDown') {
    targetRotation = 0.001;
    mvmntz = 0;
  }
});

window.addEventListener('pointermove', onPointerMove);

// Move clouds with mouse drag
let dragging = false;

window.addEventListener('mousedown', () => {
  dragging = true;
});

window.addEventListener('mouseup', () => {
  dragging = false;
});

const moveClouds = () => {
  if (dragging) {
    raycaster.setFromCamera(pointer, app.camera);

    const intersects = raycaster.intersectObjects(
      cloudParticles.filter(cloud => cloud.isMesh)
    );
  
    for (let i = 0; i < intersects.length; i++) {
      const cloud = intersects[i].object;
  
      const direction = new THREE.Vector3()
        .subVectors(cloud.position, app.camera.position)
        .normalize();

      const distance = cloud.position.distanceTo(app.camera.position);

      const scalar = Math.max(5, 50 / distance);
      cloud.position.add(direction.multiplyScalar(scalar));

      cloud.position.x = Math.max(-400, Math.min(400, cloud.position.x));
      cloud.position.y = Math.max(-200, Math.min(500, cloud.position.y));
      cloud.position.z = Math.max(-500, Math.min(500, cloud.position.z));
    }
  }
}

const render = () => {

  // Update cloud and light positions based on arrow keys movement
  rotationSpeed += ( targetRotation  - rotationSpeed ) * 0.1;

  cloudParticles.forEach(p =>{
    p.rotation.z -= rotationSpeed;
    p.position.x -= mvmntx;
    blueLight.position.x -= mvmntx;
    orangeLight.position.x -= mvmntx;
    redLight.position.x -= mvmntx;

    p.position.z -= mvmntz;
    blueLight.position.z -= mvmntz;
    orangeLight.position.z -= mvmntz;
    redLight.position.z -= mvmntz;
  });

  // Update light intensity based on slider value
  blueLight.intensity = brightness;
  orangeLight.intensity = brightness; 
  redLight.intensity = brightness;

  moveClouds();
  app.composer.render(0.1);
  requestAnimationFrame(render);
};

init();
render();