// three-bg.js — Cinematic 3D Hero Overlay

(function () {
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded.');
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const container = document.getElementById('canvas-container');
    if (!container) return;

    /* ── Scene ── */
    const scene = new THREE.Scene();

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 600;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent — sits over the photo
    container.appendChild(renderer.domElement);

    /* ── Colors ── */
    const TEAL   = new THREE.Color(0x57BDB0);
    const AMBER  = new THREE.Color(0xE2793D);
    const WARM   = new THREE.Color(0xF4C98B);
    const NAVY   = new THREE.Color(0x152B47);

    /* ── Mouse tracking ── */
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    document.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 to 1
        targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    /* ─────────────────────────────────────
       1. PARTICLE FIELD  (Floating dots)
    ────────────────────────────────────── */
    const PARTICLE_COUNT = 350;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const pColors    = new Float32Array(PARTICLE_COUNT * 3);
    const pSizes     = new Float32Array(PARTICLE_COUNT);
    const pSpeeds    = new Float32Array(PARTICLE_COUNT); // individual drift speeds

    const palette = [TEAL, AMBER, WARM, NAVY];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        pPositions[i * 3]     = (Math.random() - 0.5) * 1600;
        pPositions[i * 3 + 1] = (Math.random() - 0.5) * 1200;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 800;

        const c = palette[Math.floor(Math.random() * palette.length)];
        pColors[i * 3]     = c.r;
        pColors[i * 3 + 1] = c.g;
        pColors[i * 3 + 2] = c.b;

        pSizes[i]  = Math.random() * 6 + 2;
        pSpeeds[i] = Math.random() * 0.5 + 0.2;
    }

    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPositions, 3));
    particleGeo.setAttribute('color',    new THREE.Float32BufferAttribute(pColors, 3));
    particleGeo.setAttribute('size',     new THREE.Float32BufferAttribute(pSizes, 1));

    // Soft circle texture
    const makeCircleTexture = () => {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
        g.addColorStop(0.7, 'rgba(255,255,255,0.15)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        const t = new THREE.Texture(c);
        t.needsUpdate = true;
        return t;
    };

    const particleMat = new THREE.PointsMaterial({
        size: 8,
        vertexColors: true,
        map: makeCircleTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    /* ─────────────────────────────────────
       2. WIREFRAME GEOMETRIES (floating shapes)
    ────────────────────────────────────── */
    const shapes = [];

    const createShape = (geometry, color, position, scale, rotSpeed) => {
        const edges = new THREE.EdgesGeometry(geometry);
        const mat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.LineSegments(edges, mat);
        mesh.position.copy(position);
        mesh.scale.setScalar(scale);
        mesh.userData = {
            rotSpeed: rotSpeed,
            baseY: position.y,
            floatOffset: Math.random() * Math.PI * 2
        };
        scene.add(mesh);
        shapes.push(mesh);
        return mesh;
    };

    // Icosahedron — large, top-right
    createShape(
        new THREE.IcosahedronGeometry(1, 0),
        TEAL, new THREE.Vector3(350, 200, -100), 80,
        { x: 0.002, y: 0.003, z: 0.001 }
    );

    // Octahedron — medium, bottom-left
    createShape(
        new THREE.OctahedronGeometry(1, 0),
        AMBER, new THREE.Vector3(-400, -150, -200), 60,
        { x: 0.003, y: 0.002, z: 0.004 }
    );

    // Dodecahedron — small, center-right
    createShape(
        new THREE.DodecahedronGeometry(1, 0),
        WARM, new THREE.Vector3(200, -250, 50), 45,
        { x: 0.004, y: 0.001, z: 0.003 }
    );

    // Torus — top-left
    createShape(
        new THREE.TorusGeometry(1, 0.3, 8, 16),
        TEAL, new THREE.Vector3(-300, 250, -150), 50,
        { x: 0.001, y: 0.004, z: 0.002 }
    );

    // Small icosahedron — bottom-right
    createShape(
        new THREE.IcosahedronGeometry(1, 1),
        AMBER, new THREE.Vector3(450, -100, -300), 35,
        { x: 0.005, y: 0.002, z: 0.003 }
    );

    /* ─────────────────────────────────────
       3. CONNECTING LINES (network web)
    ────────────────────────────────────── */
    const MAX_CONNECTIONS = 2000;
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineColors    = new Float32Array(MAX_CONNECTIONS * 6);
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeo.setAttribute('color',    new THREE.Float32BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

    const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(linesMesh);

    /* ─────────────────────────────────────
       4. GLOWING ORB (ambient light point)
    ────────────────────────────────────── */
    const orbGeo = new THREE.SphereGeometry(12, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({
        color: TEAL,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0, 0, 100);
    scene.add(orb);

    // Outer glow
    const glowGeo = new THREE.SphereGeometry(40, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
        color: TEAL,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    orb.add(glow);

    /* ─────────────────────────────────────
       ANIMATION LOOP
    ────────────────────────────────────── */
    let time = 0;
    const CONNECTION_DIST_SQ = 18000;

    const animate = () => {
        requestAnimationFrame(animate);
        time += 0.003;

        // Smooth mouse follow
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Camera parallax
        camera.position.x = mouseX * 100;
        camera.position.y = -mouseY * 80;
        camera.lookAt(0, 0, 0);

        // ── Animate particles ──
        const posArr = particleGeo.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            // Gentle sine wave drift
            posArr[i3 + 1] += Math.sin(time * 2 + i * 0.1) * pSpeeds[i] * 0.3;
            posArr[i3]     += Math.cos(time * 1.5 + i * 0.05) * pSpeeds[i] * 0.15;

            // Wrap around if too far
            if (posArr[i3 + 1] > 700)  posArr[i3 + 1] = -700;
            if (posArr[i3 + 1] < -700) posArr[i3 + 1] = 700;
            if (posArr[i3] > 900)      posArr[i3] = -900;
            if (posArr[i3] < -900)     posArr[i3] = 900;
        }
        particleGeo.attributes.position.needsUpdate = true;

        // ── Rotate particles group gently ──
        particles.rotation.y = time * 0.15;

        // ── Animate wireframe shapes ──
        shapes.forEach(shape => {
            const rs = shape.userData.rotSpeed;
            shape.rotation.x += rs.x;
            shape.rotation.y += rs.y;
            shape.rotation.z += rs.z;
            // Float up/down
            shape.position.y = shape.userData.baseY + Math.sin(time * 2 + shape.userData.floatOffset) * 30;
            // React to mouse
            shape.position.x += mouseX * 0.3;
            shape.position.y += mouseY * 0.2;
        });

        // ── Animate glowing orb — follows mouse ──
        orb.position.x = mouseX * 200;
        orb.position.y = -mouseY * 150;
        orb.position.z = 100 + Math.sin(time * 3) * 30;
        // Pulse
        const pulse = 0.3 + Math.sin(time * 4) * 0.1;
        orbMat.opacity = pulse;

        // ── Update connection lines ──
        let vertexIdx = 0;
        let colorIdx = 0;
        let numConnected = 0;

        // Only check a subset for performance
        const step = Math.max(1, Math.floor(PARTICLE_COUNT / 120));

        for (let i = 0; i < PARTICLE_COUNT; i += step) {
            for (let j = i + step; j < PARTICLE_COUNT; j += step) {
                if (numConnected >= MAX_CONNECTIONS) break;

                const i3 = i * 3, j3 = j * 3;
                const dx = posArr[i3]     - posArr[j3];
                const dy = posArr[i3 + 1] - posArr[j3 + 1];
                const dz = posArr[i3 + 2] - posArr[j3 + 2];
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < CONNECTION_DIST_SQ) {
                    const alpha = 1.0 - distSq / CONNECTION_DIST_SQ;

                    linePositions[vertexIdx++] = posArr[i3];
                    linePositions[vertexIdx++] = posArr[i3 + 1];
                    linePositions[vertexIdx++] = posArr[i3 + 2];
                    linePositions[vertexIdx++] = posArr[j3];
                    linePositions[vertexIdx++] = posArr[j3 + 1];
                    linePositions[vertexIdx++] = posArr[j3 + 2];

                    // Teal-ish lines
                    lineColors[colorIdx++] = TEAL.r * alpha;
                    lineColors[colorIdx++] = TEAL.g * alpha;
                    lineColors[colorIdx++] = TEAL.b * alpha;
                    lineColors[colorIdx++] = TEAL.r * alpha;
                    lineColors[colorIdx++] = TEAL.g * alpha;
                    lineColors[colorIdx++] = TEAL.b * alpha;

                    numConnected++;
                }
            }
            if (numConnected >= MAX_CONNECTIONS) break;
        }

        linesMesh.geometry.setDrawRange(0, numConnected * 2);
        linesMesh.geometry.attributes.position.needsUpdate = true;
        linesMesh.geometry.attributes.color.needsUpdate = true;

        renderer.render(scene, camera);
    };

    /* ── Resize ── */
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    /* ── Start ── */
    if (prefersReducedMotion) {
        // Just render one frame
        renderer.render(scene, camera);
    } else {
        animate();
    }
})();
