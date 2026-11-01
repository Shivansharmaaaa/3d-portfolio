import * as THREE from 'three';
import { projects } from '../data/projects';

// Helper function to validate and clamp values
function validateVector3(vec, context = '') {
  if (!vec || !(vec instanceof THREE.Vector3)) {
    console.error(`Invalid Vector3 in ${context}:`, vec);
    return new THREE.Vector3(0, 0, 0);
  }
  
  if (isNaN(vec.x) || isNaN(vec.y) || isNaN(vec.z)) {
    console.error(`NaN detected in Vector3 ${context}:`, vec);
    return new THREE.Vector3(
      isNaN(vec.x) ? 0 : vec.x,
      isNaN(vec.y) ? 0 : vec.y,
      isNaN(vec.z) ? 0 : vec.z
    );
  }
  
  return vec;
}

function clamp(value, min, max) {
  if (isNaN(value)) {
    console.warn('NaN value clamped, using min:', value);
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

export class CityBuilder {
  constructor(scene) {
    if (!scene) {
      console.error('CityBuilder: Scene is required');
      throw new Error('Scene is required');
    }
    this.scene = scene;
    this.buildings = [];
    this.streetlights = [];
    this.billboards = [];
    this.interactiveElements = [];
  }

  createRoad(curve, width = 8) {
    if (!curve) {
      console.error('createRoad: Curve is required');
      throw new Error('Curve is required for createRoad');
    }

    if (typeof width !== 'number' || isNaN(width) || width <= 0) {
      console.warn('createRoad: Invalid width, using default 8');
      width = 8;
    }

    // Reduced segments for performance during debugging
    const numSegments = 200; // Reduced from 400
    const roadGroup = new THREE.Group();
    
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    });

    let validSegments = 0;
    for (let i = 0; i < numSegments; i++) {
      try {
        const t1 = i / numSegments;
        const t2 = (i + 1) / numSegments;
        
        if (isNaN(t1) || isNaN(t2)) {
          console.error(`createRoad: NaN in t values at index ${i}`);
          continue;
        }
        
        const point1 = curve.getPoint(t1);
        const point2 = curve.getPoint(t2);
        const tangent = curve.getTangent(t1);
        
        // Validate points
        const validPoint1 = validateVector3(point1, `createRoad segment ${i} point1`);
        const validPoint2 = validateVector3(point2, `createRoad segment ${i} point2`);
        const validTangent = validateVector3(tangent, `createRoad segment ${i} tangent`);
        
        // Calculate distance between points for proper segment length
        const distance = validPoint1.distanceTo(validPoint2);
        
        if (isNaN(distance) || distance <= 0) {
          console.warn(`createRoad: Invalid distance at segment ${i}:`, distance);
          continue;
        }
        
        // Create road segment
        const segmentGeometry = new THREE.PlaneGeometry(width, distance);
        const segment = new THREE.Mesh(segmentGeometry, roadMaterial);
        
        // Position and orient segment
        const midPoint = validPoint1.clone().add(validPoint2).multiplyScalar(0.5);
        segment.position.copy(midPoint);
        segment.position.y = 0;
        
        // Rotate to align with curve
        segment.rotation.x = -Math.PI / 2;
        segment.rotation.z = Math.atan2(validTangent.x, validTangent.z);
        
        if (isNaN(segment.rotation.z)) {
          console.warn(`createRoad: NaN rotation at segment ${i}`);
          segment.rotation.z = 0;
        }
        
        segment.receiveShadow = true;
        roadGroup.add(segment);
        validSegments++;
      } catch (error) {
        console.error(`createRoad: Error creating segment ${i}:`, error);
      }
    }

    this.scene.add(roadGroup);
    console.log(`Road created with ${validSegments}/${numSegments} valid segments`);

    // Add lane markings
    this.createLaneMarkings(curve, width);
    
    return roadGroup;
  }

  createLaneMarkings(curve, roadWidth) {
    if (!curve) {
      console.error('createLaneMarkings: Curve is required');
      return;
    }

    const markingGeometry = new THREE.PlaneGeometry(0.2, 1);
    const markingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });

    // Reduced markings for performance
    const numMarkings = 100; // Reduced from 200
    let validMarkings = 0;
    
    for (let i = 0; i < numMarkings; i++) {
      try {
        const t = i / numMarkings;
        
        if (isNaN(t)) {
          console.error(`createLaneMarkings: NaN in t at index ${i}`);
          continue;
        }
        
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t);
        
        const validPoint = validateVector3(point, `laneMarking ${i} point`);
        const validTangent = validateVector3(tangent, `laneMarking ${i} tangent`);
        
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.position.copy(validPoint);
        marking.position.y = 0.01;
        
        // Rotate to align with road
        marking.rotation.x = -Math.PI / 2;
        const rotationZ = Math.atan2(validTangent.x, validTangent.z);
        marking.rotation.z = isNaN(rotationZ) ? 0 : rotationZ;
        
        this.scene.add(marking);
        validMarkings++;
      } catch (error) {
        console.error(`createLaneMarkings: Error at index ${i}:`, error);
      }
    }
    
    console.log(`Lane markings created: ${validMarkings}/${numMarkings}`);
  }

  createBuilding(position, width, depth, height, color, emissive = false) {
    // Validate and clamp all parameters
    const validPos = validateVector3(position, 'createBuilding position');
    
    width = clamp(width, 0.5, 10);
    depth = clamp(depth, 0.5, 10);
    height = clamp(height, 2, 50);
    
    // Ensure building is above ground
    validPos.y = Math.max(0, validPos.y);
    
    if (!color || !(color instanceof THREE.Color)) {
      console.warn('createBuilding: Invalid color, using default');
      color = new THREE.Color(0x888888);
    }

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.3
    });

    if (emissive) {
      material.emissive = color;
      material.emissiveIntensity = 0.3;
    }

    const building = new THREE.Mesh(geometry, material);
    building.position.copy(validPos);
    building.position.y = height / 2; // Center building on its base
    
    // Random rotation so windows face different directions
    building.rotation.y = Math.random() * Math.PI * 2;
    
    building.castShadow = true;
    building.receiveShadow = true;
    building.userData.shouldCastShadow = true;

    // Add windows
    this.addWindows(building, width, height, depth, color);

    this.scene.add(building);
    this.buildings.push(building);
    return building;
  }

  addWindows(building, width, height, depth, baseColor) {
    if (!building || !building.isMesh) {
      console.warn('addWindows: Invalid building');
      return;
    }

    const windowCount = Math.max(1, Math.floor(height / 3));
    const windowSpacing = height / (windowCount + 1);
    
    for (let i = 1; i <= windowCount; i++) {
      const windowY = (i * windowSpacing) - (height / 2);
      const windowsPerRow = Math.max(1, Math.floor(width / 2));
      
      for (let j = 0; j < windowsPerRow; j++) {
        const windowX = (j - windowsPerRow / 2) * 2 + 1;
        const windowZ = depth / 2 + 0.01;
        
        // Validate window position
        if (isNaN(windowX) || isNaN(windowY) || isNaN(windowZ)) {
          console.warn(`addWindows: NaN in window position at ${i},${j}`);
          continue;
        }
        
        const windowGeometry = new THREE.PlaneGeometry(0.8, 0.8);
        const windowMaterial = new THREE.MeshStandardMaterial({
          color: 0x4a9eff,
          emissive: 0x4a9eff,
          emissiveIntensity: Math.random() * 0.5 + 0.3
        });

        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(windowX, windowY, windowZ);
        building.add(window);
      }
    }
  }

  createStreetlight(position, rotation = 0) {
    const validPos = validateVector3(position, 'createStreetlight position');
    validPos.y = Math.max(0, validPos.y); // Ensure on or above ground
    
    rotation = isNaN(rotation) ? 0 : rotation;

    const group = new THREE.Group();

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 2;
    group.add(pole);

    // Light fixture
    const fixtureGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const fixtureMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 1
    });
    const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
    fixture.position.y = 4;
    group.add(fixture);

    // Point light
    const light = new THREE.PointLight(0xffaa00, 2, 10);
    light.position.copy(fixture.position);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    group.add(light);

    group.position.copy(validPos);
    group.rotation.y = rotation;
    this.scene.add(group);
    this.streetlights.push({ group, light });

    return group;
  }

  createBillboard(position, rotation, project) {
    if (!project) {
      console.error('createBillboard: Project is required');
      return null;
    }

    // Validate project.curveT
    if (typeof project.curveT !== 'number' || isNaN(project.curveT)) {
      console.error('createBillboard: Invalid project.curveT:', project.curveT);
      return null;
    }
    
    if (project.curveT < 0 || project.curveT > 1) {
      console.warn('createBillboard: project.curveT out of range, clamping:', project.curveT);
      project.curveT = clamp(project.curveT, 0, 1);
    }

    const validPos = validateVector3(position, 'createBillboard position');
    validPos.y = Math.max(0, validPos.y);
    rotation = isNaN(rotation) ? 0 : rotation;

    const group = new THREE.Group();

    // Billboard frame
    const frameGeometry = new THREE.BoxGeometry(4, 3, 0.2);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    group.add(frame);

    // Billboard screen
    const screenGeometry = new THREE.PlaneGeometry(3.5, 2.5);
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      emissive: 0x1a1a2e,
      emissiveIntensity: 0.2
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.z = 0.11;
    group.add(screen);

    // Add text texture with fallback
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(project.name || 'Project', canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        screenMaterial.map = texture;
        screenMaterial.needsUpdate = true;
      } else {
        console.warn('createBillboard: Could not get canvas context, using default material');
      }
    } catch (error) {
      console.error('createBillboard: Error creating texture:', error);
    }

    // Support pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = -2.5;
    group.add(pole);

    group.position.copy(validPos);
    group.rotation.y = rotation;
    group.userData = {
      project: project,
      isInteractive: true,
      originalScale: 1,
      originalEmissive: 0.2
    };

    this.scene.add(group);
    this.billboards.push(group);
    this.interactiveElements.push(group);

    return group;
  }

  buildCity(curve) {
    if (!curve) {
      console.error('buildCity: Curve is required');
      throw new Error('Curve is required for buildCity');
    }

    // Reduced counts for performance during debugging
    const numBuildings = 50; // Reduced from 200
    let validBuildings = 0;
    
    for (let i = 0; i < numBuildings; i++) {
      try {
        const t = i / numBuildings;
        
        if (isNaN(t) || t < 0 || t > 1) {
          console.error(`buildCity: Invalid t at index ${i}:`, t);
          continue;
        }
        
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t);
        
        const validPoint = validateVector3(point, `buildCity building ${i} point`);
        const validTangent = validateVector3(tangent, `buildCity building ${i} tangent`);
        
        // Calculate normal
        const normal = new THREE.Vector3(-validTangent.z, 0, validTangent.x);
        if (normal.length() < 0.1) {
          console.warn(`buildCity: Invalid normal at index ${i}`);
          continue;
        }
        normal.normalize();

        // Create buildings on both sides with clamped offsets
        for (let side = -1; side <= 1; side += 2) {
          const offset = clamp((Math.random() * 8 + 5) * side, -20, 20);
          const buildingPos = validPoint.clone().add(normal.clone().multiplyScalar(offset));
          
          // Ensure building is not too close to road or too far
          const distanceFromRoad = Math.abs(offset);
          if (distanceFromRoad < 3 || distanceFromRoad > 15) {
            continue; // Skip this building
          }
          
          const width = clamp(Math.random() * 3 + 1.5, 1, 5);
          const depth = clamp(Math.random() * 3 + 1.5, 1, 5);
          const height = clamp(Math.random() * 25 + 8, 5, 35);
          const color = new THREE.Color().setHSL(
            clamp(Math.random() * 0.15 + 0.55, 0, 1),
            clamp(0.4 + Math.random() * 0.3, 0, 1),
            clamp(Math.random() * 0.3 + 0.15, 0, 1)
          );

          this.createBuilding(buildingPos, width, depth, height, color, Math.random() > 0.6);
          validBuildings++;
        }
      } catch (error) {
        console.error(`buildCity: Error creating building ${i}:`, error);
      }
    }

    // Create streetlights - reduced count
    const numLights = 30; // Reduced from 100
    let validLights = 0;
    
    for (let i = 0; i < numLights; i++) {
      try {
        const t = i / numLights;
        
        if (isNaN(t)) {
          console.error(`buildCity: Invalid t for light ${i}:`, t);
          continue;
        }
        
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t);
        
        const validPoint = validateVector3(point, `buildCity light ${i} point`);
        const validTangent = validateVector3(tangent, `buildCity light ${i} tangent`);
        
        const normal = new THREE.Vector3(-validTangent.z, 0, validTangent.x);
        if (normal.length() < 0.1) {
          continue;
        }
        normal.normalize();
        
        // Place lights on both sides
        for (let side = -1; side <= 1; side += 2) {
          const offset = clamp(4.5 * side, -10, 10);
          const lightPos = validPoint.clone().add(normal.clone().multiplyScalar(offset));
          lightPos.y = 0;
          
          const rotation = Math.atan2(validTangent.x, validTangent.z);
          if (!isNaN(rotation)) {
            this.createStreetlight(lightPos, rotation);
            validLights++;
          }
        }
      } catch (error) {
        console.error(`buildCity: Error creating light ${i}:`, error);
      }
    }

    // Create project billboards
    let validBillboards = 0;
    if (Array.isArray(projects)) {
      projects.forEach((project, index) => {
        try {
          // Validate project.curveT
          if (typeof project.curveT !== 'number' || isNaN(project.curveT)) {
            console.error(`buildCity: Invalid project.curveT for project ${index}:`, project.curveT);
            return;
          }
          
          const clampedT = clamp(project.curveT, 0, 1);
          const point = curve.getPoint(clampedT);
          const tangent = curve.getTangent(clampedT);
          
          const validPoint = validateVector3(point, `buildCity billboard ${index} point`);
          const validTangent = validateVector3(tangent, `buildCity billboard ${index} tangent`);
          
          const normal = new THREE.Vector3(-validTangent.z, 0, validTangent.x);
          if (normal.length() < 0.1) {
            return;
          }
          normal.normalize();
          
          const offset = 6;
          const billboardPos = validPoint.clone().add(normal.multiplyScalar(offset));
          billboardPos.y = clamp(billboardPos.y, 2, 10);
          
          const rotation = Math.atan2(validTangent.x, validTangent.z) + Math.PI / 2;
          if (!isNaN(rotation)) {
            const billboard = this.createBillboard(billboardPos, rotation, project);
            if (billboard) {
              validBillboards++;
            }
          }
        } catch (error) {
          console.error(`buildCity: Error creating billboard for project ${index}:`, error);
        }
      });
    } else {
      console.warn('buildCity: projects is not an array');
    }

    // Create sky
    this.createSky();
    
    console.log(`City built: ${validBuildings} buildings, ${validLights} streetlights, ${validBillboards} billboards`);
  }

  createSky() {
    // Create a large sky sphere that surrounds everything
    // Camera should be inside this sphere
    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a1a,
      side: THREE.BackSide, // Important: render inside of sphere
      fog: false
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.set(0, 0, 0); // Center at origin
    this.scene.add(sky);
    console.log('Sky created at origin, camera should be inside');

    // Add stars - reduced count for performance
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 500; // Reduced from 1000
    const starsPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      const radius = 400 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Validate star position
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        console.warn(`createSky: NaN in star position at index ${i / 3}`);
        starsPositions[i] = 0;
        starsPositions[i + 1] = 0;
        starsPositions[i + 2] = 0;
      } else {
        starsPositions[i] = x;
        starsPositions[i + 1] = y;
        starsPositions[i + 2] = z;
      }
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
    console.log(`Stars created: ${starsCount}`);
  }

  createCarInterior(camera) {
    if (!camera) {
      console.error('createCarInterior: Camera is required');
      return null;
    }

    const carGroup = new THREE.Group();
    carGroup.userData.isCarInterior = true;
    carGroup.userData.camera = camera;

    // Dashboard (front panel) - positioned in front of camera
    const dashboardGeometry = new THREE.BoxGeometry(4, 1, 0.15);
    const dashboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.9,
      metalness: 0.1
    });
    const dashboard = new THREE.Mesh(dashboardGeometry, dashboardMaterial);
    dashboard.position.set(0, 0.4, -0.6);
    carGroup.add(dashboard);

    // Dashboard top surface
    const dashboardTopGeometry = new THREE.BoxGeometry(4.2, 0.08, 0.4);
    const dashboardTop = new THREE.Mesh(dashboardTopGeometry, dashboardMaterial);
    dashboardTop.position.set(0, 0.88, -0.4);
    carGroup.add(dashboardTop);

    // Steering wheel
    const steeringWheelGroup = new THREE.Group();
    
    // Steering wheel rim
    const rimGeometry = new THREE.TorusGeometry(0.25, 0.02, 16, 32);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    steeringWheelGroup.add(rim);

    // Steering wheel spokes
    const spokeGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.02);
    const spokeMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
      spoke.position.set(
        Math.cos(angle) * 0.15,
        Math.sin(angle) * 0.15,
        0
      );
      spoke.rotation.z = angle;
      steeringWheelGroup.add(spoke);
    }

    // Center hub
    const hubGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16);
    const hub = new THREE.Mesh(hubGeometry, rimMaterial);
    hub.rotation.x = Math.PI / 2;
    steeringWheelGroup.add(hub);

    steeringWheelGroup.position.set(0.6, 0.7, -0.4);
    steeringWheelGroup.rotation.y = -Math.PI / 6;
    carGroup.add(steeringWheelGroup);

    // Windshield posts (A-pillars) - thinner and positioned correctly
    const pillarGeometry = new THREE.BoxGeometry(0.06, 1.8, 0.06);
    const pillarMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x050505,
      transparent: true,
      opacity: 0.7
    });
    
    // Left pillar
    const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    leftPillar.position.set(-1.5, 1.3, 0.1);
    carGroup.add(leftPillar);

    // Right pillar
    const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    rightPillar.position.set(1.5, 1.3, 0.1);
    carGroup.add(rightPillar);

    // Windshield frame (top) - thinner
    const windshieldTopGeometry = new THREE.BoxGeometry(3, 0.06, 0.06);
    const windshieldTop = new THREE.Mesh(windshieldTopGeometry, pillarMaterial);
    windshieldTop.position.set(0, 2.1, 0.3);
    carGroup.add(windshieldTop);

    // Side panels (interior) - positioned to not block view
    const sidePanelGeometry = new THREE.BoxGeometry(0.08, 1, 1.2);
    const sidePanelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0f0f0f,
      transparent: true,
      opacity: 0.5
    });
    
    // Left side panel - further back
    const leftPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    leftPanel.position.set(-1.6, 0.5, -0.5);
    carGroup.add(leftPanel);

    // Right side panel - further back
    const rightPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    rightPanel.position.set(1.6, 0.5, -0.5);
    carGroup.add(rightPanel);

    // Add some dashboard details (speedometer area)
    const speedoGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 32);
    const speedoMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      emissive: 0x00ff88,
      emissiveIntensity: 0.3
    });
    const speedometer = new THREE.Mesh(speedoGeometry, speedoMaterial);
    speedometer.rotation.x = Math.PI / 2;
    speedometer.position.set(-0.4, 0.6, -0.45);
    carGroup.add(speedometer);

    // Add car interior as child of camera so it follows automatically
    camera.add(carGroup);
    this.carInterior = carGroup;
    
    console.log('Car interior created and added to camera');

    return carGroup;
  }

  updateCarInterior(camera) {
    // Car interior is now a child of camera, so it follows automatically
    // No update needed, but keeping method for compatibility
  }

  getInteractiveElements() {
    return this.interactiveElements;
  }
}
