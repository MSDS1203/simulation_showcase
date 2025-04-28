document.getElementById('start').addEventListener('click', initializeCube);

function initializeCube() {
    // hide the start button
    document.getElementById('start').style.display = 'none';
    // show the canvas, timer, and instructions
    document.getElementById('canvas').style.display = 'block';
    document.getElementById('timer').style.display = 'block';
    document.getElementById('instructions').style.display = 'block';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Set the position of the camera
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Add controls to move the Rubik's cube and camera
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Soft white ambient light
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); // Directional light
    directionalLight.position.set(5, 10, 5).normalize(); // Position it appropriately
    scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4); // Another light source
    directionalLight2.position.set(-5, -10, -5).normalize();
    scene.add(directionalLight2);
    
    const cubeSize = 3; // size of the Rubik's cube
    const subcubeSize = 1; // size of each subcube
    const subcubes = []; // array to hold the subcubes

    const colors = [
        0xff0000, // red
        0xffa500, // orange
        0x0000ff, // blue
        0x00ff00, // green
        0xffffff, // white
        0xffff00  // yellow
    ]

    // Create the Rubik's cube
    for (let i = 0; i < cubeSize; i++) {
        for (let j = 0; j < cubeSize; j++) {
            for (let k = 0; k < cubeSize; k++) {
                // Create each side of the Rubik's cube
                const geometry = new THREE.BoxGeometry(subcubeSize, subcubeSize, subcubeSize);
                const edges = new THREE.EdgesGeometry( geometry );
                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial( { color: 'black' } ) );
                const materials = [
                    new THREE.MeshStandardMaterial({ color: colors[0] }),
                    new THREE.MeshStandardMaterial({ color: colors[1] }),
                    new THREE.MeshStandardMaterial({ color: colors[2] }),
                    new THREE.MeshStandardMaterial({ color: colors[3] }),
                    new THREE.MeshStandardMaterial({ color: colors[4] }),
                    new THREE.MeshStandardMaterial({ color: colors[5] })
                ];
                // Create each subcube
                const subcube = new THREE.Mesh(geometry, materials);
                // Set the position of each subcube
                subcube.position.set(i - 1, j - 1, k - 1);
                // Add the subsube to the array
                subcubes.push(subcube);
                // Add the subcube to the scene
                scene.add(subcube);
                subcube.add(line);
            }
        }
    }

    let selectedLayer = null;
    let selectedAxis = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('mousedown', (event) => {
        // Normalize mouse coordinates to [-1, 1] range
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        // Set up the raycaster from the camera
        raycaster.setFromCamera(mouse, camera);
    
        // Intersect with the subcubes
        const intersects = raycaster.intersectObjects(subcubes);
    
        if (intersects.length > 0) {
            const hit = intersects[0].object;
            const pos = hit.position;
    
            let newSelectedAxis, newSelectedLayer;
    
            // Check for left-click (for vertical layer) vs right-click (for horizontal layer)
            if (event.button === 0) { // Left-click for vertical layers
                // Pick the axis most perpendicular to the camera for vertical layer
                newSelectedAxis = ['x', 'y', 'z'].reduce((a, b) => 
                    Math.abs(camera.position[a]) > Math.abs(camera.position[b]) ? a : b
                );
            } else if (event.button === 2) { // Right-click for horizontal layers
                // Use the axis that is **most parallel** to the camera for horizontal layers
                newSelectedAxis = ['x', 'y', 'z'].reduce((a, b) => 
                    Math.abs(camera.position[a]) < Math.abs(camera.position[b]) ? a : b
                );
            }
    
            newSelectedLayer = Math.round(pos[newSelectedAxis]);
    
            // If clicked on the same layer, deselect it
            if (newSelectedAxis === selectedAxis && newSelectedLayer === selectedLayer) {
                clearHighlight(); // Deselect the layer
                selectedAxis = null;
                selectedLayer = null;
                currentlyHighlighted = false;
                return;
            }
    
            // Update selected axis and layer
            selectedAxis = newSelectedAxis;
            selectedLayer = newSelectedLayer;
    
            // Highlight the selected layer
            highlightSelectedLayer();
        }
    });
    
    // Prevent context menu on right-click to allow for custom behavior
    renderer.domElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    camera.position.z = 5;

    let currentlyHighlighted = false;

    function highlightSelectedLayer() {
        if (currentlyHighlighted) {
            // Clear highlight if already highlighted
            clearHighlight();
            currentlyHighlighted = false;
            return;
        }

        subcubes.forEach(subcube => {
            if (selectedAxis !== null && selectedLayer !== null) {
                if (Math.round(subcube.position[selectedAxis]) === selectedLayer) {
                    subcube.children.forEach(child => {
                        if (child.isLineSegments) {
                            // Make thicker highlighted edges
                            child.material = new THREE.LineBasicMaterial({
                                color: 0x2222ff,
                                linewidth: 4 // <- Thicker border (may not affect all browsers!)
                            });
                        }
                    });
                }
            }
        });
        currentlyHighlighted = true;
    }

    function clearHighlight() {
        subcubes.forEach(subcube => {
            subcube.children.forEach(child => {
                if (child.isLineSegments) {
                    child.material = new THREE.LineBasicMaterial({
                        color: 0x000000,
                        linewidth: 1
                    });
                }
            });
        });
    }

    // function to rotate a side of the cube
    // axis: 'x', 'y', or 'z'
    // layer: -1, 0, or 1 (for the three layers of the cube)
    // direction: -1 for clockwise, 1 for counterclockwise
    function rotateSide(axis, layer, direction) {
        clearHighlight();
        
        const rotationAxis = new THREE.Vector3();
        rotationAxis[axis] = 1;
        const rotationAngle = direction * Math.PI / 2;
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, rotationAngle);

        subcubes.forEach(subcube => {
            if (Math.round(subcube.position[axis]) === layer) {
                // Rotate the subcube
                subcube.applyMatrix4(rotationMatrix);
                subcube.position.round();
            }
        });
    }

    // function to rotate a random side of the cube
    // this function will be called when the page loads
    // and will rotate the cube 20 times
    // in random directions and layers
    function randomRotations() {
        const axes = ['x', 'y', 'z'];
        const layers = [-1, 0, 1];
        const directions = [-1, 1];
        for (let i = 0; i < 20; i++) {
            const axis = axes[Math.floor(Math.random() * axes.length)];
            const layer = layers[Math.floor(Math.random() * layers.length)];
            const direction = directions[Math.floor(Math.random() * directions.length)];
            rotateSide(axis, layer, direction);
        }
    }

    randomRotations();

    // Render loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        checkIfSolved();
    }

    animate();

    // Add event listeners for keyboard controls
    document.addEventListener('keydown', (event) => {
        if (selectedAxis === null || selectedLayer === null) return;
    
        let direction = 0;
    
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                direction = 1;
                break;
            case 'ArrowDown':
            case 's':
                direction = -1;
                break;
            case 'ArrowLeft':
            case 'a':
                direction = -1;
                break;
            case 'ArrowRight':
            case 'd':
                direction = 1;
                break;
        }
    
        if (direction !== 0) {
            rotateSide(selectedAxis, selectedLayer, direction);
            checkIfSolved();
        }
    });

    // Add event listener for window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Timer
    let startTime = Date.now();
    let timerInterval = setInterval(updateTimer, 1000);

    // Update the timer every second
    function updateTimer() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        const minutes = Math.floor((elapsedTime / 60000));
        document.getElementById('timer').innerText = `Timer: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // Check if the cube is solved
    function checkIfSolved() {
        const solvedColors = [
            [0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000],
            [0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00],
            [0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff],
            [0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00],
            [0xffa500, 0xffa500, 0xffa500, 0xffa500, 0xffa500, 0xffa500, 0xffa500, 0xffa500, 0xffa500],
            [0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff]
        ]

        // Check if all subcubes have the same color on each face
        const currentColors = subcubes.flatMap(subcube => {
            if(!subcube.materials) {
                console.error("Subcube materials are undefined:", subcube);
                return [];
            }
            return subcube.materials.map(material => material.color.getHex())
        });
        for (let i = 0; i < solvedColors.length; i++) {
            // Check if the current colors match the solved colors
            if (!solvedColors[i].every((color, index) => color === currentColors[index])) {
                return;
            }
        }

        // If all colors match, the cube is solved
        showWinMessage();
    }

    // Show the win message and restart button
    // when the cube is solved
    function showWinMessage() {
        clearInterval(timerInterval);
        document.getElementById('win').style.display = 'block';
        document.getElementById('reset').style.display = 'block';
        document.getElementById('reset').addEventListener('click', restartGame);
    }

    // Restart the game
    // when the restart button is clicked
    function restartGame() {
        // Hide the win message and restart button
        document.getElementById('win').style.display = 'none';
        document.getElementById('timer').innerText = 'Timer: 00:00';

        // Reset the timer
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);

        // Reset the cube
        scene.children.length = 0;
        subcubes.length = 0;
        initializeCube();
    }
}