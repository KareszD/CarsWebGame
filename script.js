// script.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Car properties
const carWidth = 20;
const carHeight = 30;
let carX = canvas.width / 2 - carWidth / 2;
let carY = canvas.height - carHeight - 10;
let carSpeed = 0;
let carAngle = 0;

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

// Load car image (optional)
// Alternatively, you can draw a simple rectangle to represent the car
const carImage = new Image();
carImage.src = 'https://media.istockphoto.com/id/1138785358/photo/generic-red-car-top-angle.jpg?s=612x612&w=0&k=20&c=0vuZ57H_Rl4ddgYz0uiv4_f0g2uzEcl2oNSA1s7Vdf0='; // Sample car image URL

// Draw the car
function drawCar() {
  ctx.save();
  ctx.translate(carX + carWidth / 2, carY + carHeight / 2);
  ctx.rotate(carAngle);
  ctx.drawImage(carImage, -carWidth / 2, -carHeight / 2, carWidth, carHeight);
  ctx.restore();

  // If you prefer a simple rectangle instead of an image, comment out the above and uncomment below:
  /*
  ctx.save();
  ctx.translate(carX + carWidth / 2, carY + carHeight / 2);
  ctx.rotate(carAngle);
  ctx.fillStyle = 'red';
  ctx.fillRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight);
  ctx.restore();
  */
}

// Draw the track (simple borders)
function drawTrack() {
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(70, 70, canvas.width - 140, canvas.height - 140);
}

// Update car position based on controls
function updateCar() {
  const acceleration = 0.02;
  const maxSpeed = 3;
  const friction = 0.01;
  const rotationSpeed = 0.02;

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
  if (carSpeed > maxSpeed) carSpeed = maxSpeed;
  if (carSpeed < -maxSpeed / 2) carSpeed = -maxSpeed / 2;

  // Update position
  carX += Math.sin(carAngle) * carSpeed;
  carY -= Math.cos(carAngle) * carSpeed;

  // Collision with track boundaries
  if (carX < 70) carX = 70;
  if (carY < 70) carY = 70;
  if (carX + carWidth > canvas.width - 70) carX = canvas.width - 70 - carWidth;
  if (carY + carHeight > canvas.height - 70) carY = canvas.height - 70 - carHeight;
}

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawTrack();
  updateCar();
  drawCar();

  requestAnimationFrame(gameLoop);
}

// Start the game after the car image loads
carImage.onload = () => {
  gameLoop();
};
