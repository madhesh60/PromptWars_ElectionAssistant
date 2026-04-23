/**
 * three_timeline.js
 * Implements an interactive 3D timeline using Three.js to show election phases.
 */

window.TimelineRenderer = (function() {
    let scene, camera, renderer;
    let nodes = [];
    let raycaster, mouse;
    let container;
    let animationId;
    let electionDataRef;
    let particlesMesh;

    function init(containerId, data) {
        container = document.getElementById(containerId);
        if (!container || typeof THREE === 'undefined') {
            console.error("Three.js timeline container not found or Three.js not loaded.");
            return;
        }

        electionDataRef = data;
        
        // Scene Setup
        scene = new THREE.Scene();
        scene.background = null; // Transparent to match CSS dark theme

        // Camera Setup
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 30;
        camera.position.y = 5;
        camera.lookAt(0, 0, 0);

        // Renderer Setup
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x0A66C2, 1);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        // Particle background
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 700;
        const posArray = new Float32Array(particlesCount * 3);
        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 100;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.2,
            color: 0x0A66C2,
            transparent: true,
            opacity: 0.6
        });
        particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // Raycaster for interactions
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // Build Timeline
        buildTimelineObjects();
        
        // Render Checklist UI
        renderChecklist();

        // Event Listeners
        window.addEventListener('resize', onWindowResize);
        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('click', onClick);

        // Animation Loop
        animate();
        
        // If GSAP is available, animate entry
        if (typeof gsap !== 'undefined') {
            nodes.forEach((node, i) => {
                node.scale.set(0,0,0);
                gsap.to(node.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 1,
                    delay: i * 0.2,
                    ease: "elastic.out(1, 0.5)"
                });
            });
        }
    }

    function renderChecklist() {
        const checklistContainer = document.getElementById('checklist-container');
        if (!checklistContainer || !electionDataRef) return;
        
        checklistContainer.innerHTML = '';
        
        electionDataRef.forEach(event => {
            const itemId = 'chk-' + event.id;
            const savedState = localStorage.getItem(itemId) === 'true';
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checklist-item' + (savedState ? ' completed' : '');
            
            itemDiv.innerHTML = `
                <input type="checkbox" id="${itemId}" ${savedState ? 'checked' : ''}>
                <div class="checklist-info">
                    <h4>${event.phase}</h4>
                    <p>${event.date} - ${event.description}</p>
                </div>
            `;
            
            const checkbox = itemDiv.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                localStorage.setItem(itemId, e.target.checked);
                if (e.target.checked) {
                    itemDiv.classList.add('completed');
                } else {
                    itemDiv.classList.remove('completed');
                }
            });
            
            checklistContainer.appendChild(itemDiv);
        });
    }

    function buildTimelineObjects() {
        if (!electionDataRef || electionDataRef.length === 0) return;

        const count = electionDataRef.length;
        const spacing = 8;
        const startX = -((count - 1) * spacing) / 2;

        // Line connecting nodes
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        const points = [];
        points.push(new THREE.Vector3(startX - 2, 0, 0));
        points.push(new THREE.Vector3(startX + (count - 1) * spacing + 2, 0, 0));
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);

        // Nodes
        const geometry = new THREE.IcosahedronGeometry(1.5, 0);
        
        
        electionDataRef.forEach((event, index) => {
            const isCompleted = new Date() > new Date(event.timestamp);
            const material = new THREE.MeshPhongMaterial({ 
                color: isCompleted ? 0x0A66C2 : 0x94A3B8,
                emissive: isCompleted ? 0x0855A1 : 0x475569,
                emissiveIntensity: 0.2,
                shininess: 100
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            
            // Add wireframe for a techy look
            const wireframeGeometry = new THREE.WireframeGeometry(geometry);
            const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
            const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
            sphere.add(wireframe);

            sphere.position.set(startX + (index * spacing), 0, 0);
            
            // Store data inside userData for interaction
            sphere.userData = {
                id: event.id,
                title: event.phase,
                date: event.date,
                desc: event.description,
                index: index
            };

            scene.add(sphere);
            nodes.push(sphere);
        });
    }

    function onWindowResize() {
        if (!camera || !renderer || !container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return; // Prevent sizing to 0 when hidden
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function onMouseMove(event) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    }

    function onClick(event) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodes);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            const data = object.userData;
            
            // Pulse animation on click
            if (typeof gsap !== 'undefined') {
                gsap.to(object.scale, {
                    x: 1.3, y: 1.3, z: 1.3,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1
                });
            }

            // Update DOM details
            document.getElementById('phase-title').innerText = data.title;
            document.getElementById('phase-date').innerText = `Date: ${data.date}`;
            document.getElementById('phase-desc').innerText = data.desc;
            document.getElementById('timeline-details').classList.remove('hidden');
            
            // Center camera on node (simplified smooth scroll via GSAP)
            if (typeof gsap !== 'undefined') {
                gsap.to(camera.position, {
                    x: object.position.x,
                    duration: 1,
                    ease: "power2.out"
                });
            } else {
                camera.position.x = object.position.x;
            }
        }
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        
        // Gentle rotation for nodes
        nodes.forEach(node => {
            node.rotation.y += 0.01;
            node.rotation.x += 0.005;
        });

        if (particlesMesh) {
            particlesMesh.rotation.y += 0.0005;
            particlesMesh.rotation.x += 0.0002;
        }

        // Hover effect checking
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodes);
        
        // Reset scale for all
        nodes.forEach(node => {
            if (node.scale.x > 1.05 && typeof gsap === 'undefined') {
                node.scale.set(1, 1, 1);
            }
        });

        // Highlight hovered
        if (intersects.length > 0) {
            container.style.cursor = 'pointer';
            const object = intersects[0].object;
            if (typeof gsap === 'undefined') {
                 object.scale.set(1.1, 1.1, 1.1);
            }
        } else {
            container.style.cursor = 'grab';
        }

        renderer.render(scene, camera);
    }

    return { init, refresh: onWindowResize };
})();
