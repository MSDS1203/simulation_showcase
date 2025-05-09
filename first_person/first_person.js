import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


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

let totalAssets = 21; // Total number of assets to load
let loadedAssets = 0;

function updateProgress() {
  if (loadedAssets >= totalAssets - 1) {
    loadedAssets = totalAssets;
  }

  const percent = Math.round(loadedAssets / totalAssets * 100);
  document.getElementById('loading-progress').textContent = `Loading... ${percent}%`;
  document.getElementById('loading-bar-progress').style.width = `${percent}%`;

  if (percent === 100) {
    setTimeout(() => {
      document.getElementById('loading-container').style.opacity = '0';
      setTimeout(() => {
        document.getElementById('loading-container').style.display = 'none';
      }, 500);
    }, 500);
  }
}

const loadingManager = new THREE.LoadingManager(
  () => console.log("All textures loaded"),
  (item, loaded, total) => console.log(`Loading ${item}: ${(loaded / total * 100).toFixed(0)}%`),
  (error) => console.error("Error loading:", error)
);

const textureLoader = new THREE.TextureLoader(loadingManager);
const exrLoader = new EXRLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);

const init = async () => {
  app.renderer = new THREE.WebGLRenderer({ antialias: true });
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.el.appendChild(app.renderer.domElement);
  app.renderer.domElement.oncontextmenu = (e) => e.preventDefault();
  app.renderer.domElement.style.cursor = "none";

  app.scene = new THREE.Scene();
  app.scene.background = new THREE.Color(0xaaaaaa);

 // Reduce ambient light further
  const ambientLight = new THREE.AmbientLight(0x404040, 0.15); // Was 0.3
  app.scene.add(ambientLight);

  app.renderer.shadowMap.enabled = true;
  app.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  app.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  app.camera.position.set(0, 2, 5);

  const loadingTimeout = setTimeout(() => {
    if (loadedAssets < totalAssets) {
      console.warn("Loading timeout - forcing completion");
      loadedAssets = totalAssets;
      updateProgress();
    }
  }, 10000);

  await createFloor();
  await createWalls();
  await addFurniture();
  await loadRoom();

  clearTimeout(loadingTimeout);

  window.addEventListener('resize', onWindowResize);
  app.renderer.domElement.addEventListener('mousedown', onMouseDown);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.getElementById('home').addEventListener('click', () => {
    if (app.pointerLocked) {
      document.exitPointerLock();
    }
    window.location.href = '/simulation_showcase';
  });
  
};

const createFloor = async () => {
  try {
    const [diffuseMap, displacementMap, normalMap, roughnessMap] = await Promise.all([
      textureLoader.loadAsync("public/textures/wood_floor_deck_diff_4k.jpg"),
      textureLoader.loadAsync("public/textures/wood_floor_deck_disp_4k.png"),
      exrLoader.loadAsync("public/textures/wood_floor_deck_nor_gl_4k.exr"),
      exrLoader.loadAsync("public/textures/wood_floor_deck_rough_4k.exr")
    ]);

    [diffuseMap, displacementMap, normalMap, roughnessMap].forEach(map => {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(app.roomSize.width / 5, app.roomSize.depth / 5);
    });

    loadedAssets += 4;
    updateProgress();

    const floorMaterial = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      displacementMap,
      normalMap,
      roughnessMap,
      displacementScale: 0.05,
      side: THREE.DoubleSide
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(app.roomSize.width, app.roomSize.depth, 100, 100),
      floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = 0;
    app.scene.add(floor);
    app.floorHeight = floor.position.y;

  } catch (error) {
    console.error("Error loading floor textures:", error);
    const fallback = new THREE.Mesh(
      new THREE.PlaneGeometry(app.roomSize.width, app.roomSize.depth),
      new THREE.MeshStandardMaterial({ color: 0x808080 })
    );
    fallback.rotation.x = -Math.PI / 2;
    fallback.position.y = 0;
    fallback.receiveShadow = true;
    app.scene.add(fallback);
    app.floorHeight = 0;
  }
};

