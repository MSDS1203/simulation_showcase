import * as THREE from 'three';

let app = {
  el: document.getElementById("app"),
  scene: null,
  renderer: null,
  camera: null,
  pointerLocked: false,
  moveSpeed: 0.05, // Slower movement speed
  rotationSpeed: 0.002, // Rotation speed
  velocity: new THREE.Vector3(), // Store velocity for smooth movement
  gravity: -0.02, // Gravity strength
  jumpSpeed: 0.2, // Jump speed
  grounded: false, // Is the camera on the ground
  keysPressed: {}, // Track keys pressed
  floorHeight: 0, // Height of the ground
};

const init = () => {
  app.renderer = new THREE.WebGLRenderer({ antialias: true });
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.el.appendChild(app.renderer.domElement);
  app.renderer.domElement.oncontextmenu = (e) => e.preventDefault(); // Disable right-click context menu
  app.renderer.domElement.style.cursor = "none"; // Hide cursor

  app.scene = new THREE.Scene();
  app.scene.background = new THREE.Color(0xaaaaaa);

  app.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  app.camera.position.set(0, 2, 5); // Ensure the camera starts above the floor (y = 2)

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  app.scene.add(light);

  // Room (box with inverted normals)
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, side: THREE.BackSide });
  const room = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 10), wallMaterial);
  room.position.y = 2.5;
  app.scene.add(room);

  // Floor (ground) with collision
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  floor.rotation.x = -Math.PI / 2;
  app.scene.add(floor);
  app.floorHeight = floor.position.y; // Store the height of the ground

  // Event listeners
  window.addEventListener('resize', onWindowResize);
  app.renderer.domElement.addEventListener('mousedown', onMouseDown);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
};

const onMouseDown = (e) => {
  if (e.button === 0) { // Left click
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

  app.camera.rotation.order = "YXZ"; // yaw-pitch-roll order
  app.camera.rotation.y -= dx * app.rotationSpeed;
  app.camera.rotation.x -= dy * app.rotationSpeed;

  // Clamp vertical rotation
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

  // Get the camera's direction vectors
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(app.camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(app.camera.quaternion);

  // Movement vectors
  const moveForward = new THREE.Vector3();
  const moveRight = new THREE.Vector3();

  if (app.keysPressed['w']) moveForward.addScaledVector(forward, app.moveSpeed);
  if (app.keysPressed['s']) moveForward.addScaledVector(forward, -app.moveSpeed);
  if (app.keysPressed['a']) moveRight.addScaledVector(right, -app.moveSpeed);
  if (app.keysPressed['d']) moveRight.addScaledVector(right, app.moveSpeed);

  // Gravity and ground collision
  const cameraHeight = 1.8; // Approximate height of the player (eyes at y=1.8)
  const groundLevel = app.floorHeight;
  
  // Check if the camera's "feet" (y=0.0) hit the ground
  if (app.camera.position.y - cameraHeight <= groundLevel) {
    app.velocity.y = 0; // Stop falling
    app.camera.position.y = groundLevel + cameraHeight; // Snap to ground level
    app.grounded = true;
  } else {
    app.velocity.y += app.gravity; // Apply gravity if in the air
    app.grounded = false;
  }

  // Jumping (only if grounded)
  if (app.keysPressed[' '] && app.grounded) {
    app.velocity.y = app.jumpSpeed;
    app.grounded = false;
  }

  // Apply movement
  app.camera.position.add(moveForward);
  app.camera.position.add(moveRight);
  app.camera.position.y += app.velocity.y;
};

const onWindowResize = () => {
  app.camera.aspect = window.innerWidth / window.innerHeight;
  app.camera.updateProjectionMatrix();
  app.renderer.setSize(window.innerWidth, window.innerHeight);
};

const render = () => {
  requestAnimationFrame(render);
  moveCamera(); // Update camera position based on keys
  app.renderer.render(app.scene, app.camera);
};

init();
render();
