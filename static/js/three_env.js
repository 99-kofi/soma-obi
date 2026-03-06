/**
 * Soma Obi Therapeutic 3D Environment
 * - Soothing volumetric gradients
 * - Organic light-blob motion
 * - Mobile responsive
 */

class ThreeEnvironment {
    constructor() {
        this.container = document.getElementById('canvas-container');
        if (!this.container) return;

        this.isMobile = window.innerWidth <= 768;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.mouse = new THREE.Vector2();
        this.targetRotation = new THREE.Vector2();

        this.blobs = [];

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = this.isMobile ? 10 : 6;

        // Lighting - Warm and Diffused
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xe0f2f1, 0xfff3e0, 0.6);
        this.scene.add(hemiLight);

        // Add Organic Blobs (Replacing stars/metallic orbs)
        this.addLightBlobs();

        // Logo Centerpiece
        this.addLogo();

        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Mobile Touch Support
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.onMouseMove({
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                });
            }
        });

        this.animate();
    }

    addLightBlobs() {
        const blobCount = this.isMobile ? 12 : 25;
        const colors = [0x80cbc4, 0xb2dfdb, 0xffccbc, 0xffe0b2];

        for (let i = 0; i < blobCount; i++) {
            const geometry = new THREE.SphereGeometry(Math.random() * 2 + 1, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 0.1,
            });
            const blob = new THREE.Mesh(geometry, material);

            blob.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20 - 10
            );

            // Random movement metadata
            blob.userData = {
                phase: Math.random() * Math.PI * 2,
                speed: 0.001 + Math.random() * 0.002,
                amp: 2 + Math.random() * 5
            };

            this.scene.add(blob);
            this.blobs.push(blob);
        }
    }

    addLogo() {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/static/img/logo.png', (texture) => {
            const geometry = new THREE.CircleGeometry(4, 64);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.95, // Increased prominence for therapeutic focus
                side: THREE.DoubleSide
            });
            this.logoMesh = new THREE.Mesh(geometry, material);

            const scale = this.isMobile ? 0.75 : 1.1;
            this.logoMesh.scale.setScalar(scale);

            this.logoMesh.position.set(0, 0, -2);
            this.scene.add(this.logoMesh);

            // Soft aura behind logo
            this.addAura();
        }, undefined, (err) => {
            console.error("Logo texture failed to load:", err);
        });
    }

    addAura() {
        const auraGeo = new THREE.CircleGeometry(4.5, 64);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.position.z = -2.1;
        this.scene.add(aura);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onWindowResize() {
        this.isMobile = window.innerWidth <= 768;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.camera.position.z = this.isMobile ? 10 : 6;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Extremely slow parallax for "calm"
        this.targetRotation.x += (this.mouse.y * 0.05 - this.targetRotation.x) * 0.02;
        this.targetRotation.y += (this.mouse.x * 0.05 - this.targetRotation.y) * 0.02;

        this.scene.rotation.x = this.targetRotation.x;
        this.scene.rotation.y = this.targetRotation.y;

        // Organic blob floating
        this.blobs.forEach(blob => {
            blob.userData.phase += blob.userData.speed;
            blob.position.y += Math.sin(blob.userData.phase) * 0.005;
            blob.position.x += Math.cos(blob.userData.phase) * 0.005;
        });

        // Slow logo breathing
        if (this.logoMesh) {
            this.logoMesh.position.y = Math.sin(Date.now() * 0.0008) * 0.15;
            this.logoMesh.quaternion.copy(this.camera.quaternion);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE !== 'undefined') {
        window.somaObiEnv = new ThreeEnvironment();
    }
});
