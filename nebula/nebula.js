import * as THREE from 'three';
import * as POSTPROCESSING from 'postprocessing';

document.getElementById("homeButton").addEventListener("click", () => {
  window.location.href = "../home.html";
});

let app = {
  el: document.getElementById("app"),
  scene: null,
  renderer: null,
  composer: null,
  camera: null
}

const cloudParticles = [];
const blueLight = new THREE.PointLight(0x3677ac, 700000);
const orangeLight = new THREE.PointLight(0xcc6600, 700000);
const redLight = new THREE.PointLight(0xd8547e, 700000);

const init = () => {
    app.renderer = new THREE.WebGLRenderer();
    app.renderer.setSize ( window.innerWidth, window.innerHeight);
    app.el.appendChild (app.renderer.domElement);

    app.scene = new THREE.Scene();
    app.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000 );
    app.camera.position.z = 1;
    app.camera.rotation.x = 1.16;
    app.camera.rotation.y = -0.12;
    app.camera.rotation.z = 0.27;

    const ambient = new THREE.AmbientLight(0x555555);
    app.scene.add(ambient);

    let orangeLightx = Math.random() * 500 - 300;
    let orangeLightz = Math.random() * 500 - 300;
    orangeLight.position.set(orangeLightx, 300, orangeLightz);
    app.scene.add(orangeLight);

    let redLightx = Math.random() * 500 - 300;
    let redLightz = Math.random() * 500 - 300;
    while (redLightx == orangeLightx){
      redLightx += 300;
    }
    while (redLightz == orangeLightz){
      redLightz += 300;
    }
    redLight.position.set(redLightx, 300, redLightz);
    app.scene.add(redLight);

    let blueLightx = Math.random() * 500 - 300;
    let blueLightz = Math.random() * 500 - 300;
    while (blueLightx == redLightx || blueLightx == orangeLightx){
      blueLightx += 300;
    }
    while (blueLightz == orangeLightz || blueLightz == redLightz){
      blueLightz += 300;
    }
    blueLight.position.set(blueLightx, 300, blueLightz);
    app.scene.add(blueLight);

    const directionalLight = new THREE.DirectionalLight(0xff8c19, 1);
    directionalLight.position.set(0, 0, 1);
    app.scene.add(directionalLight);

    app.scene.fog = new THREE.FogExp2(0x000001, 0.001);
    app.renderer.setClearColor(app.scene.fog.color);
    
    const textureLoader = new THREE.TextureLoader();

    const starTexture = textureLoader.load("./stars.jpg");
    const starEffect = new POSTPROCESSING.TextureEffect({
        blendFunction: POSTPROCESSING.BlendFunction.COLOR_DODGE,
        texture: starTexture,
    });
    starEffect.blendMode.opacity.value = 0.2;

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

let targetRotation = 0.001;
let rotationSpeed = 0.001;
let mvmntx = 0;
let mvmntz = 0;

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    console.log("Key pressed");
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
    console.log("Key pressed");
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
    console.log("Key pressed");
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
    console.log("Key pressed");
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

const render = () => {
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
  app.composer.render(0.1);
  requestAnimationFrame(render);
};

init();
render();