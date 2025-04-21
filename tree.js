// Template from https://codesandbox.io/p/sandbox/threejs-starter-template-96kxr?file=%2Fsrc%2Findex.js

import * as THREE from 'three';

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

  // Add blue sphere to the scene
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const sphere = new THREE.Mesh(geometry, material);
  app.scene.add(sphere);

  // Move camera to view the sphere
  app.camera.position.z = 5;

  // Add white light to the scene
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 5, 10);
  app.scene.add(light);

};

const render = () => {
  requestAnimationFrame(render);
  app.renderer.render(app.scene, app.camera);
};

init();
render();
