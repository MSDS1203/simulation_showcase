import * as THREE from 'three';

let app = {
  el: document.getElementById("app"),
  scene: null,
  renderer: null,
  camera: null
}

const cloudParticles = [];

const init = () => {
    app.renderer = new THREE.WebGLRenderer();
    console.log(app.renderer);
    app.renderer.setSize ( window.innerWidth, window.innerHeight);
    app.el.appendChild (app.renderer.domElement);

    app.scene = new THREE.Scene();
    app.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000 );
    app.camera.position.z = 1;
    app.camera.rotation.x = 1.16;
    app.camera.rotation.y = -0.12;
    app.camera.rotation.z = 0.27;

    app.scene.fog = new THREE.FogExp2(0x03544e, 0.0001);
    app.renderer.setClearColor(app.scene.fog.color);
    
    const ambient = new THREE.AmbientLight(0x555555, 0.75);
    app.scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0xff8c19);
    directionalLight.position.set(0.1, 0, 0);
    app.scene.add(directionalLight);

    const orangeLight = new THREE.PointLight(0xcc6600, 200, 450, 1.7);
    orangeLight.position.set(200, 300, 100);
    app.scene.add(orangeLight);

    const redLight = new THREE.PointLight(0xd8547e, 50, 450, 1.7);
    redLight.position.set(200, 300, 100);
    app.scene.add(redLight);

    const blueLight = new THREE.PointLight(0x3677ac, 50, 450, 1.7);
    blueLight.position.set(200, 300, -100);
    app.scene.add(blueLight);
    
    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load("smoke.png");
    const cloudGeo = new THREE.PlaneGeometry(500, 500);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudTexture, 
        transparent: true});

    for (let p = 0; p < 50; p++){
        let cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
        cloud.position.set(
            Math.random() * 800 - 400,
            500,
            Math.random() * 800 - 500
        );

        cloud.rotation.x = 1.16;
        cloud.rotation.y = -0.12;
        cloud.rotation.z = Math.random() * 2 * Math.PI;
        cloud.material.opacity = 0.35;
        cloudParticles.push(cloud);
        app.scene.add(cloud);
    }
};

const render = () => {
  cloudParticles.forEach(p =>{
    p.rotation.z -= 0.001;
  });
  requestAnimationFrame(render);
  app.renderer.render(app.scene, app.camera);
};

init();
render();