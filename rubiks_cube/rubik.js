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
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Set the position of the camera
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);
    
    const cubeSize = 3; // size of the Rubik's cube
    const subcubeSize = 1; // size of each subcube
    const subcubes = []; // array to hold the subcubes

    const colors = [
        0xff0000, // red
        0x00ff00, // green
        0x0000ff, // blue
        0xffff00, // yellow
        0xffa500, // orange
        0xffffff  // white
    ]

    // Create the Rubik's cube
    for (let i = 0; i < cubeSize; i++) {
        for (let j = 0; j < cubeSize; j++) {
            for (let k = 0; k < cubeSize; k++) {
                // Create each side of the Rubik's cube
                const geometry = new THREE.BoxGeometry(subcubeSize, subcubeSize, subcubeSize);
                const materials = [
                    new THREE.MeshBasicMaterial({ color: colors[0] }),
                    new THREE.MeshBasicMaterial({ color: colors[1] }),
                    new THREE.MeshBasicMaterial({ color: colors[2] }),
                    new THREE.MeshBasicMaterial({ color: colors[3] }),
                    new THREE.MeshBasicMaterial({ color: colors[4] }),
                    new THREE.MeshBasicMaterial({ color: colors[5] })
                ];
                // Create each subcube
                const subcube = new THREE.Mesh(geometry, materials);
                // Set the position of each subcube
                subcube.position.set(i - 1, j - 1, k - 1);
                // Add the subsube to the array
                subcubes.push(subcube);
                // Add the subcube to the scene
                scene.add(subcube);
            }
        }
    }

    camera.position.z = 5;

    // Add controls to move the Rubik's cube and camera
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    // function to rotate a side of the cube
    // axis: 'x', 'y', or 'z'
    // layer: -1, 0, or 1 (for the three layers of the cube)
    // direction: -1 for clockwise, 1 for counterclockwise
    function rotateSide(axis, layer, direction) {
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
        switch (event.key) {
            case 'ArrowUp':
                rotateSide('y', 1, 1);
                break;
            case 'ArrowDown':
                rotateSide('y', -1, -1);
                break;
            case 'ArrowLeft':
                rotateSide('x', -1, -1);
                break;
            case 'ArrowRight':
                rotateSide('x', 1, 1);
                break;
            case 'w':
                rotateSide('z', -1, 1);
                break;
            case 's':
                rotateSide('z', 1, -1);
                break;
            case 'a':
                rotateSide('y', -1, 1);
                break;
            case 'd':
                rotateSide('y', 1, -1);
                break;
            case 'q':
                rotateSide('x', -1, 1);
                break;
            case 'e':
                rotateSide('x', 1, -1);
                break;
            case 'z':
                rotateSide('x', 0, 1);
                break;
            case 'x':
                rotateSide('x', 0, -1);
                break;
            case 'c':
                rotateSide('y', 0, 1);
                break;
            case 'v':
                rotateSide('y', 0, -1);
                break;
            case 'b':
                rotateSide('z', 0, 1);
                break;
            case 'n':
                rotateSide('z', 0, -1);
                break;
        }
        checkIfSolved();
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