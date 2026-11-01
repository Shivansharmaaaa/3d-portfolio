# 3D Portfolio Website

A stunning 3D portfolio website built with Three.js, featuring a driver's perspective view of a stylized night-time city.

## Features

- **Immersive 3D Experience**: Drive through a city from a first-person perspective
- **Interactive Projects**: Click on billboards to view project details
- **Smooth Navigation**: Navigate to different sections (About, Projects, Skills, Contact)
- **Performance Modes**: Toggle between High and Low graphics quality
- **Speed Controls**: Adjust driving speed (Slow, Normal, Fast)
- **Responsive Design**: Works on desktop and mobile devices
- **Loading Screen**: Beautiful preloader with progress bar

## Tech Stack

- React
- Three.js
- Vite

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

- `src/App.jsx` - Main application component
- `src/utils/cityBuilder.js` - City environment builder
- `src/utils/cameraController.js` - Camera movement and controls
- `src/utils/raycaster.js` - Interactive element detection
- `src/components/` - UI components (LoadingScreen, UI, ProjectModal)
- `src/data/projects.js` - Project data structure

## Customization

Edit `src/data/projects.js` to add your own projects. Each project should have:
- `id`: Unique identifier
- `name`: Project name
- `description`: Project description
- `tags`: Array of technology tags
- `github`: GitHub repository URL
- `live`: Live demo URL
- `curveT`: Position along the road curve (0 to 1)

## License

MIT

