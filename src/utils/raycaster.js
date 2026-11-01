import * as THREE from 'three';

export class InteractiveRaycaster {
  constructor(camera, scene, interactiveElements) {
    this.camera = camera;
    this.scene = scene;
    this.interactiveElements = interactiveElements;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredElement = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('click', (e) => this.onClick(e));
    window.addEventListener('touchstart', (e) => this.onTouchStart(e));
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.update();
  }

  onTouchStart(event) {
    if (event.touches.length > 0) {
      this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      this.update();
      this.onClick(event);
    }
  }

  onClick(event) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveElements, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      let interactiveElement = clickedObject;
      
      // Traverse up to find the interactive parent
      while (interactiveElement && !interactiveElement.userData.isInteractive) {
        interactiveElement = interactiveElement.parent;
      }

      if (interactiveElement && interactiveElement.userData.isInteractive) {
        const project = interactiveElement.userData.project;
        if (project) {
          // Dispatch custom event for modal
          window.dispatchEvent(new CustomEvent('projectClick', { detail: project }));
        }
      }
    }
  }

  update() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveElements, true);

    // Reset previous hover
    if (this.hoveredElement) {
      const userData = this.hoveredElement.userData;
      if (userData.originalScale !== undefined) {
        this.hoveredElement.scale.setScalar(userData.originalScale);
      }
      if (userData.originalEmissive !== undefined && this.hoveredElement.children) {
        this.hoveredElement.children.forEach(child => {
          if (child.material && child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = userData.originalEmissive;
          }
        });
      }
      this.hoveredElement = null;
    }

    // Check for new hover
    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object;
      let interactiveElement = hoveredObject;
      
      while (interactiveElement && !interactiveElement.userData.isInteractive) {
        interactiveElement = interactiveElement.parent;
      }

      if (interactiveElement && interactiveElement.userData.isInteractive) {
        this.hoveredElement = interactiveElement;
        const userData = interactiveElement.userData;
        
        // Scale up
        if (userData.originalScale === undefined) {
          userData.originalScale = interactiveElement.scale.x;
        }
        interactiveElement.scale.setScalar(userData.originalScale * 1.1);
        
        // Increase emissive
        if (interactiveElement.children) {
          interactiveElement.children.forEach(child => {
            if (child.material && child.material.emissiveIntensity !== undefined) {
              if (userData.originalEmissive === undefined) {
                userData.originalEmissive = child.material.emissiveIntensity;
              }
              child.material.emissiveIntensity = userData.originalEmissive * 2;
            }
          });
        }
        
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    } else {
      document.body.style.cursor = 'default';
    }
  }
}

