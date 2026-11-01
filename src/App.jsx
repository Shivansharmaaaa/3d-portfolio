import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import './App.css';

export default function App() {
  const [selectedSky, setSelectedSky] = useState(2);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const curveRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Create a new Three.js scene
    const scene = new THREE.Scene();
    // Set initial background color (will be overridden by sky shader if working)
    scene.background = new THREE.Color(0xff6b35); // Sunset orange background
    sceneRef.current = scene;

    // 2. Add a PerspectiveCamera positioned at (0, 10, 30) looking at (0, 0, 0)
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Add bright AmbientLight and one DirectionalLight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // 4. Add a ground plane 200x200 using a basic material
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x90ee90, // Light green
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = false;
    scene.add(ground);

    // 5. Create a 5x5 grid city layout
    // 25 total building plots
    // Each building is a simple box
    // Building height random between 3 and 12
    // Buildings spaced 10 units apart
    // Use BoxGeometry with MeshStandardMaterial and random pastel colors
    const gridSize = 5;
    const spacing = 10;
    const startOffset = -(gridSize - 1) * spacing / 2;

    // Helper function to generate pastel colors
    const getPastelColor = () => {
      const hue = Math.random() * 360;
      const saturation = 0.3 + Math.random() * 0.3; // 0.3 to 0.6
      const lightness = 0.7 + Math.random() * 0.2; // 0.7 to 0.9
      return new THREE.Color().setHSL(hue / 360, saturation, lightness);
    };

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = startOffset + col * spacing;
        const z = startOffset + row * spacing;
        const height = 3 + Math.random() * 9; // Random height between 3 and 12

        const buildingGeometry = new THREE.BoxGeometry(4, height, 4);
        const buildingMaterial = new THREE.MeshStandardMaterial({
          color: getPastelColor(),
          roughness: 0.7,
          metalness: 0.3
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, height / 2, z); // Position so bottom is at y=0
        scene.add(building);
      }
    }

    // 6. Add AxesHelper and GridHelper for debugging
    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);
    
    const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // ========== STEP 2: LOOP ROAD AND CURVE PATH ==========
    
    // 1. Create a looping CatmullRomCurve3 path
    // Center around (0, 0, 0), Radius: ~50 units, 16 evenly spaced points, closed = true
    const curveRadius = 50;
    const numPoints = 16;
    const curvePoints = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = Math.cos(angle) * curveRadius;
      const z = Math.sin(angle) * curveRadius;
      const y = 0;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    
    const curve = new THREE.CatmullRomCurve3(curvePoints, true); // closed = true
    curveRef.current = curve; // Store curve for Step 3 camera movement
    
    // 2. Visualize the curve - Add a visible line so we can see the path
    // Use THREE.Line, Geometry sampled from the curve with 200 points, Material: bright color
    const linePoints = [];
    const numLinePoints = 200;
    for (let i = 0; i <= numLinePoints; i++) {
      const t = i / numLinePoints;
      const point = curve.getPoint(t);
      linePoints.push(point);
    }
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ffff, // Bright cyan
      linewidth: 2
    });
    const curveLine = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(curveLine);
    
    // 3. Add a simple road mesh following the curve
    // Option A: Use THREE.RingGeometry
    // innerRadius ≈ 45, outerRadius ≈ 55, rotate flat onto XZ plane, color = dark gray
    const innerRadius = 45;
    const outerRadius = 55;
    const roadGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a, // Dark gray
      roughness: 0.9,
      metalness: 0.1
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2; // Rotate flat onto XZ plane
    road.position.y = 0.01; // Slightly above ground to avoid z-fighting
    scene.add(road);

    // ========== STEP 10: ADD STREETLIGHTS ALONG THE ROAD LOOP ==========
    
    // 1. Prepare a Group for all streetlights
    const streetlightGroup = new THREE.Group();
    scene.add(streetlightGroup);
    
    // 4. Create a function to build a simple streetlight
    function createStreetlight(position, rotationY) {
      const group = new THREE.Group();
      
      // POLE
      const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 4);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(0, 2, 0);
      group.add(pole);
      
      // LIGHT ARM
      const armGeom = new THREE.BoxGeometry(1, 0.2, 0.2);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const arm = new THREE.Mesh(armGeom, armMat);
      arm.position.set(0.5, 4, 0);
      group.add(arm);
      
      // BULB (emissive only - no PointLight for performance)
      const bulbGeom = new THREE.SphereGeometry(0.15, 16, 16);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffdd,
        emissiveIntensity: 3
      });
      const bulb = new THREE.Mesh(bulbGeom, bulbMat);
      bulb.position.set(1, 4, 0);
      group.add(bulb);
      
      // LIGHT SOURCE REMOVED - Using global lights instead for performance
      
      group.position.copy(position);
      group.rotation.y = rotationY; // Rotate to face the road
      return group;
    }
    
    // 2. Sample the curve at equal distances
    const streetlightCount = 40;
    for (let i = 0; i < streetlightCount; i++) {
      const t = i / streetlightCount;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      
      // 3. Define left and right streetlight positions
      const offset = 7; // distance from road edge
      const leftPos = point.clone().add(normal.clone().multiplyScalar(offset));
      const rightPos = point.clone().add(normal.clone().multiplyScalar(-offset));
      
      // Determine which side is inner (closer to origin) and which is outer
      const leftDistanceFromOrigin = leftPos.length();
      const rightDistanceFromOrigin = rightPos.length();
      const isLeftInner = leftDistanceFromOrigin < rightDistanceFromOrigin;
      
      // Calculate rotation to face the road
      // Inner lights face outward (away from center), outer lights face inward (toward center)
      // Direction from streetlight position to road center point
      const leftToRoad = point.clone().sub(leftPos).normalize();
      const rightToRoad = point.clone().sub(rightPos).normalize();
      
      // For inner lights, we want them to face outward (opposite direction)
      // For outer lights, we want them to face inward (same direction as calculated)
      const leftRotation = isLeftInner 
        ? Math.atan2(-leftToRoad.x, -leftToRoad.z)  // Inner: reverse direction
        : Math.atan2(leftToRoad.x, leftToRoad.z);    // Outer: normal direction
      
      const rightRotation = isLeftInner
        ? Math.atan2(rightToRoad.x, rightToRoad.z)   // Outer: normal direction
        : Math.atan2(-rightToRoad.x, -rightToRoad.z); // Inner: reverse direction
      
      // 5. Add streetlights left AND right with proper rotation
      streetlightGroup.add(createStreetlight(leftPos, leftRotation));
      streetlightGroup.add(createStreetlight(rightPos, rightRotation));
    }
    
    // ========== STEP 10.5 PART A: ADD GLOBAL LIGHTS FOR PERFORMANCE ==========
    // Replace 80 expensive PointLights with 3-5 global lights
    
    // 3. Add one global "night ambient light"
    const nightLight = new THREE.PointLight(0x222244, 1.5, 300);
    nightLight.position.set(0, 40, 0);
    scene.add(nightLight);
    
    // 4. Optional: Add 2 warm city lights
    const warm1 = new THREE.PointLight(0x442200, 0.8, 200);
    warm1.position.set(60, 20, -40);
    scene.add(warm1);
    
    const warm2 = new THREE.PointLight(0x442200, 0.8, 200);
    warm2.position.set(-40, 20, 60);
    scene.add(warm2);

    // ========== STEP 8: ADD SIMPLE SKY + HORIZON GRADIENT ==========
    
    // --- SKY SETUP ---
    // Create a giant sky sphere
    const skyGeometry = new THREE.SphereGeometry(30000, 32, 32);
    
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor:       { value: new THREE.Color() },
        bottomColor:    { value: new THREE.Color() },
        starIntensity:  { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPosition = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float starIntensity;
        float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453123);
        }
        void main() {
          vec3 dir = normalize(vWorldPosition);
          float h = clamp((dir.y + 1.0) * 0.5, 0.0, 1.0);
          vec3 base = mix(bottomColor, topColor, h);
          float star = step(0.997, rand(vWorldPosition.xz * 0.0004)) * starIntensity;
          gl_FragColor = vec4(base + vec3(star), 1.0);
        }
      `,
      side: THREE.BackSide,
      transparent: false
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.renderOrder = -1000;
    scene.add(sky);
    
    // Remove scene background so sky shader can show through
    scene.background = null;

    // --- SUN ---
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(120, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffcc44,
        emissive: 0xffdd88,
        emissiveIntensity: 3
      })
    );
    scene.add(sun);

    // --- MOON ---
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(80, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffee,
        emissiveIntensity: 1.5
      })
    );
    scene.add(moon);

    // ========== STEP 8.5: ADD SKY MODE SWITCHER ==========
    
    // 1. Add a global variable to store current sky mode
    let skyMode = 2;
    
    // --- UPDATE THE SKY EACH FRAME ---
    function updateSkyLoop(camera) {
      if (!skyMaterial || !skyMaterial.uniforms) return;
      
      const top = skyMaterial.uniforms.topColor.value;
      const bottom = skyMaterial.uniforms.bottomColor.value;
      const stars = skyMaterial.uniforms.starIntensity;

      // SUNSET → NIGHT (Mode 2)
      if (skyMode === 2) {
        // 0 → 1 loop (full day cycle)
        const t = (Date.now() * 0.00003) % 1.0;
        
        // --- MORNING (0.0 → 0.25) ---
        if (t < 0.25) {
          const k = t / 0.25;
          top.setRGB(0.8*k, 0.5*k, 0.2 + 0.4*k);
          bottom.setRGB(0.9*k, 0.6*k, 0.3 + 0.3*k);
          stars.value = 0;
          sun.visible = true;
          moon.visible = false;
        }
        // --- SUNSET (0.25 → 0.5) ---
        else if (t < 0.5) {
          const k = (t - 0.25) / 0.25;
          top.setRGB(1.0 - 0.4*k, 0.5*(1-k), 0.2 + 0.5*k);
          bottom.setRGB(0.9 - 0.4*k, 0.3*(1-k), 0.2 + 0.5*k);
          stars.value = 0;
          sun.visible = true;
          moon.visible = false;
        }
        // --- NIGHT (0.5 → 0.75) ---
        else if (t < 0.75) {
          const k = (t - 0.5) / 0.25;
          top.setRGB(0.0, 0.0, 0.4 + 0.3*k);
          bottom.setRGB(0.0, 0.0, 0.2 + 0.3*k);
          stars.value = k;
          sun.visible = false;
          moon.visible = true;
        }
        // --- MORNING AGAIN (0.75 → 1.0) ---
        else {
          const k = (t - 0.75) / 0.25;
          top.setRGB(0.5*k, 0.3*k, 0.7*(1-k));
          bottom.setRGB(0.6*k, 0.4*k, 0.5*(1-k));
          stars.value = 1-k;
          sun.visible = true;
          moon.visible = false;
        }
      }

      // REAL-TIME SKY (Mode 3)
      else if (skyMode === 3) {
        const hour = new Date().getHours() + new Date().getMinutes() / 60;
        const k = hour / 24;
        
        // Map to 0-1 cycle similar to mode 2
        const t = k;
        
        if (t < 0.25) {
          const k2 = t / 0.25;
          top.setRGB(0.8*k2, 0.5*k2, 0.2 + 0.4*k2);
          bottom.setRGB(0.9*k2, 0.6*k2, 0.3 + 0.3*k2);
          stars.value = 0;
          sun.visible = true;
          moon.visible = false;
        } else if (t < 0.5) {
          const k2 = (t - 0.25) / 0.25;
          top.setRGB(1.0 - 0.4*k2, 0.5*(1-k2), 0.2 + 0.5*k2);
          bottom.setRGB(0.9 - 0.4*k2, 0.3*(1-k2), 0.2 + 0.5*k2);
          stars.value = 0;
          sun.visible = true;
          moon.visible = false;
        } else if (t < 0.75) {
          const k2 = (t - 0.5) / 0.25;
          top.setRGB(0.0, 0.0, 0.4 + 0.3*k2);
          bottom.setRGB(0.0, 0.0, 0.2 + 0.3*k2);
          stars.value = k2;
          sun.visible = false;
          moon.visible = true;
        } else {
          const k2 = (t - 0.75) / 0.25;
          top.setRGB(0.5*k2, 0.3*k2, 0.7*(1-k2));
          bottom.setRGB(0.6*k2, 0.4*k2, 0.5*(1-k2));
          stars.value = 1-k2;
          sun.visible = true;
          moon.visible = false;
        }
      }

      // CYBERPUNK NEON (Mode 5)
      else if (skyMode === 5) {
        top.set(0x7a00ff);
        bottom.set(0x001133);
        stars.value = 1.0;
        sun.visible = false;
        moon.visible = true;
      }

      // Move sky with camera
      sky.position.copy(camera.position);
      // Move sun & moon relative to camera
      sun.position.copy(camera.position).add(new THREE.Vector3(600, 800, -1200));
      moon.position.copy(camera.position).add(new THREE.Vector3(-900, 700, 1400));
    }
    
    // Alias for compatibility with existing code
    function updateSkyColors() {
      updateSkyLoop(camera);
    }
    
    // 4. Add simple functions for switching modes
    function setSkyMode(mode) {
      skyMode = mode;   // mode ∈ {2,3,5}
      updateSkyColors();
      // Update React state for button highlighting
      setSelectedSky(mode);
    }
    
    // Make setSkyMode accessible for manual testing (call setSkyMode(2), setSkyMode(3), or setSkyMode(5))
    window.setSkyMode = setSkyMode;
    
    // Initialize sky colors - call immediately to set initial colors
    updateSkyColors();
    
    // Force material update to ensure shader sees the initial colors
    skyMaterial.needsUpdate = true;

    // ========== STEP 7: ADD SIMPLE CAR INTERIOR FRAME ==========
    
    // 1. Create a new Group to hold all interior meshes
    const carInterior = new THREE.Group();
    
    // 2. Add basic interior elements inside this group
    
  
    // Dashboard
    const dashGeom = new THREE.BoxGeometry(4, 0.3, 1);
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const dashboard = new THREE.Mesh(dashGeom, dashMat);
    dashboard.position.set(0, -0.8, -0.8);
    carInterior.add(dashboard);
    
    // A-Pillars (left & right frame)
    const pillarGeom = new THREE.BoxGeometry(0.2, 1.4, 0.2);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e });
    
    // 3. Add slight transparency to keep view clean (optional)
    pillarMat.transparent = true;
    pillarMat.opacity = 0.85;
    
    const leftPillar = new THREE.Mesh(pillarGeom, pillarMat);
    leftPillar.position.set(-1.1, 0.1, -0.5);
    const rightPillar = new THREE.Mesh(pillarGeom, pillarMat);
    rightPillar.position.set(1.1, 0.1, -0.5);
    carInterior.add(leftPillar);
    carInterior.add(rightPillar);
    
    // Windshield top frame
    const topGeom = new THREE.BoxGeometry(3.2, 0.2, 0.2);
    const topFrame = new THREE.Mesh(topGeom, pillarMat);
    topFrame.position.set(0, 0.9, -0.5);
    carInterior.add(topFrame);
    
    // 4. Add this carInterior group to the scene
    scene.add(carInterior);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // Set clear color to sunset orange as fallback
    renderer.setClearColor(0xff6b35, 1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ========== STEP 3: BASIC CAMERA MOVEMENT ON THE CURVE ==========
    // ========== STEP 4: ADJUST CAMERA PLACEMENT FOR BUILDING VISIBILITY ==========
    // ========== STEP 6 (UPDATED): DRIVER LOOK CONTROL WITH CLICK-TO-LOOK ==========
    
    // Add a parameter "t" to control the camera position
    let t = 0;
    
    // STEP 6 (UPDATED): Add state variables outside the loop
    let isLooking = false;
    let lookOffsetX = 0;
    let lookOffsetY = 0;

    // 7. Create an animation loop that updates camera position and renders
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Update camera position each frame
      if (curveRef.current) {
        // Increment t continuously
        t += 0.0005;
        // Loop back to 0 when it reaches or exceeds 1 (smooth continuous loop)
        // For closed curves, t=0 and t=1 are the same point, so we wrap to 0
        if (t >= 1.0) {
          t = t - Math.floor(t); // Smooth wrap: handles values > 1.0 properly
        }
        
        // Get point on curve (getPointAt handles closed curves properly)
        const pointOnCurve = curveRef.current.getPointAt(t);
        
        // STEP 4: Compute a perpendicular "inner" direction
        // Get tangent from curve
        const tangent = curveRef.current.getTangentAt(t);
        // Compute perpendicular vector in XZ plane (pointing inward)
        const perpendicular = new THREE.Vector3(-tangent.z, 0, tangent.x);
        // Normalize it
        perpendicular.normalize();
        
        // STEP 4: Offset camera inward
        // offsetDistance = 8 to 12 units (using 10 as middle value)
        const offsetDistance = 10;
        // Calculate offset: perpendicular * -offsetDistance (as per requirements)
        const offsetVector = perpendicular.multiplyScalar(-offsetDistance);
        
        // Calculate final camera position: pointOnCurve + offset
        const finalPosition = pointOnCurve.clone().add(offsetVector);
        
        // STEP 4: Add height (5 to 8 units, using 6.5 as middle value)
        finalPosition.y = 6.5;
        
        // Set camera position
        camera.position.set(finalPosition.x, finalPosition.y, finalPosition.z);
        
        // ========== STEP 5: SMOOTH CAMERA STEERING + NATURAL TURNING ==========
        
        // 1. Compute forward direction each frame
        const forward = curveRef.current.getTangentAt(t).clone().normalize();
        
        // 2. Compute the desired look-at target (handle wrapping for closed curve)
        const lookAheadT = t + 0.01;
        const wrappedLookAheadT = lookAheadT >= 1.0 ? lookAheadT - Math.floor(lookAheadT) : lookAheadT;
        const lookAt = curveRef.current.getPointAt(wrappedLookAheadT);
        
        // 3. Create desired orientation quaternion
        let desiredQuat = new THREE.Quaternion();
        desiredQuat.setFromRotationMatrix(
          new THREE.Matrix4().lookAt(camera.position, lookAt, new THREE.Vector3(0, 1, 0))
        );
        
        // 4. Compute sideways direction for banking
        const side = new THREE.Vector3(-forward.z, 0, forward.x).normalize();
        
        // 5. Compute turn strength
        // Get the next forward direction to determine turn amount (handle wrapping)
        const nextForward = curveRef.current.getTangentAt(wrappedLookAheadT).clone().normalize();
        // Compute cross product to get turn direction (Y component indicates left/right)
        const turnVector = new THREE.Vector3().crossVectors(forward, nextForward);
        const turnStrength = turnVector.y; // Positive = left turn, Negative = right turn
        
        // 6. Apply tilt by modifying the desired quaternion
        const tiltAmount = turnStrength * 0.3;
        desiredQuat.multiply(
          new THREE.Quaternion().setFromAxisAngle(forward, tiltAmount)
        );
        
        // ========== STEP 6 (UPDATED): APPLY LOOK OFFSETS ==========
        // Apply look offset only if isLooking is true
        if (isLooking) {
          const lookQuat = new THREE.Quaternion();
          lookQuat.setFromEuler(new THREE.Euler(lookOffsetY, lookOffsetX, 0));
          desiredQuat.multiply(lookQuat);
        }
        
        // 7. Smoothly rotate the camera toward the desired orientation
        camera.quaternion.slerp(desiredQuat, 0.05);
        
        // 8. Remove any direct camera.lookAt calls (removed - using quaternion only)
        
        // ========== STEP 7: SYNC CAR INTERIOR TO CAMERA ==========
        // In the animation loop, sync interior to camera
        // Every frame, AFTER updating camera position & orientation:
        carInterior.position.copy(camera.position);
        carInterior.quaternion.copy(camera.quaternion);
        
        // 6. Offset the interior slightly backward so it doesn't clip camera
        carInterior.position.add(
          camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-0.1)
        );
      }
      
      // ========== STEP 8.5: UPDATE SKY COLORS ==========
      // Update sky colors and positions (sky, sun, moon follow camera inside updateSkyLoop)
      updateSkyLoop(camera);

      // Clear the renderer before rendering each frame
      renderer.clear();
      renderer.render(scene, camera);
    };

    animate();

    // ========== STEP 6 (UPDATED): ADD MOUSE/TOUCH LOOK CONTROLS ==========
    
    // Mouse controls
    const handleMouseDown = () => {
      isLooking = true;
    };
    window.addEventListener('mousedown', handleMouseDown);
    
    const handleMouseUp = () => {
      isLooking = false;
      lookOffsetX = 0;
      lookOffsetY = 0;
    };
    window.addEventListener('mouseup', handleMouseUp);
    
    const handleMouseMove = (e) => {
      if (!isLooking) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      lookOffsetX = x * 0.3;
      lookOffsetY = y * 0.2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    // Touch controls
    const handleTouchStart = () => {
      isLooking = true;
    };
    window.addEventListener('touchstart', handleTouchStart);
    
    const handleTouchEnd = () => {
      isLooking = false;
      lookOffsetX = 0;
      lookOffsetY = 0;
    };
    window.addEventListener('touchend', handleTouchEnd);
    
    const handleTouchMove = (e) => {
      if (!isLooking) return;
      e.preventDefault(); // Prevent scrolling
      const t = e.touches[0];
      const x = (t.clientX / window.innerWidth) * 2 - 1;
      const y = (t.clientY / window.innerHeight) * 2 - 1;
      lookOffsetX = x * 0.3;
      lookOffsetY = y * 0.2;
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mountRef.current && rendererRef.current && rendererRef.current.domElement) {
        try {
          mountRef.current.removeChild(rendererRef.current.domElement);
        } catch (e) {
          console.warn('Error removing renderer:', e);
        }
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="app">
      <div ref={mountRef} className="canvas-container" />
      
      {/* ========== STEP 10.5 PART B: SKY MODE BUTTONS ========== */}
      <div 
        id="skyButtons" 
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <button 
          onClick={() => {
            setSelectedSky(2);
            window.setSkyMode && window.setSkyMode(2);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedSky === 2 ? '#7a00ff' : '#333',
            border: selectedSky === 2 ? '2px solid #fff' : '1px solid #555',
            color: '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          Sunset → Night
        </button>
        <button 
          onClick={() => {
            setSelectedSky(3);
            window.setSkyMode && window.setSkyMode(3);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedSky === 3 ? '#7a00ff' : '#333',
            border: selectedSky === 3 ? '2px solid #fff' : '1px solid #555',
            color: '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          Real Time Sky
        </button>
        <button 
          onClick={() => {
            setSelectedSky(5);
            window.setSkyMode && window.setSkyMode(5);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedSky === 5 ? '#7a00ff' : '#333',
            border: selectedSky === 5 ? '2px solid #fff' : '1px solid #555',
            color: '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          Cyberpunk
        </button>
      </div>
    </div>
  );
}
