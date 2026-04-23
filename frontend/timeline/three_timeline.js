/**
 * three_timeline.js
 * Interactive 3D storytelling election timeline using Three.js + GSAP.
 * Features: glowing orbs, animated beam connections, floating labels, 
 *           auto-camera fly-through, hover glow, click zoom, particle field.
 */

window.TimelineRenderer = (function() {
    let scene, camera, renderer;
    let nodes = [];
    let rings = [];
    let labels = [];
    let raycaster, mouse;
    let container;
    let animationId;
    let electionDataRef;
    let particlesMesh;
    let beamLine;
    let clock;
    let activeNode = null;
    let isAutoPlaying = false;
    let currentStoryIndex = 0;

    // Color palette
    const COLORS = {
        completed: 0x22c55e,    // green
        upcoming: 0x3b82f6,     // blue
        results: 0xf59e0b,      // amber
        glow: 0x0ea5e9,         // cyan glow
        particle: 0x6366f1,     // indigo particles
        beam: 0x334155,         // subtle beam line
        ring: 0x0ea5e9,         // ring color
    };

    function init(containerId, data) {
        container = document.getElementById(containerId);
        if (!container || typeof THREE === 'undefined') {
            console.error("Three.js timeline: container or Three.js not found.");
            return;
        }

        electionDataRef = data;
        clock = new THREE.Clock();

        // Scene
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0f0f0f, 0.012);

        // Camera
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 300;
        camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
        camera.position.set(0, 6, 22);
        camera.lookAt(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambient);

        const mainLight = new THREE.PointLight(0xffffff, 0.8);
        mainLight.position.set(0, 15, 15);
        scene.add(mainLight);

        // Moving accent light
        const accentLight = new THREE.PointLight(COLORS.glow, 0.6, 50);
        accentLight.position.set(-10, 5, 5);
        scene.add(accentLight);

        // Raycaster
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2(-999, -999);

        // Build everything
        createParticleField();
        buildTimeline();
        renderChecklist();

        // Events
        window.addEventListener('resize', onWindowResize);
        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('click', onClick);

        // Start animation
        animate();

        // Entry animation: staggered pop-in
        if (typeof gsap !== 'undefined') {
            nodes.forEach((node, i) => {
                node.scale.set(0, 0, 0);
                gsap.to(node.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 0.8,
                    delay: 0.3 + i * 0.15,
                    ease: "back.out(1.7)"
                });
            });

            rings.forEach((ring, i) => {
                ring.scale.set(0, 0, 0);
                gsap.to(ring.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 0.6,
                    delay: 0.5 + i * 0.15,
                    ease: "power2.out"
                });
            });

            // Auto story fly-through after entry finishes
            const totalDelay = 0.5 + nodes.length * 0.15 + 0.5;
            setTimeout(() => startStoryMode(), totalDelay * 1000);
        }
    }

    // ==================== PARTICLE FIELD ====================
    function createParticleField() {
        const geo = new THREE.BufferGeometry();
        const count = 500;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            pos[i] = (Math.random() - 0.5) * 80;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.15,
            color: COLORS.particle,
            transparent: true,
            opacity: 0.5,
        });
        particlesMesh = new THREE.Points(geo, mat);
        scene.add(particlesMesh);
    }

    // ==================== BUILD TIMELINE ====================
    function buildTimeline() {
        if (!electionDataRef || electionDataRef.length === 0) return;

        const count = electionDataRef.length;
        const spacing = 7;
        const startX = -((count - 1) * spacing) / 2;

        // Animated beam connection (curved)
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(startX - 3, 0, 0),
            ...electionDataRef.map((_, i) => new THREE.Vector3(startX + i * spacing, 0, 0)),
            new THREE.Vector3(startX + (count - 1) * spacing + 3, 0, 0)
        ]);
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.06, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: COLORS.beam,
            transparent: true,
            opacity: 0.6,
        });
        beamLine = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(beamLine);

        // Glowing beam on top
        const glowTubeGeo = new THREE.TubeGeometry(curve, 64, 0.12, 8, false);
        const glowTubeMat = new THREE.MeshBasicMaterial({
            color: COLORS.glow,
            transparent: true,
            opacity: 0.08,
        });
        scene.add(new THREE.Mesh(glowTubeGeo, glowTubeMat));

        // Create each phase node
        electionDataRef.forEach((event, index) => {
            const isPast = new Date() > new Date(event.timestamp);
            const isResult = event.phase.toLowerCase().includes('result');

            let nodeColor = isPast ? COLORS.completed : COLORS.upcoming;
            if (isResult) nodeColor = COLORS.results;

            // Main orb — use dodecahedron for visual interest
            const geo = new THREE.DodecahedronGeometry(1.2, 0);
            const mat = new THREE.MeshPhongMaterial({
                color: nodeColor,
                emissive: nodeColor,
                emissiveIntensity: 0.4,
                shininess: 150,
                transparent: true,
                opacity: 0.9,
            });
            const orb = new THREE.Mesh(geo, mat);
            orb.position.set(startX + index * spacing, 0, 0);

            // Inner glow sphere
            const glowGeo = new THREE.SphereGeometry(1.6, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({
                color: nodeColor,
                transparent: true,
                opacity: 0.08,
            });
            const glowSphere = new THREE.Mesh(glowGeo, glowMat);
            orb.add(glowSphere);

            orb.userData = {
                id: event.id,
                title: event.phase,
                date: event.date,
                desc: event.description,
                index: index,
                baseColor: nodeColor,
            };

            scene.add(orb);
            nodes.push(orb);

            // Orbital ring
            const ringGeo = new THREE.TorusGeometry(2.0, 0.04, 8, 48);
            const ringMat = new THREE.MeshBasicMaterial({
                color: nodeColor,
                transparent: true,
                opacity: 0.25,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(orb.position);
            ring.rotation.x = Math.PI / 2;
            scene.add(ring);
            rings.push(ring);

            // Create floating CSS label
            createLabel(event.phase, orb.position, index);
        });
    }

    // ==================== FLOATING LABELS (CSS2D-style via DOM) ====================
    function createLabel(text, position3D, index) {
        const label = document.createElement('div');
        label.className = 'timeline-label';
        label.textContent = text;
        label.style.cssText = `
            position: absolute;
            color: #d4d4d8;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            pointer-events: none;
            text-align: center;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.4s ease;
        `;
        container.appendChild(label);
        labels.push({ el: label, pos: position3D, index: index });

        // Fade in label
        setTimeout(() => { label.style.opacity = '1'; }, 800 + index * 150);
    }

    function updateLabels() {
        labels.forEach(lbl => {
            const vec = lbl.pos.clone();
            vec.y += 2.8; // Above the node
            vec.project(camera);
            const x = (vec.x * 0.5 + 0.5) * container.clientWidth;
            const y = (-vec.y * 0.5 + 0.5) * container.clientHeight;
            lbl.el.style.left = x + 'px';
            lbl.el.style.top = y + 'px';
            lbl.el.style.transform = 'translate(-50%, -50%)';
            
            // Hide labels behind camera
            lbl.el.style.display = vec.z > 1 ? 'none' : 'block';
        });
    }

    // ==================== STORY MODE (Auto Fly-Through) ====================
    function startStoryMode() {
        if (typeof gsap === 'undefined' || nodes.length === 0) return;
        isAutoPlaying = true;
        currentStoryIndex = 0;
        flyToNode(0);
    }

    function flyToNode(index) {
        if (index >= nodes.length) {
            // Story complete — zoom back out
            isAutoPlaying = false;
            if (typeof gsap !== 'undefined') {
                gsap.to(camera.position, {
                    x: 0, y: 6, z: 22,
                    duration: 1.5,
                    ease: "power2.inOut",
                });
            }
            return;
        }

        const node = nodes[index];
        const data = node.userData;

        // Show details panel
        document.getElementById('phase-title').innerText = data.title;
        document.getElementById('phase-date').innerText = 'Date: ' + data.date;
        document.getElementById('phase-desc').innerText = data.desc;
        document.getElementById('timeline-details').classList.remove('hidden');

        // Camera fly to this node
        gsap.to(camera.position, {
            x: node.position.x,
            y: 3,
            z: 14,
            duration: 1.2,
            ease: "power2.inOut",
        });

        // Pulse the node
        gsap.to(node.scale, {
            x: 1.4, y: 1.4, z: 1.4,
            duration: 0.4,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
        });

        // Highlight corresponding ring
        if (rings[index]) {
            gsap.to(rings[index].material, {
                opacity: 0.6,
                duration: 0.5,
                yoyo: true,
                repeat: 1,
            });
        }

        currentStoryIndex = index;

        // Move to next after a pause
        setTimeout(() => {
            if (isAutoPlaying) flyToNode(index + 1);
        }, 2500);
    }

    // ==================== CHECKLIST RENDERING ====================
    function renderChecklist() {
        const checklistContainer = document.getElementById('checklist-container');
        const progressBadge = document.getElementById('checklist-progress');
        if (!checklistContainer || !electionDataRef) return;

        checklistContainer.innerHTML = '';

        function updateProgress() {
            const total = electionDataRef.length;
            let checked = 0;
            electionDataRef.forEach(ev => {
                if (localStorage.getItem('chk-' + ev.id) === 'true') checked++;
            });
            if (progressBadge) progressBadge.textContent = checked + ' / ' + total + ' done';
        }

        electionDataRef.forEach((event, idx) => {
            const itemId = 'chk-' + event.id;
            const savedState = localStorage.getItem(itemId) === 'true';
            const isPast = new Date() > new Date(event.timestamp);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'checklist-item' + (savedState ? ' completed' : '');

            const statusClass = savedState ? 'done' : 'upcoming';
            const statusLabel = savedState ? 'Done' : (isPast ? 'Passed' : 'Upcoming');

            itemDiv.innerHTML = `
                <input type="checkbox" id="${itemId}" ${savedState ? 'checked' : ''}>
                <div class="checklist-info">
                    <h4>${event.phase}</h4>
                    <span class="checklist-date">${event.date}</span>
                    <p class="checklist-desc">${event.description}</p>
                </div>
                <span class="checklist-status ${statusClass}">${statusLabel}</span>
            `;

            // Click checklist item → fly camera to corresponding 3D node
            itemDiv.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT') return; // let checkbox handle itself
                isAutoPlaying = false;
                if (nodes[idx] && typeof gsap !== 'undefined') {
                    const node = nodes[idx];
                    gsap.to(camera.position, {
                        x: node.position.x, y: 3, z: 14,
                        duration: 1,
                        ease: "power2.out"
                    });
                    gsap.to(node.scale, {
                        x: 1.4, y: 1.4, z: 1.4,
                        duration: 0.3, yoyo: true, repeat: 1
                    });
                    // Show detail
                    document.getElementById('phase-title').innerText = node.userData.title;
                    document.getElementById('phase-date').innerText = 'Date: ' + node.userData.date;
                    document.getElementById('phase-desc').innerText = node.userData.desc;
                    document.getElementById('timeline-details').classList.remove('hidden');
                }
            });

            const checkbox = itemDiv.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                localStorage.setItem(itemId, e.target.checked);
                const statusSpan = itemDiv.querySelector('.checklist-status');
                if (e.target.checked) {
                    itemDiv.classList.add('completed');
                    statusSpan.className = 'checklist-status done';
                    statusSpan.textContent = 'Done';
                } else {
                    itemDiv.classList.remove('completed');
                    statusSpan.className = 'checklist-status upcoming';
                    statusSpan.textContent = isPast ? 'Passed' : 'Upcoming';
                }
                updateProgress();
            });

            checklistContainer.appendChild(itemDiv);
        });

        updateProgress();
    }

    // ==================== EVENT HANDLERS ====================
    function onWindowResize() {
        if (!camera || !renderer || !container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;
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
            isAutoPlaying = false; // Stop auto story if user clicks
            const object = intersects[0].object;
            const data = object.userData;

            // Pulse
            if (typeof gsap !== 'undefined') {
                gsap.to(object.scale, {
                    x: 1.5, y: 1.5, z: 1.5,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.out"
                });
            }

            // Show detail
            document.getElementById('phase-title').innerText = data.title;
            document.getElementById('phase-date').innerText = 'Date: ' + data.date;
            document.getElementById('phase-desc').innerText = data.desc;
            document.getElementById('timeline-details').classList.remove('hidden');

            // Fly camera
            if (typeof gsap !== 'undefined') {
                gsap.to(camera.position, {
                    x: object.position.x,
                    y: 3,
                    z: 14,
                    duration: 1,
                    ease: "power2.out"
                });
            }
        }
    }

    // ==================== ANIMATION LOOP ====================
    function animate() {
        animationId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Rotate nodes with a gentle float
        nodes.forEach((node, i) => {
            node.rotation.y += 0.008;
            node.rotation.z += 0.004;
            // Gentle float up and down
            node.position.y = Math.sin(elapsed * 0.8 + i * 1.2) * 0.3;
        });

        // Rotate rings differently
        rings.forEach((ring, i) => {
            ring.rotation.z += 0.005;
            ring.position.y = nodes[i] ? nodes[i].position.y : 0;
        });

        // Particle drift
        if (particlesMesh) {
            particlesMesh.rotation.y = elapsed * 0.02;
            particlesMesh.rotation.x = elapsed * 0.01;
        }

        // Hover detection
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodes);

        // Reset hover states
        nodes.forEach(node => {
            if (!isAutoPlaying) {
                node.material.emissiveIntensity = 0.4;
            }
        });

        if (intersects.length > 0) {
            container.style.cursor = 'pointer';
            const hovered = intersects[0].object;
            hovered.material.emissiveIntensity = 0.9;
        } else {
            container.style.cursor = 'default';
        }

        // Update label positions
        updateLabels();

        renderer.render(scene, camera);
    }

    return { init, refresh: onWindowResize };
})();