async function createWalls() {
  try {
    // Load textures with proper error handling
    const [diffuseMap, displacementMap, normalMap, roughnessMap] = await Promise.all([
      textureLoader.loadAsync("public/textures/plastered_stone_wall_diff_4k.jpg").catch(() => null),
      textureLoader.loadAsync("public/textures/plastered_stone_wall_disp_4k.png").catch(() => null),
      exrLoader.loadAsync("public/textures/plastered_stone_wall_nor_gl_4k.exr").catch(() => null),
      exrLoader.loadAsync("public/textures/plastered_stone_wall_rough_4k.exr").catch(() => null)
    ]);

    // Create material with fallbacks
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      normalMap: normalMap || undefined,
      roughnessMap: roughnessMap || undefined,
      displacementMap: displacementMap || undefined,
      displacementScale: 0.05,
      side: THREE.DoubleSide,
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1
    });

    // Configure texture wrapping if textures loaded
    [diffuseMap, normalMap, roughnessMap, displacementMap].forEach(map => {
      if (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
      }
    });

    loadedAssets += 4;
    updateProgress();

    // Define walls with precise positioning
    const walls = [
      // Front wall (Z+)
      { 
        position: [0, app.roomSize.height/2, app.roomSize.depth/2 - app.wallThickness/2],
        size: [app.roomSize.width, app.roomSize.height, app.wallThickness],
        uvScale: [app.roomSize.width / 4, app.roomSize.height / 4]
      },
      // Back wall (Z-)
      { 
        position: [0, app.roomSize.height/2, -app.roomSize.depth/2 + app.wallThickness/2],
        size: [app.roomSize.width, app.roomSize.height, app.wallThickness],
        uvScale: [app.roomSize.width / 4, app.roomSize.height / 4]
      },
      // Right wall (X+)
      { 
        position: [app.roomSize.width/2 - app.wallThickness/2, app.roomSize.height/2, 0],
        size: [app.wallThickness, app.roomSize.height, app.roomSize.depth - app.wallThickness*2],
        uvScale: [(app.roomSize.depth - app.wallThickness*2) / 4, app.roomSize.height / 4]
      },
      // Left wall (X-)
      { 
        position: [-app.roomSize.width/2 + app.wallThickness/2, app.roomSize.height/2, 0],
        size: [app.wallThickness, app.roomSize.height, app.roomSize.depth - app.wallThickness*2],
        uvScale: [(app.roomSize.depth - app.wallThickness*2) / 4, app.roomSize.height / 4]
      }
    ];

    // Create each wall with proper UV mapping
    walls.forEach(wall => {
      const geometry = new THREE.BoxGeometry(...wall.size);
      
      // Manually adjust UVs to prevent stretching
      const uvAttribute = geometry.attributes.uv;
      for (let i = 0; i < uvAttribute.count; i++) {
        const u = uvAttribute.getX(i);
        const v = uvAttribute.getY(i);
        uvAttribute.setXY(i, u * wall.uvScale[0], v * wall.uvScale[1]);
      }
      
      const material = wallMaterial.clone();
      
      // Set texture repeat for each map
      if (material.map) material.map.repeat.set(wall.uvScale[0], wall.uvScale[1]);
      if (material.normalMap) material.normalMap.repeat.set(wall.uvScale[0], wall.uvScale[1]);
      if (material.roughnessMap) material.roughnessMap.repeat.set(wall.uvScale[0], wall.uvScale[1]);
      if (material.displacementMap) material.displacementMap.repeat.set(wall.uvScale[0], wall.uvScale[1]);
      
      const wallMesh = new THREE.Mesh(geometry, material);
      wallMesh.position.set(...wall.position);
      wallMesh.receiveShadow = true;
      wallMesh.castShadow = true;
      app.scene.add(wallMesh);
    });

  } catch (error) {
    console.error("Error creating walls:", error);
  }
}

async function loadRoom() {
  try {
    // Load wall textures for the roof
    const [diffuseMap, displacementMap, normalMap, roughnessMap] = await Promise.all([
      textureLoader.loadAsync("public/textures/plastered_stone_wall_diff_4k.jpg").catch(() => null),
      textureLoader.loadAsync("public/textures/plastered_stone_wall_disp_4k.png").catch(() => null),
      exrLoader.loadAsync("public/textures/plastered_stone_wall_nor_gl_4k.exr").catch(() => null),
      exrLoader.loadAsync("public/textures/plastered_stone_wall_rough_4k.exr").catch(() => null)
    ]);

    // Configure texture wrapping if loaded
    [diffuseMap, displacementMap, normalMap, roughnessMap].forEach(map => {
      if (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(app.roomSize.width / 4, app.roomSize.depth / 4);
      }
    });

    // Create roof with textures
    const roofMaterial = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      displacementMap: displacementMap,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      displacementScale: 0.05,
      side: THREE.DoubleSide,
      roughness: 0.5,  // Reduced for better light reflection
      metalness: 0.2
    });

    const roofGeometry = new THREE.BoxGeometry(
      app.roomSize.width, 
      0.5, // Thickness
      app.roomSize.depth
    );
    
    // Adjust UVs to prevent stretching
    const uvAttribute = roofGeometry.attributes.uv;
    const uvScale = [app.roomSize.width / 4, app.roomSize.depth / 4];
    for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i);
      const v = uvAttribute.getY(i);
      uvAttribute.setXY(i, u * uvScale[0], v * uvScale[1]);
    }

    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = app.roomSize.height - 0.25;
    roof.receiveShadow = true;
    roof.castShadow = false;
    app.scene.add(roof);

  } catch (error) {
    console.error("Error creating roof:", error);
    // Fallback basic roof if texture loading fails
    const roofGeometry = new THREE.BoxGeometry(
      app.roomSize.width, 
      0.5, 
      app.roomSize.depth
    );
    const roof = new THREE.Mesh(
      roofGeometry, 
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    );
    roof.position.y = app.roomSize.height - 0.25;
    app.scene.add(roof);
  }
}

