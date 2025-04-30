import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

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
  roomSize: { width: 15, height: 5, depth: 15 },
  wallThickness: 0.5,
  playerRadius: 0.5
};

const textureLoader = new THREE.TextureLoader();
const exrLoader = new EXRLoader();

const init = async () => {
  app.renderer = new THREE.WebGLRenderer({ antialias: true });
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.el.appendChild(app.renderer.domElement);
  app.renderer.domElement.oncontextmenu = (e) => e.preventDefault();
  app.renderer.domElement.style.cursor = "none";

  app.scene = new THREE.Scene();
  app.scene.background = new THREE.Color(0xaaaaaa);

  // Enhanced lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  app.scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  app.scene.add(directionalLight);

  app.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  app.camera.position.set(0, 2, 5);

  await createFloor();

  // Walls with textures
  await createWalls();

  // Event listeners
  window.addEventListener('resize', onWindowResize);
  app.renderer.domElement.addEventListener('mousedown', onMouseDown);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
};

const createFloor = async () => {
  try {
    const [diffuseMap, displacementMap, normalMap, roughnessMap] = await Promise.all([
      textureLoader.loadAsync("textures/wood_floor_diff_4k.jpg"),
      textureLoader.loadAsync("textures/wood_floor_disp_4k.png"),
      exrLoader.loadAsync("textures/wood_floor_nor_gl_4k.exr"),
      exrLoader.loadAsync("textures/wood_floor_rough_4k.exr")
    ]);

    [diffuseMap, displacementMap, normalMap, roughnessMap].forEach(map => {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      const repeatX = app.roomSize.width / 5;
      const repeatY = app.roomSize.depth / 5;
      map.repeat.set(repeatX, repeatY);
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      displacementMap: displacementMap,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      displacementScale: 0.05,
      side: THREE.DoubleSide
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(app.roomSize.width, app.roomSize.depth, 100, 100),
      floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    app.scene.add(floor);
    app.floorHeight = floor.position.y;

  } catch (error) {
    console.error("Error loading floor textures:", error);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(app.roomSize.width, app.roomSize.depth),
      new THREE.MeshStandardMaterial({ color: 0x808080 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    app.scene.add(floor);
    app.floorHeight = floor.position.y;
  }
};


async function createWalls() {
  try {
    // First try with just diffuse map
    const diffuseMap = await textureLoader.loadAsync("textures/plastered_wall_04_diff_4k.jpg");
    console.log("Diffuse texture loaded successfully");

    // Create initial test material
    const testMaterial = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      side: THREE.DoubleSide
    });

    // Load other textures if diffuse works
    const displacementMap = await textureLoader.loadAsync("textures/plastered_wall_04_disp_4k.png");
    const normalMap = await exrLoader.loadAsync("textures/plastered_wall_04_nor_gl_4k.exr");
    const roughnessMap = await exrLoader.loadAsync("textures/plastered_wall_04_rough_4k.exr");

    // Configure textures
    [diffuseMap, displacementMap, normalMap, roughnessMap].forEach(map => {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(app.roomSize.width / 4, app.roomSize.height / 4);
    });

    // Final PBR material
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      displacementMap: displacementMap,
      displacementScale: 0.05,
      side: THREE.DoubleSide
    });

    const walls = [
      // North wall
      { 
        position: [0, app.roomSize.height/2, app.roomSize.depth/2], 
        size: [app.roomSize.width, app.roomSize.height, app.wallThickness],
        rotation: [0, 0, 0] 
      },
      // South wall
      { 
        position: [0, app.roomSize.height/2, -app.roomSize.depth/2], 
        size: [app.roomSize.width, app.roomSize.height, app.wallThickness],
        rotation: [0, Math.PI, 0] 
      },
      // East wall
      { 
        position: [app.roomSize.width/2, app.roomSize.height/2, 0], 
        size: [app.wallThickness, app.roomSize.height, app.roomSize.depth],
        rotation: [0, Math.PI/2, 0] 
      },
      // West wall
      { 
        position: [-app.roomSize.width/2, app.roomSize.height/2, 0], 
        size: [app.wallThickness, app.roomSize.height, app.roomSize.depth],
        rotation: [0, -Math.PI/2, 0] 
      }
    ];

    walls.forEach(wall => {
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(...wall.size),
        wallMaterial.clone()
      );
      wallMesh.position.set(...wall.position);
      wallMesh.rotation.set(...wall.rotation);
      wallMesh.receiveShadow = true;
      wallMesh.castShadow = true;
      app.scene.add(wallMesh);
    });

  } catch (error) {
    console.error("Error loading textures, using fallback material:", error);
    createBasicWalls();
  }
}

function createBasicWalls() {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const walls = [
    { position: [0, app.roomSize.height/2, app.roomSize.depth/2], size: [app.roomSize.width, app.roomSize.height, app.wallThickness] },
    { position: [0, app.roomSize.height/2, -app.roomSize.depth/2], size: [app.roomSize.width, app.roomSize.height, app.wallThickness] },
    { position: [app.roomSize.width/2, app.roomSize.height/2, 0], size: [app.wallThickness, app.roomSize.height, app.roomSize.depth] },
    { position: [-app.roomSize.width/2, app.roomSize.height/2, 0], size: [app.wallThickness, app.roomSize.height, app.roomSize.depth] }
  ];

  walls.forEach(wall => {
    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(...wall.size),
      wallMaterial
    );
    wallMesh.position.set(...wall.position);
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

// Initialize and start the app
init().then(() => {
  render();
}).catch(error => {
  console.error("Initialization failed:", error);
});