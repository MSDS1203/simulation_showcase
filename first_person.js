import * as THREE from 'three';

let app = {
  el: document.getElementById("app"),
  scene: null,
  renderer: null,
  camera: null,
  pointerLocked: false,
  moveSpeed: 0.05,
  rotationSpeed: 0.002,
  velocity: new THREE.Vector3(),
  gravity: -0.02,
  jumpSpeed: 0.2,
  grounded: false,
  keysPressed: {},
  floorHeight: 0,
  roomSize: { width: 10, height: 5, depth: 10 },
  wallThickness: 0.5,
  playerRadius: 0.5
};

const init = () => {
  app.renderer = new THREE.WebGLRenderer({ antialias: true });
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.el.appendChild(app.renderer.domElement);
  app.renderer.domElement.oncontextmenu = (e) => e.preventDefault();
  app.renderer.domElement.style.cursor = "none";

  app.scene = new THREE.Scene();
  app.scene.background = new THREE.Color(0xaaaaaa);

  app.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  app.camera.position.set(0, 2, 5);

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  app.scene.add(light);

  // Floor (ground)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(app.roomSize.width, app.roomSize.depth),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  floor.rotation.x = -Math.PI / 2;
  app.scene.add(floor);
  app.floorHeight = floor.position.y;

  // Add visible walls
  createWalls();

  // Event listeners
  window.addEventListener('resize', onWindowResize);
  app.renderer.domElement.addEventListener('mousedown', onMouseDown);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
};

function createWalls() {
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x999999,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });

  const walls = [
    { position: [0, app.roomSize.height/2, app.roomSize.depth/2], size: [app.roomSize.width, app.roomSize.height, app.wallThickness] }, // North
    { position: [0, app.roomSize.height/2, -app.roomSize.depth/2], size: [app.roomSize.width, app.roomSize.height, app.wallThickness] }, // South
    { position: [app.roomSize.width/2, app.roomSize.height/2, 0], size: [app.wallThickness, app.roomSize.height, app.roomSize.depth] }, // East
    { position: [-app.roomSize.width/2, app.roomSize.height/2, 0], size: [app.wallThickness, app.roomSize.height, app.roomSize.depth] } // West
  ];

  walls.forEach(wall => {
    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(...wall.size),
      wallMaterial
    );
    wallMesh.position.set(...wall.position);
    wallMesh.receiveShadow = true;
    app.scene.add(wallMesh);
  });
}

const checkWallCollision = (newPosition) => {
  const halfWidth = app.roomSize.width/2 - app.playerRadius;
  const halfDepth = app.roomSize.depth/2 - app.playerRadius;
  newPosition.x = THREE.MathUtils.clamp(newPosition.x, -halfWidth, halfWidth);
  newPosition.z = THREE.MathUtils.clamp(newPosition.z, -halfDepth, halfDepth);
  return newPosition;
};

const onMouseDown = (e) => {
  if (e.button === 0) {
    app.renderer.domElement.requestPointerLock();
  }
};

const onPointerLockChange = () => {
  app.pointerLocked = document.pointerLockElement === app.renderer.domElement;
};

const onMouseMove = (e) => {
  if (!app.pointerLocked) return;

  const dx = e.movementX || 0;
  const dy = e.movementY || 0;

  app.camera.rotation.order = "YXZ";
  app.camera.rotation.y -= dx * app.rotationSpeed;
  app.camera.rotation.x -= dy * app.rotationSpeed;

  const maxPitch = Math.PI / 2 - 0.01;
  app.camera.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, app.camera.rotation.x));
};

const onKeyDown = (e) => {
  app.keysPressed[e.key] = true;
};

const onKeyUp = (e) => {
  app.keysPressed[e.key] = false;
};

const moveCamera = () => {
  if (!app.pointerLocked) return;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(app.camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(app.camera.quaternion);

  const moveDirection = new THREE.Vector3();
  if (app.keysPressed['w']) moveDirection.addScaledVector(forward, app.moveSpeed);
  if (app.keysPressed['s']) moveDirection.addScaledVector(forward, -app.moveSpeed);
  if (app.keysPressed['a']) moveDirection.addScaledVector(right, -app.moveSpeed);
  if (app.keysPressed['d']) moveDirection.addScaledVector(right, app.moveSpeed);

  const newPosition = app.camera.position.clone().add(moveDirection);

  const cameraHeight = 1.8;
  const feetPosition = newPosition.y - cameraHeight;

  if (feetPosition <= app.floorHeight) {
    app.velocity.y = 0;
    newPosition.y = app.floorHeight + cameraHeight;
    app.grounded = true;
  } else {
    app.velocity.y += app.gravity;
    app.grounded = false;
  }

  if (app.keysPressed[' '] && app.grounded) {
    app.velocity.y = app.jumpSpeed;
    app.grounded = false;
  }

  newPosition.y += app.velocity.y;

  const clampedPosition = checkWallCollision(newPosition);
  app.camera.position.copy(clampedPosition);
};

const onWindowResize = () => {
  app.camera.aspect = window.innerWidth / window.innerHeight;
  app.camera.updateProjectionMatrix();
  app.renderer.setSize(window.innerWidth, window.innerHeight);
};

const render = () => {
  requestAnimationFrame(render);
  moveCamera();
  app.renderer.render(app.scene, app.camera);
};

init();
render();