async function addFurniture() {
  app.furniture = [];
  
  try {
    const gltf = await gltfLoader.loadAsync('public/models/sofa_02_4k.glb'); // adjust path
    const sofa = gltf.scene;
    sofa.scale.set(3.5, 2.5, 2.5);  
    sofa.position.set(1.5, app.floorHeight, -6);  // Place in room

    sofa.updateMatrixWorld(true);

    sofa.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    app.scene.add(sofa);
    const sofaBoundingBox = new THREE.Box3().setFromObject(sofa);
    app.furniture.push({ object: sofa, boundingBox: sofaBoundingBox });

    loadedAssets += 1;
    updateProgress();
  } catch (err) {
    console.error("Failed to load sofa model:", err);
  }

  try {
    const gltf = await gltfLoader.loadAsync('public/models/GothicCabinet_01_4k.glb'); // adjust path
    const cabinet = gltf.scene;

    cabinet.scale.set(2, 1.5, 1.5);
    cabinet.position.set(6, app.floorHeight, 0);  
    //cabinet.rotation.y = Math.PI / 2; // 90 degrees clockwise
    cabinet.rotation.y = -Math.PI / 2; // 90 degrees counter-clockwise
    cabinet.updateMatrixWorld(true);

    cabinet.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    app.scene.add(cabinet);
    const cabinetBoundingBox = new THREE.Box3().setFromObject(cabinet);
    app.furniture.push({ object: cabinet, boundingBox: cabinetBoundingBox });

    loadedAssets += 1;
    updateProgress();
  } catch (err) {
    console.error("Failed to load cabinet model:", err);
  }

  try {
    const gltf = await gltfLoader.loadAsync('public/models/GothicBed_01_4k.glb'); // adjust path
    const bed = gltf.scene;
    
    bed.scale.set(2.5, 2, 2);
    bed.position.set(-4.5, app.floorHeight, -1.5);
    bed.rotation.y = Math.PI / 2; // 90 degrees clockwise

    bed.updateMatrixWorld(true);

    bed.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    app.scene.add(bed);
    const bedBoundingBox = new THREE.Box3().setFromObject(bed);
    app.furniture.push({ object: bed, boundingBox: bedBoundingBox });

    loadedAssets += 1;
    updateProgress();
  } catch (err) {
    console.error("Failed to load bed model:", err);
  }

  try {
    const gltf = await gltfLoader.loadAsync('public/models/ClassicConsole_01_4k.glb'); 
    const table = gltf.scene;
    
    table.scale.set(2.5, 1.5, 2);
    table.position.set(-6, app.floorHeight, 2);
    table.rotation.y = Math.PI / 2; // 90 degrees clockwise

    table.updateMatrixWorld(true);
    
    table.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    app.scene.add(table);
    const tableBoundingBox = new THREE.Box3().setFromObject(table);
    app.furniture.push({ object: table, boundingBox: tableBoundingBox });

    loadedAssets += 1;
    updateProgress();
  } catch (err) {
    console.error("Failed to load table model:", err);
  }

  try {
    const gltf = await gltfLoader.loadAsync('public/models/horse_statue_01_4k.glb'); 
    const horse = gltf.scene;
    
    horse.scale.set(17, 17, 17);
    horse.position.set(5.5, app.floorHeight, 6);

    horse.updateMatrixWorld(true);
    
    horse.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    app.scene.add(horse);
    const horseBoundingBox = new THREE.Box3().setFromObject(horse);
    app.furniture.push({ object: horse, boundingBox: horseBoundingBox });

    loadedAssets += 1;
    updateProgress();
  } catch (err) {
    console.error("Failed to load horse model:", err);
  }

  try {
    const gltf = await gltfLoader.loadAsync('public/models/vintage_oil_lamp_4k.glb'); 
    const oil_lamp = gltf.scene;
  
    oil_lamp.scale.set(1.5, 1.5, 1.5);
  
    // Position on top of the table
    const tableTopY = app.floorHeight + (1.5 * 0.5); 
    oil_lamp.position.set(-6.2, tableTopY + 0.7, 2); 
    oil_lamp.rotation.y = Math.PI / 2;

    const lampLight = new THREE.PointLight(
      0xffaa55,  
      3,        
      7,         
      2         
    );

    lampLight.position.set(0, 0.5, 0);
    oil_lamp.add(lampLight);

    oil_lamp.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  
    app.scene.add(oil_lamp);
    loadedAssets += 1;
    updateProgress();
  } catch (err) {
    console.error("Failed to load oil lamp model:", err);
  }

    try {
      const gltf = await gltfLoader.loadAsync('public/models/Chandelier_03_4k.glb'); 
      const chandelier = gltf.scene;
      
      chandelier.scale.set(1.5, 1.5, 1.5);
      chandelier.position.set(0, app.roomSize.height, 0); // Hang from ceiling
    
      const chandelierLight = new THREE.PointLight(
        0xff3333,  
        10,        
        25,        
        1.5        
      );
      chandelierLight.position.set(0, -1, 0); // Position at bottom of chandelier
      chandelierLight.castShadow = true;
      chandelierLight.shadow.mapSize.width = 2048;
      chandelierLight.shadow.mapSize.height = 2048;
      chandelier.add(chandelierLight);
      
    
      // Material adjustments
      chandelier.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.metalness = 0.8;  // More reflective
          child.material.roughness = 0.2;  // Smoother surface
        }
      });
    
      app.scene.add(chandelier);
      const chandelierBoundingBox = new THREE.Box3().setFromObject(chandelier);
      app.furniture.push({ 
        object: chandelier, 
        boundingBox: chandelierBoundingBox,
        light: chandelierLight  // Store reference
      });
    
    } catch (err) {
      console.error("Failed to load chandelier:", err);
    }
}


