import * as THREE from 'three';
import * as POSTPROCESSING from 'postprocessing';

let app = {
  el: document.getElementById("app"),
  scene: null,
  renderer: null,
  composer: null,
  camera: null
}

const cloudParticles = [];

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

    const orangeLight = new THREE.PointLight(0xcc6600, 700000);
    orangeLight.position.set(-200, 300, -100);
    app.scene.add(orangeLight);

    const redLight = new THREE.PointLight(0xd8547e, 700000);
    redLight.position.set(0, 300, -100);
    app.scene.add(redLight);

    const blueLight = new THREE.PointLight(0x3677ac, 700000);
    blueLight.position.set(500, 300, 0);
    app.scene.add(blueLight);

    const directionalLight = new THREE.DirectionalLight(0xff8c19);
    directionalLight.position.set(0, 0, 1);
    app.scene.add(directionalLight);

    app.scene.fog = new THREE.FogExp2(0x03544e, 0.001);
    app.renderer.setClearColor(app.scene.fog.color);
    
    const textureLoader = new THREE.TextureLoader();

    const starTexture = textureLoader.load("stars.jpg");
    const starEffect = new POSTPROCESSING.TextureEffect({
        blendFunction: POSTPROCESSING.BlendFunction.COLOR_DODGE,
        texture: starTexture,
    });
    starEffect.blendMode.opacity.value = 0.2;

    const cloudTexture = textureLoader.load("smoke.png");
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
            Math.random() * 800 - 400
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

const render = () => {
  cloudParticles.forEach(p =>{
    p.rotation.z -= 0.002;
  });
  app.composer.render(0.1);
  requestAnimationFrame(render);
};

init();
render();