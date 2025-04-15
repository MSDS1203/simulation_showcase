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
};

const render = () => {
  requestAnimationFrame(render);
  app.renderer.render(app.scene, app.camera);
};

init();
render();