const checkWallCollision = (newPosition) => {
  const halfWidth = app.roomSize.width / 2 - app.wallThickness - app.playerRadius;
  const halfDepth = app.roomSize.depth / 2 - app.wallThickness - app.playerRadius;
  

  newPosition.x = THREE.MathUtils.clamp(newPosition.x, -halfWidth, halfWidth);
  newPosition.z = THREE.MathUtils.clamp(newPosition.z, -halfDepth, halfDepth);
  
  // Ensure player stays above floor
  const cameraHeight = 1.8;
  newPosition.y = Math.max(newPosition.y, app.floorHeight + cameraHeight);
  
  return newPosition;
};

const checkFurnitureCollision = (newPosition) => {
  if (!app.furniture || app.furniture.length === 0) return true;
  
  // Create a bounding sphere for the player
  const playerSphere = new THREE.Sphere(
    newPosition, 
    app.playerRadius
  );
  
  for (const item of app.furniture) {
    if (item.boundingBox.intersectsSphere(playerSphere)) {
      return false; // Collision detected
    }
  }
  return true; // No collisions
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
  app.camera.rotation.order = "YXZ";
  app.camera.rotation.y -= e.movementX * app.rotationSpeed;
  app.camera.rotation.x -= e.movementY * app.rotationSpeed;
  const maxPitch = Math.PI / 2 - 0.01;
  app.camera.rotation.x = THREE.MathUtils.clamp(app.camera.rotation.x, -maxPitch, maxPitch);
};

const onKeyDown = (e) => {
  app.keysPressed[e.key.toLowerCase()] = true;
};

const onKeyUp = (e) => {
  app.keysPressed[e.key.toLowerCase()] = false;
};

const moveCamera = () => {
  if (!app.pointerLocked) return;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(app.camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(app.camera.quaternion);

  const moveDir = new THREE.Vector3();
  if (app.keysPressed['w']) moveDir.add(forward);
  if (app.keysPressed['s']) moveDir.sub(forward);
  if (app.keysPressed['a']) moveDir.sub(right);
  if (app.keysPressed['d']) moveDir.add(right);

  moveDir.normalize().multiplyScalar(app.moveSpeed);

  const newPosition = app.camera.position.clone().add(moveDir);
  const cameraHeight = 1.8;
  const feetY = newPosition.y - cameraHeight;

  if (feetY <= app.floorHeight) {
    app.velocity.y = 0;
    newPosition.y = app.floorHeight + cameraHeight;
    app.grounded = true;
  } else {
    app.velocity.y += app.gravity;
    app.grounded = false;
  }

  if (app.keysPressed[' '] && app.grounded) {
    app.velocity.y = app.jumpSpeed;
  }

  newPosition.y += app.velocity.y;
  
  // First check wall collisions
  const wallCheckedPosition = checkWallCollision(newPosition);
  
  // Then check furniture collisions
  if (checkFurnitureCollision(wallCheckedPosition)) {
    // Only update position if no furniture collision
    app.camera.position.copy(wallCheckedPosition);
  }
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

init().then(render).catch(error => console.error("Initialization failed:", error));