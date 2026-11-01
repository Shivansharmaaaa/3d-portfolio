# City Rendering Test Checklist

## How to Confirm Your City is Now Rendering

### 1. **Initial Load Check**
- [ ] Open browser console (F12)
- [ ] Check for any red error messages
- [ ] Verify these console logs appear:
  - "Curve created with X points"
  - "Road created with X/Y valid segments"
  - "Lane markings created: X/Y"
  - "City built: X buildings, Y streetlights, Z billboards"
  - "Sky created at origin, camera should be inside"
  - "Stars created: 500"
  - "Car interior created and added to camera"
  - "Camera initialized at: Vector3(...)"
  - "Scene children: X" (should be > 10)

### 2. **Visual Checks**
- [ ] **Road**: You should see a dark gray/black road surface following a curved path
- [ ] **Buildings**: Multiple buildings of varying heights on both sides of the road
- [ ] **Streetlights**: Orange glowing lights along the road
- [ ] **Sky**: Dark blue/purple background (not just black)
- [ ] **Stars**: Small white dots in the sky
- [ ] **Car Interior**: Dashboard, steering wheel, and windshield pillars visible in foreground
- [ ] **Lane Markings**: Yellow lines on the road

### 3. **Debug Mode (Press 'D' Key)**
- [ ] Press 'D' to toggle debug mode
- [ ] When enabled, you should see:
  - Red/Green/Blue axes (X/Y/Z) at origin
  - Grid lines on the ground
  - Ability to orbit camera with mouse
- [ ] Press 'D' again to disable and return to car POV

### 4. **Camera Position Verification**
- [ ] In debug mode, check console logs every 60 frames
- [ ] Camera position should show valid numbers (not NaN)
- [ ] Camera should be at approximately y=1.6 (driver head height)
- [ ] Camera should be positioned along the curve, not at (0,0,0)

### 5. **Performance Check**
- [ ] Page should load within 2-3 seconds
- [ ] No browser freezing or lag
- [ ] Smooth camera movement when playing
- [ ] Frame rate should be stable (check with browser dev tools)

### 6. **Interaction Tests**
- [ ] Click on billboards - modal should open
- [ ] Mouse drag - camera should look around (limited range)
- [ ] Play/Pause button works
- [ ] Speed controls (Slow/Normal/Fast) work
- [ ] Navigation menu items work (About, Projects, etc.)

### 7. **Error Detection**
- [ ] No "NaN" values in console
- [ ] No "undefined" or "null" errors
- [ ] No "Cannot read property" errors
- [ ] All console warnings are non-critical

### 8. **Lighting Verification**
- [ ] Buildings are visible (not completely black)
- [ ] Windows have blue glow
- [ ] Streetlights emit orange light
- [ ] Shadows are visible (if high graphics mode)

### 9. **Common Issues & Solutions**

**If you see nothing:**
1. Check browser console for errors
2. Press 'D' to enable debug mode and orbit camera
3. Verify camera position in console
4. Check if scene.children.length > 0

**If buildings are missing:**
1. Check console for "City built: X buildings" - X should be > 0
2. In debug mode, orbit camera to see if buildings are there but camera is looking wrong direction
3. Check for NaN errors in building creation

**If road is missing:**
1. Check console for "Road created with X/Y valid segments"
2. Verify curve is valid (check "Curve created" log)
3. Check if road segments have valid positions

**If sky is black:**
1. Verify "Sky created" log appears
2. Check if camera is inside sky sphere (should be at y=1.6, not y=0)
3. Verify sky sphere radius is 1000

**If performance is poor:**
1. Reduce counts in cityBuilder.js (buildings, lights, stars)
2. Switch to "Low Graphics" mode
3. Check browser performance tab for bottlenecks

### 10. **Final Verification**
- [ ] All visual elements render correctly
- [ ] No console errors
- [ ] Smooth performance
- [ ] All interactions work
- [ ] Debug mode works (press 'D')
- [ ] Camera follows curve path
- [ ] City is dense and visible

## Quick Debug Commands

Open browser console and run:
```javascript
// Check scene
console.log('Scene children:', window.scene?.children.length);

// Check camera
console.log('Camera position:', window.camera?.position);
console.log('Camera rotation:', window.camera?.rotation);

// Check curve
console.log('Curve test point:', window.curve?.getPoint(0));
```

## Success Criteria

✅ **City is rendering if:**
- You can see road, buildings, lights, and sky
- Console shows no critical errors
- Camera moves along the curve
- Debug mode works
- All objects are visible and positioned correctly

❌ **City is NOT rendering if:**
- Screen is completely black (except UI)
- Console shows critical errors
- Scene.children.length is 0 or very low
- Camera position is NaN or (0,0,0)
- No objects visible even in debug mode

