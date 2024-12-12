// script.js

// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions (ensure these match your HTML)
canvas.width = 800;
canvas.height = 600;

// Tilemap setup
let tileSize = 64; // Size of each tile in pixels
let mapWidth = 50;  // Number of tiles horizontally
let mapHeight = 50; // Number of tiles vertically
let tilemap = generateDefaultMap(mapWidth, mapHeight); // Initialize with default map

// Start and Finish Lines
let startLine = [];   // Array of [x, y] positions
let finishLine = [];  // Array of [x, y] positions

// Car properties
const carWidth = 40;  // Width of the car rectangle
const carHeight = 60; // Height of the car rectangle
let carX = Math.floor(mapWidth / 2) * tileSize + tileSize / 2; // Start at center column
let carY = Math.floor(mapHeight / 2) * tileSize + tileSize / 2; // Start at center row
let carSpeed = 0;    // Current speed of the car
let carAngle = 0;    // Current rotation angle of the car (in radians)

// Camera properties
const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height
};

// Initialize camera to center on the car
updateCamera();

// Control flags for user input
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

// Timing variables
let startTime = null;
let finishTime = null;
let lapTime = null;
let hasStarted = false;
let hasFinished = false;

// Event listeners for keyboard input
document.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
  }
});

document.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
});

// Function to add mobile control button listeners
const addMobileControls = () => {
  // Prevent touch scrolling to ensure smooth controls
  ['touchstart', 'touchend', 'touchmove'].forEach(event => {
    document.body.addEventListener(event, (e) => {
      e.preventDefault();
    }, { passive: false });
  });

  // Helper function to assign events to buttons
  const handleButtonEvent = (buttonId, key) => {
    const button = document.getElementById(buttonId);
    if (!button) return;

    // Handle mouse events
    button.addEventListener('mousedown', () => { keys[key] = true; });
    button.addEventListener('mouseup', () => { keys[key] = false; });
    button.addEventListener('mouseleave', () => { keys[key] = false; });

    // Handle touch events
    button.addEventListener('touchstart', () => { keys[key] = true; });
    button.addEventListener('touchend', () => { keys[key] = false; });
  };

  // Assign events to each control button
  handleButtonEvent('up-button', 'ArrowUp');
  handleButtonEvent('down-button', 'ArrowDown');
  handleButtonEvent('left-button', 'ArrowLeft');
  handleButtonEvent('right-button', 'ArrowRight');
};

// Initialize mobile controls
addMobileControls();

// Function to generate a default map (all grass except central roads)
function generateDefaultMap(width, height) {
  const defaultMap = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => (
      x === Math.floor(width / 2) || y === Math.floor(height / 2) ? 1 : 0
    ))
  );
  return defaultMap;
}

// Function to load map data from a JSON object
function loadMapFromJSON(jsonData) {
  if (!jsonData.map || !Array.isArray(jsonData.map)) {
    console.error('Invalid map format in JSON.');
    showMessage('Invalid map format.', true);
    return;
  }

  // Validate all rows have the same length
  const rowLength = jsonData.map[0].length;
  for (let row of jsonData.map) {
    if (!Array.isArray(row) || row.length !== rowLength) {
      console.error('Map rows must be arrays of the same length.');
      showMessage('Map rows must be arrays of the same length.', true);
      return;
    }
  }

  // Update tilemap and dimensions
  tilemap = jsonData.map;
  mapHeight = tilemap.length;
  mapWidth = tilemap[0].length;

  // Load start and finish lines
  if (jsonData.startLine && Array.isArray(jsonData.startLine)) {
    startLine = jsonData.startLine;
  } else {
    console.warn('Start line not defined or invalid in JSON. Using default center.');
    // Define default start line as central row
    startLine = tilemap[Math.floor(mapHeight / 2)].map((tile, x) => [x, Math.floor(mapHeight / 2)]);
  }

  if (jsonData.finishLine && Array.isArray(jsonData.finishLine)) {
    finishLine = jsonData.finishLine;
  } else {
    console.warn('Finish line not defined or invalid in JSON. Using default central column.');
    // Define default finish line as central column
    finishLine = tilemap.map((row, y) => [Math.floor(mapWidth / 2), y]);
  }

  // Re-center the car based on the new map
  carX = Math.floor(mapWidth / 2) * tileSize + tileSize / 2;
  carY = Math.floor(mapHeight / 2) * tileSize + tileSize / 2;

  // Reset timing variables
  startTime = null;
  finishTime = null;
  lapTime = null;
  hasStarted = false;
  hasFinished = false;

  // Reset camera
  updateCamera();
  showMessage('Map loaded successfully!');
}

