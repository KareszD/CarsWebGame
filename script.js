// script.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ensure the canvas has proper dimensions (redundant if set via HTML)
canvas.width = 800;
canvas.height = 600;

// Tilemap setup
const tileSize = 64;
const mapWidth = 50; // 50 tiles wide
const mapHeight = 50; // 50 tiles tall

// Car properties
const carWidth = 40; // Increased size for better visibility
const carHeight = 60; // Increased size for better visibility
let carX = 25 * tileSize + tileSize / 2; // Start on the road at column 25 (1600 + 32 = 1632)
let carY = 25 * tileSize + tileSize / 2; // Start on the road at row 25 (1600 + 32 = 1632)
let carSpeed = 0;
let carAngle = 0;

// Camera properties
const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height
};

// Initialize camera to center on the car
camera.x = carX - camera.width / 2;
camera.y = carY - camera.height / 2;

// Control flags
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

// Event listeners for key presses
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

// Add mobile controls
const addMobileControls = () => {
  // Prevent touch scrolling
  ['touchstart', 'touchend', 'touchmove'].forEach(event => {
    document.body.addEventListener(event, (e) => {
      e.preventDefault();
    }, { passive: false });
  });

  // Function to handle button events
  const handleButtonEvent = (buttonId, key, isTouch = false) => {
    const eventType = isTouch ? 'touchstart' : 'mousedown';
    const endEventType = isTouch ? 'touchend' : 'mouseup';

    document.getElementById(buttonId).addEventListener(eventType, () => {
      keys[key] = true;
    });

    document.getElementById(buttonId).addEventListener(endEventType, () => {
      keys[key] = false;
    });
  };

  // Assign events to buttons
  handleButtonEvent('up-button', 'ArrowUp', true);
  handleButtonEvent('down-button', 'ArrowDown', true);
  handleButtonEvent('left-button', 'ArrowLeft', true);
  handleButtonEvent('right-button', 'ArrowRight', true);
};

addMobileControls();

// 0 = Grass, 1 = Road
const tilemap = Array.from({ length: mapHeight }, (_, y) =>
  Array.from({ length: mapWidth }, (_, x) => (x === 25 || y === 25 ? 1 : 0))
);

// Function to draw the tilemap
function drawTilemap() {
  const startCol = Math.floor(camera.x / tileSize);
  const endCol = Math.min(startCol + Math.ceil(camera.width / tileSize) + 1, mapWidth);
  const startRow = Math.floor(camera.y / tileSize);
  const endRow = Math.min(startRow + Math.ceil(camera.height / tileSize) + 1, mapHeight);

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      const tile = tilemap[y][x];
      ctx.fillStyle = tile === 1 ? 'gray' : 'green';
      ctx.fillRect(x * tileSize - camera.x, y * tileSize - camera.y, tileSize, tileSize);
    }
  }
}

// Function to draw the car as a red rectangle with a black border
function drawCar() {
  ctx.save();
  // Translate to the car's position relative to the camera
  ctx.translate(carX - camera.x, carY - camera.y);
  // Rotate the context to the car's angle
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

// Function to update the car's position and handle movement
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

  // Apply friction
  if (!keys.ArrowUp && !keys.ArrowDown) {
    if (carSpeed > 0) {
      carSpeed -= friction;
      if (carSpeed < 0) carSpeed = 0;
    } else if (carSpeed < 0) {
      carSpeed += friction;
      if (carSpeed > 0) carSpeed = 0;
    }
  }

  // Limit speed
  carSpeed = Math.max(Math.min(carSpeed, maxSpeed), -maxSpeed / 2);

  // Update position
  carX += Math.sin(carAngle) * carSpeed;
  carY -= Math.cos(carAngle) * carSpeed;

  // Collision detection with tile boundaries
  const carTileX = Math.floor(carX / tileSize);
  const carTileY = Math.floor(carY / tileSize);
  if (tilemap[carTileY]?.[carTileX] === 0) {
    carSpeed = 0; // Stop the car if on grass
  }

  // Update camera position to center on the car
  camera.x = Math.max(0, Math.min(carX - camera.width / 2, mapWidth * tileSize - camera.width));
  camera.y = Math.max(0, Math.min(carY - camera.height / 2, mapHeight * tileSize - camera.height));

  // Debugging logs (optional)
  // console.log(`Car Position: (${carX.toFixed(2)}, ${carY.toFixed(2)})`);
  // console.log(`Camera Position: (${camera.x.toFixed(2)}, ${camera.y.toFixed(2)})`);
}

// Function to draw a simple crosshair at the center of the canvas (for debugging)
function drawCrosshair() {
  ctx.save();
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 1;
  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(camera.width / 2 - 10, camera.height / 2);
  ctx.lineTo(camera.width / 2 + 10, camera.height / 2);
  ctx.stroke();
  // Vertical line
  ctx.beginPath();
  ctx.moveTo(camera.width / 2, camera.height / 2 - 10);
  ctx.lineTo(camera.width / 2, camera.height / 2 + 10);
  ctx.stroke();
  ctx.restore();
}

// The main game loop
function gameLoop() {
  updateCar(); // Update game state first
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  drawTilemap(); // Draw the tilemap (background)
  drawCar();      // Draw the car
  drawCrosshair(); // Draw crosshair at center for reference

  requestAnimationFrame(gameLoop); // Continue the loop
}

// Start the game loop
gameLoop();
