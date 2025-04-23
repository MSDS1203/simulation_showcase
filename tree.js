import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let app = {
  el: document.getElementById("app"),
  scene: null,
  renderer: null,
  camera: null
}

const init = () => {
    app.renderer = new THREE.WebGLRenderer();
    console.log(app.renderer);
    app.renderer.setSize ( window.innerWidth, window.innerHeight);
    app.el.appendChild (app.renderer.domElement);

    app.scene = new THREE.Scene();
    app.camera =  new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const textureLoader = new THREE.TextureLoader();

    // Adding a sky
    const skyTexture = textureLoader.load('sky.jpg');
    const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    app.scene.add(sky);

    // Adding a ground
    const groundGeometry = new THREE.PlaneGeometry( 1, 1 );
    const groundMaterial = new THREE.MeshBasicMaterial( {color: 0x73b504, side: THREE.DoubleSide} );
    const ground = new THREE.Mesh( groundGeometry, groundMaterial );
    app.scene.add( ground );
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -15; 
    ground.scale.set(1000, 1000, 1); 

    // Add a trunk to the scene
    const geometry = new THREE.CylinderGeometry( 2, 4, 30, 32 ); 
    const material = new THREE.MeshLambertMaterial( {color: 0x8e6347} ); 
    const trunk = new THREE.Mesh( geometry, material ); 
    app.scene.add( trunk );
    trunk.position.y = 0; 

    // Move camera
    app.camera.position.set(0, 20, 40);
    app.camera.lookAt(0, 0, 0);

    // Add white light to the scene
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 5, 10);
    app.scene.add(light);

    // For moving the tree around
    app.controls = new OrbitControls(app.camera, app.renderer.domElement);
};

const render = () => {
  requestAnimationFrame(render);
  app.renderer.render(app.scene, app.camera);
};

init();
render();