// Function to handle file selection and loading
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    console.warn('No file selected.');
    showMessage('No file selected.', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const json = JSON.parse(e.target.result);
      loadMapFromJSON(json);
      console.log('Map loaded successfully.');
    } catch (error) {
      console.error('Error parsing JSON:', error);
      showMessage('Error parsing JSON file.', true);
    }
  };
  reader.readAsText(file);
}

// Attach event listener to the file input element
const mapFileInput = document.getElementById('map-file-input');
mapFileInput.addEventListener('change', handleFileSelect, false);

// Function to draw the tilemap on the canvas
function drawTilemap() {
  const startCol = Math.floor(camera.x / tileSize);
  const endCol = Math.min(startCol + Math.ceil(camera.width / tileSize) + 1, mapWidth);
  const startRow = Math.floor(camera.y / tileSize);
  const endRow = Math.min(startRow + Math.ceil(camera.height / tileSize) + 1, mapHeight);

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      const tile = tilemap[y][x];
      switch (tile) {
        case 0:
          ctx.fillStyle = 'green'; // Grass
          break;
        case 1:
          ctx.fillStyle = 'gray'; // Road
          break;
        case 2:
          ctx.fillStyle = 'darkgray'; // Wall
          break;
        default:
          ctx.fillStyle = 'black'; // Unknown
      }
      ctx.fillRect(x * tileSize - camera.x, y * tileSize - camera.y, tileSize, tileSize);
    }
  }
}

// Function to draw start and finish lines
function drawLines() {
  // Draw Start Line
  ctx.save();
  startLine.forEach(([x, y]) => {
    ctx.fillStyle = 'blue'; // Start line color
    ctx.fillRect(x * tileSize - camera.x, y * tileSize - camera.y, tileSize, tileSize);
  });
  ctx.restore();

  // Draw Finish Line
  ctx.save();
  finishLine.forEach(([x, y]) => {
    ctx.fillStyle = 'red'; // Finish line color
    ctx.fillRect(x * tileSize - camera.x, y * tileSize - camera.y, tileSize, tileSize);
  });
  ctx.restore();
}

// Function to draw the car as a red rectangle with a black border
function drawCar() {
  ctx.save();
  // Translate to the car's position relative to the camera
  ctx.translate(carX - camera.x, carY - camera.y);
  // Rotate the canvas to the car's angle
  ctx.rotate(carAngle);
  // Draw the car rectangle
  ctx.fillStyle = 'red';
  ctx.fillRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight);
  // Draw the car border for better visibility
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight);
  ctx.restore();
}

