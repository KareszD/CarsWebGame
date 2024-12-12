// script.js

// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions (ensure these match your HTML)
canvas.width = 1000;
canvas.height = 800;

// Tilemap setup
const tileSize = 64; // Size of each tile in pixels

// Define the map as a 2D array
// 0: Grass (Impassable)
// 1: Road (Passable)
// 2: Wall (Impassable)
// 3: Start/Finish Line (Passable)
const predefinedMap = [
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] ,
  [ 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0 ] ,
  [ 0, 2, 1, 1, 1, 1, 1, 1, 1, 2, 0 ] ,
  [ 0, 2, 1, 1, 0, 0, 0, 0, 1, 2, 0 ] ,
  [ 0, 2, 1, 0, 2, 1, 1, 1, 1, 2, 0 ] ,
  [ 0, 2, 1, 2, 2, 1, 0, 0, 0, 2, 0 ] ,
  [ 0, 2, 1, 2, 2, 1, 1, 1, 1, 2, 0 ] ,
  [ 0, 2, 1, 1, 0, 0, 0, 0, 1, 2, 0 ] ,
  [ 0, 2, 1, 1, 1, 1, 1, 1, 1, 2, 0 ] ,
  [ 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0 ] ,
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] , 
];
const mapHeight = predefinedMap.length;           // Number of rows (vertically)
const mapWidth = predefinedMap[0].length; 
// Start/Finish Line (all tiles marked as 3)
const startFinishLine = [
  [4, 2], // [x, y]
  
];

// Load the predefined map into tilemap variable
let tilemap = predefinedMap;

// Car properties
const carWidth = 40;  // Width of the car rectangle
const carHeight = 60; // Height of the car rectangle
let carX = 5 * tileSize + tileSize / 2; // Start at center
let carY = 2 * tileSize + tileSize / 2;
let carSpeed = 0;    // Current speed of the car
let carAngle = -1.5708;    // Current rotation angle of the car (in radians)

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
let lapTime = null;
let hasCrossedStart = false;

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

// Function to draw the tilemap on the canvas
function drawTilemap() {
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
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
        case 3:
          ctx.fillStyle = 'blue'; // Start/Finish Line
          break;
        default:
          ctx.fillStyle = 'black'; // Unknown
      }
      ctx.fillRect(x * tileSize - camera.x, y * tileSize - camera.y, tileSize, tileSize);
    }
  }
}

// Function to draw the start/finish line
function drawStartFinishLine() {
  startFinishLine.forEach(([x, y]) => {
    ctx.fillStyle = 'yellow'; // Start/Finish Line color
    ctx.fillRect(x * tileSize - camera.x, y * tileSize - camera.y, tileSize, tileSize);
  });
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
  if (tilemap[proposedTileY]?.[proposedTileX] === 1 || tilemap[proposedTileY]?.[proposedTileX] === 3) {
    // No collision, update the car's position
    carX = newCarX;
    carY = newCarY;

    // Check for crossing the start/finish line
    checkLap(proposedTileX, proposedTileY);
  } else {
    // Collision detected, stop the car
    carSpeed = 0;
  }

  // Update camera position to center on the car
  updateCamera();
}

// Function to update the camera's position based on the car's position
function updateCamera() {
  camera.x = Math.max(0, Math.min(carX - camera.width / 2, mapWidth * tileSize - camera.width));
  camera.y = Math.max(0, Math.min(carY - camera.height / 2, mapHeight * tileSize - camera.height));
}

// Function to check if the car has crossed the start/finish line
function checkLap(x, y) {
  // Check if the current tile is part of the start/finish line
  const isOnLine = startFinishLine.some(([lineX, lineY]) => lineX === x && lineY === y);

  if (isOnLine) {
    if (!hasCrossedStart) {
      // Start the timer
      startTime = Date.now();
      hasCrossedStart = true;
      lapTime = null; // Reset previous lap time
      showMessage('Lap Started!');
      console.log('Lap Started!');
    } else if (lapTime === null) {
      // Finish the lap
      const finishTime = Date.now();
      lapTime = (finishTime - startTime) / 1000; // Time in seconds
      showMessage(`Lap Finished! Time: ${lapTime.toFixed(2)}s`);
      console.log(`Lap Finished! Time: ${lapTime.toFixed(2)}s`);
    }
  }
}

// Function to display messages to the user
const messageDiv = document.getElementById('message');
function showMessage(msg) {
  if (!messageDiv) return; // Exit if message div doesn't exist
  messageDiv.textContent = msg;
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

  drawTilemap();          // Draw the background tilemap
  drawStartFinishLine();  // Draw the start/finish line
  drawCar();              // Draw the car
  drawCrosshair();        // Draw crosshair at center (optional)
  drawReferences();       // Draw fixed references (optional)

  requestAnimationFrame(gameLoop); // Continue the loop
}

// Start the game loop
gameLoop();
