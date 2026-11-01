import * as THREE from 'three';

export class CameraController {
  constructor(camera, curve) {
    this.camera = camera;
    this.curve = curve;
    
    // Camera position along curve (0 to 1)
    this.t = 0;
    this.speed = 0.033; // Units per second along curve (~30 sec per loop)
    this.isPlaying = true;
    
    // Look controls
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    
    // Constraints
    this.maxYaw = Math.PI / 9; // ±20 degrees
    this.maxPitch = Math.PI / 18; // ±10 degrees
    this.minPitch = -Math.PI / 36; // -5 degrees
    
    // Camera bob and sway
    this.bobOffset = 0;
    this.bobSpeed = 0.02;
    this.swayAmount = 0;
    
    // Driver head height
    this.headHeight = 1.6;
    
    // Smoothing
    this.yawSmoothing = 0.1;
    this.pitchSmoothing = 0.1;
    
    this.setupEventListeners();
    // Initialize camera position immediately
    this.initializeCamera();
  }

  initializeCamera() {
    // Set initial camera position
    const position = this.curve.getPoint(this.t);
    const tangent = this.curve.getTangent(this.t);
    
    // Validate position
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.error('Camera initialization: Invalid position from curve:', position);
      // Fallback position
      this.camera.position.set(0, this.headHeight, 0);
    } else {
      this.camera.position.copy(position);
      this.camera.position.y = this.headHeight;
    }
    
    // Validate tangent
    if (isNaN(tangent.x) || isNaN(tangent.y) || isNaN(tangent.z)) {
      console.error('Camera initialization: Invalid tangent from curve:', tangent);
      // Fallback look direction
      this.camera.lookAt(0, this.headHeight, -10);
    } else {
      // Set initial look direction - look forward along the curve
      const lookAt = position.clone().add(tangent.multiplyScalar(10));
      this.camera.lookAt(lookAt);
    }
    
    // Force matrix update
    this.camera.updateMatrixWorld();
    
    console.log('Camera initialized at:', this.camera.position);
    console.log('Camera looking at:', this.camera.getWorldDirection(new THREE.Vector3()));
    console.log('Camera matrix updated');
  }

  setupEventListeners() {
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Mouse controls
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        
        this.targetYaw += deltaX * 0.002;
        this.targetPitch -= deltaY * 0.002;
        
        // Apply constraints
        this.targetYaw = Math.max(-this.maxYaw, Math.min(this.maxYaw, this.targetYaw));
        this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch controls
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        
        this.targetYaw += deltaX * 0.002;
        this.targetPitch -= deltaY * 0.002;
        
        this.targetYaw = Math.max(-this.maxYaw, Math.min(this.maxYaw, this.targetYaw));
        this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });
  }

  update(deltaTime) {
    if (this.isPlaying && deltaTime > 0 && deltaTime < 1000) {
      // deltaTime is in milliseconds, convert to seconds
      // Speed is in curve units per second (0-1 range)
      const deltaSeconds = deltaTime / 1000;
      this.t += this.speed * deltaSeconds;
      if (this.t >= 1) {
        this.t = 0; // Loop
      }
    }

    // Smooth yaw and pitch interpolation
    this.yaw += (this.targetYaw - this.yaw) * this.yawSmoothing;
    this.pitch += (this.targetPitch - this.pitch) * this.pitchSmoothing;

    // Get position and direction from curve
    const position = this.curve.getPoint(this.t);
    const tangent = this.curve.getTangent(this.t);
    // Calculate normal manually (perpendicular to tangent in XZ plane)
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Camera bob (subtle vertical movement)
    this.bobOffset = Math.sin(Date.now() * this.bobSpeed) * 0.05;

    // Camera sway (subtle horizontal movement based on curve)
    const curveChange = this.curve.getTangent(this.t + 0.01).sub(tangent);
    this.swayAmount = curveChange.x * 0.3;

    // Set camera position (driver head height)
    this.camera.position.copy(position);
    this.camera.position.y = this.headHeight + this.bobOffset;
    this.camera.position.x += this.swayAmount;

    // Calculate camera rotation
    const baseDirection = tangent.clone();
    
    // Apply yaw (left/right look)
    const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.yaw
    );
    baseDirection.applyQuaternion(yawQuaternion);

    // Apply pitch (up/down look)
    const rightVector = new THREE.Vector3().crossVectors(
      baseDirection,
      new THREE.Vector3(0, 1, 0)
    ).normalize();
    const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(
      rightVector,
      this.pitch
    );
    baseDirection.applyQuaternion(pitchQuaternion);

    // Look at direction
    const lookAt = this.camera.position.clone().add(baseDirection);
    this.camera.lookAt(lookAt);
  }

  setSpeed(speed) {
    // speed: 'slow' | 'normal' | 'fast'
    // Values are in curve units per second (0-1 range)
    // Normal completes full loop in ~30 seconds
    const speeds = {
      slow: 0.02,    // ~50 seconds per loop
      normal: 0.033,  // ~30 seconds per loop
      fast: 0.066     // ~15 seconds per loop
    };
    this.speed = speeds[speed] || speeds.normal;
  }

  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }

  navigateToSection(t, duration = 2000) {
    // Smoothly animate camera to a specific t value
    const startT = this.t;
    const targetT = t;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease in out)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      this.t = startT + (targetT - startT) * eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  getCurrentT() {
    return this.t;
  }
}