// Function to update the car's position and handle movement logic
function updateCar() {
  const acceleration = 0.2;
  const maxSpeed = 5;
  const friction = 0.05;
  const rotationSpeed = 0.04;

  // Handle acceleration
  if (keys.ArrowUp) {
    carSpeed += acceleration;
  }
  if (keys.ArrowDown) {
    carSpeed -= acceleration;
  }

  // Handle rotation
  if (keys.ArrowLeft) {
    carAngle -= rotationSpeed;
  }
  if (keys.ArrowRight) {
    carAngle += rotationSpeed;
  }

  // Apply friction when not accelerating
  if (!keys.ArrowUp && !keys.ArrowDown) {
    if (carSpeed > 0) {
      carSpeed -= friction;
      if (carSpeed < 0) carSpeed = 0;
    } else if (carSpeed < 0) {
      carSpeed += friction;
      if (carSpeed > 0) carSpeed = 0;
    }
  }

  // Limit the car's speed
  carSpeed = Math.max(Math.min(carSpeed, maxSpeed), -maxSpeed / 2);

  // Calculate proposed new position
  const newCarX = carX + Math.sin(carAngle) * carSpeed;
  const newCarY = carY - Math.cos(carAngle) * carSpeed;

  // Determine the tile the car would be on
  const proposedTileX = Math.floor(newCarX / tileSize);
  const proposedTileY = Math.floor(newCarY / tileSize);

  // Check for collision with walls or grass
  if (tilemap[proposedTileY]?.[proposedTileX] !== 1) {
    // Collision detected, stop the car
    carSpeed = 0;
  } else {
    // No collision, update the car's position
    carX = newCarX;
    carY = newCarY;

    // Check for crossing start or finish lines
    checkLap();
  }

  // Update camera position to center on the car
  updateCamera();
}

// Function to update the camera's position based on the car's position
function updateCamera() {
  camera.x = Math.max(0, Math.min(carX - camera.width / 2, mapWidth * tileSize - camera.width));
  camera.y = Math.max(0, Math.min(carY - camera.height / 2, mapHeight * tileSize - camera.height));
}

// Function to check if the car has crossed start or finish lines
function checkLap() {
  const carTileX = Math.floor(carX / tileSize);
  const carTileY = Math.floor(carY / tileSize);

  // Check if car is on a start line tile
  const onStartLine = startLine.some(([x, y]) => x === carTileX && y === carTileY);
  // Check if car is on a finish line tile
  const onFinishLine = finishLine.some(([x, y]) => x === carTileX && y === carTileY);

  if (onStartLine && !hasStarted) {
    // Start the timer
    startTime = Date.now();
    hasStarted = true;
    showMessage('Lap Started!');
    console.log('Lap Started!');
  }

  if (onFinishLine && hasStarted && !hasFinished) {
    // Stop the timer
    finishTime = Date.now();
    lapTime = (finishTime - startTime) / 1000; // Time in seconds
    hasFinished = true;
    showMessage(`Lap Finished! Time: ${lapTime.toFixed(2)}s`);
    console.log(`Lap Finished! Time: ${lapTime.toFixed(2)}s`);
  }
}

// Optional: Function to display messages to the user
const messageDiv = document.getElementById('message');
function showMessage(msg, isError = false) {
  if (!messageDiv) return; // Exit if message div doesn't exist
  messageDiv.textContent = msg;
  messageDiv.style.color = isError ? 'red' : 'white';
  messageDiv.style.opacity = 1;
  // Fade out the message after 3 seconds
  setTimeout(() => {
    messageDiv.style.opacity = 0;
  }, 3000);
}

// Function to draw a crosshair at the center of the canvas (for debugging)
function drawCrosshair() {
  ctx.save();
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 1;
  // Draw horizontal line
  ctx.beginPath();
  ctx.moveTo(camera.width / 2 - 10, camera.height / 2);
  ctx.lineTo(camera.width / 2 + 10, camera.height / 2);
  ctx.stroke();
  // Draw vertical line
  ctx.beginPath();
  ctx.moveTo(camera.width / 2, camera.height / 2 - 10);
  ctx.lineTo(camera.width / 2, camera.height / 2 + 10);
  ctx.stroke();
  ctx.restore();
}

// Function to draw fixed reference points (optional)
function drawReferences() {
  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  // Draw a border around the canvas
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  // Draw a fixed point at (400,300)
  ctx.beginPath();
  ctx.arc(400, 300, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.restore();
}

// The main game loop
function gameLoop() {
  updateCar(); // Update game state
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  drawTilemap();    // Draw the background tilemap
  drawLines();      // Draw start and finish lines
  drawCar();        // Draw the car
  drawCrosshair();  // Draw crosshair at center (optional)
  drawReferences(); // Draw fixed references (optional)

  requestAnimationFrame(gameLoop); // Continue the loop
}

// Start the game loop
gameLoop();
