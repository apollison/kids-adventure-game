// Game Configuration
const CONFIG = {
  gravity: 0.6,
  jumpStrength: -12,
  moveSpeed: 5,
  playerSize: 40,
  platformHeight: 20,
  flowerSize: 30,
  cloudSize: 60,
  obstacleSize: 35
};

// Game State
const game = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  level: 1,
  score: 0,
  targetScore: 10,
  timeLeft: 60,
  gameActive: false,
  selectedColor: 'purple',
  player: null,
  platforms: [],
  flowers: [],
  clouds: [],
  obstacles: [],
  particles: [],
  keys: {},
  timer: null,
  touchActive: false,
  touchStartX: 0,
  lastTouchX: 0,
  isDragging: false
};

// Player class
class Player {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.width = CONFIG.playerSize;
    this.height = CONFIG.playerSize;
    this.velocityX = 0;
    this.velocityY = 0;
    this.color = color;
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
  }

  update() {
    // Touch/drag controls
    if (game.isDragging && game.touchActive) {
      const dragDeltaX = game.lastTouchX - game.touchStartX;
      
      if (Math.abs(dragDeltaX) > 5) {
        if (dragDeltaX < 0) {
          this.velocityX = -CONFIG.moveSpeed;
          this.facing = -1;
        } else {
          this.velocityX = CONFIG.moveSpeed;
          this.facing = 1;
        }
      }
    } 
    // Keyboard controls
    else if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
      this.velocityX = -CONFIG.moveSpeed;
      this.facing = -1;
    } else if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
      this.velocityX = CONFIG.moveSpeed;
      this.facing = 1;
    } else {
      this.velocityX *= 0.8; // Friction
    }

    // Jumping
    if ((game.keys[' '] || game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) && this.onGround) {
      this.velocityY = CONFIG.jumpStrength;
      this.onGround = false;
    }

    // Apply gravity
    this.velocityY += CONFIG.gravity;

    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Collision with ground
    if (this.y + this.height >= game.height - 50) {
      this.y = game.height - 50 - this.height;
      this.velocityY = 0;
      this.onGround = true;
    }

    // Platform collision
    this.onGround = false;
    game.platforms.forEach(platform => {
      if (this.collidesWith(platform) && this.velocityY > 0) {
        if (this.y + this.height - this.velocityY <= platform.y) {
          this.y = platform.y - this.height;
          this.velocityY = 0;
          this.onGround = true;
        }
      }
    });

    // Keep player on screen
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > game.width) this.x = game.width - this.width;
  }

  collidesWith(obj) {
    return this.x < obj.x + obj.width &&
           this.x + this.width > obj.x &&
           this.y < obj.y + obj.height &&
           this.y + this.height > obj.y;
  }

  draw(ctx) {
    // Draw butterfly
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    if (this.facing === -1) ctx.scale(-1, 1);

    // Body
    ctx.fillStyle = '#333';
    ctx.fillRect(-3, -15, 6, 30);

    // Wings
    const wingColors = {
      purple: ['#9b59b6', '#8e44ad'],
      pink: ['#e91e63', '#c2185b'],
      blue: ['#3498db', '#2980b9'],
      rainbow: ['#ff0080', '#00ff80']
    };

    const colors = wingColors[this.color];
    
    // Left wing
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.ellipse(-10, -5, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right wing  
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.ellipse(10, -5, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-5, -25);
    ctx.moveTo(0, -15);
    ctx.lineTo(5, -25);
    ctx.stroke();

    ctx.restore();
  }
}

// Platform class
class Platform {
  constructor(x, y, width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = CONFIG.platformHeight;
  }

  draw(ctx) {
    // Grass platform
    ctx.fillStyle = '#8BC34A';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Dirt
    ctx.fillStyle = '#795548';
    ctx.fillRect(this.x, this.y + this.height, this.width, 5);
    
    // Grass blades
    ctx.fillStyle = '#689F38';
    for (let i = 0; i < this.width; i += 10) {
      ctx.fillRect(this.x + i, this.y - 5, 3, 5);
    }
  }
}

// Flower class
class Flower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = CONFIG.flowerSize;
    this.collected = false;
    this.rotation = Math.random() * Math.PI * 2;
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  draw(ctx) {
    if (this.collected) return;

    const bobAmount = Math.sin(Date.now() / 500 + this.bobOffset) * 3;

    ctx.save();
    ctx.translate(this.x, this.y + bobAmount);
    ctx.rotate(this.rotation);

    // Stem
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, this.size / 2);
    ctx.stroke();

    // Petals
    const petalColors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#00CED1'];
    const petalColor = petalColors[Math.floor(this.x / 100) % petalColors.length];
    
    ctx.fillStyle = petalColor;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 / 5) * i);
      ctx.beginPath();
      ctx.ellipse(0, -8, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Center
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Cloud class
class Cloud {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = CONFIG.cloudSize + Math.random() * 20;
  }

  update() {
    this.x += this.speed;
    if (this.x > game.width + this.size) {
      this.x = -this.size;
    }
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.arc(this.x + this.size / 2, this.y, this.size / 2.5, 0, Math.PI * 2);
    ctx.arc(this.x + this.size, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Obstacle class (bees)
class Obstacle {
  constructor(x, y, patrolStart, patrolEnd) {
    this.x = x;
    this.y = y;
    this.size = CONFIG.obstacleSize;
    this.patrolStart = patrolStart;
    this.patrolEnd = patrolEnd;
    this.speed = 2;
    this.direction = 1;
  }

  update() {
    this.x += this.speed * this.direction;
    
    if (this.x > this.patrolEnd || this.x < this.patrolStart) {
      this.direction *= -1;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Body
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-10, -10, 20, 15);

    // Stripes
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, -10, 3, 15);
    ctx.fillRect(2, -10, 3, 15);

    // Wings
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-5, -8, 8, 12, -0.3, 0, Math.PI * 2);
    ctx.ellipse(5, -8, 8, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -5, 2, 0, Math.PI * 2);
    ctx.arc(5, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Particle class
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8 - 2;
    this.life = 1;
    this.color = color;
    this.size = Math.random() * 6 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.life -= 0.02;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Initialize game
function init() {
  game.canvas = document.getElementById('game-canvas');
  game.ctx = game.canvas.getContext('2d');
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Setup event listeners
  setupEventListeners();
}

function resizeCanvas() {
  game.canvas.width = window.innerWidth;
  game.canvas.height = window.innerHeight - 140; // Account for HUD and controls
  game.width = game.canvas.width;
  game.height = game.canvas.height;
}

function setupEventListeners() {
  // Character selection
  document.querySelectorAll('.character-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.character-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      game.selectedColor = btn.dataset.color;
    });
  });

  // Start game
  document.getElementById('start-btn').addEventListener('click', startGame);
  
  // Next level
  document.getElementById('next-level-btn').addEventListener('click', () => {
    game.level++;
    startGame();
  });

  // Restart
  document.getElementById('restart-btn').addEventListener('click', () => {
    game.level = 1;
    startGame();
  });

  // Retry
  document.getElementById('retry-btn').addEventListener('click', startGame);

  // Menu
  document.getElementById('menu-btn').addEventListener('click', () => {
    showScreen('start');
    game.level = 1;
  });

  // Keyboard controls
  window.addEventListener('keydown', e => {
    game.keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
  });

  window.addEventListener('keyup', e => {
    game.keys[e.key] = false;
  });

  // Touch controls on canvas
  game.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  game.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  game.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

  // Select first character by default
  document.querySelector('.character-btn').click();
}

function handleTouchStart(e) {
  e.preventDefault();
  if (!game.gameActive || !game.player) return;

  const touch = e.touches[0];
  const rect = game.canvas.getBoundingClientRect();
  const scaleX = game.canvas.width / rect.width;
  const scaleY = game.canvas.height / rect.height;
  const touchX = (touch.clientX - rect.left) * scaleX;
  const touchY = (touch.clientY - rect.top) * scaleY;

  // Check if touching the butterfly
  const hitRadius = 80;
  const dx = touchX - (game.player.x + game.player.width / 2);
  const dy = touchY - (game.player.y + game.player.height / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < hitRadius) {
    // Dragging butterfly
    game.isDragging = true;
    game.touchActive = true;
    game.touchStartX = touchX;
    game.lastTouchX = touchX;
  } else {
    // Tap anywhere else = jump
    if (game.player.onGround) {
      game.player.velocityY = CONFIG.jumpStrength;
      game.player.onGround = false;
    }
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!game.gameActive || !game.isDragging) return;

  const touch = e.touches[0];
  const rect = game.canvas.getBoundingClientRect();
  const scaleX = game.canvas.width / rect.width;
  game.lastTouchX = (touch.clientX - rect.left) * scaleX;
}

function handleTouchEnd(e) {
  e.preventDefault();
  game.isDragging = false;
  game.touchActive = false;
}

function startGame() {
  game.score = 0;
  game.targetScore = 10 + (game.level - 1) * 5;
  game.timeLeft = 60 - (game.level - 1) * 5;
  if (game.timeLeft < 30) game.timeLeft = 30;
  
  game.gameActive = true;

  // Create player
  game.player = new Player(100, game.height - 200, game.selectedColor);

  // Generate level
  generateLevel();

  // Start timer
  if (game.timer) clearInterval(game.timer);
  game.timer = setInterval(() => {
    game.timeLeft--;
    updateHUD();
    if (game.timeLeft <= 0) {
      gameOver();
    }
  }, 1000);

  showScreen('game');
  updateHUD();
  gameLoop();
}

function generateLevel() {
  game.platforms = [];
  game.flowers = [];
  game.clouds = [];
  game.obstacles = [];
  game.particles = [];

  // Ground platform
  game.platforms.push(new Platform(0, game.height - 50, game.width));

  // Generate platforms
  const platformCount = 5 + game.level * 2;
  for (let i = 0; i < platformCount; i++) {
    const x = (i + 1) * (game.width / (platformCount + 1));
    const y = game.height - 150 - Math.random() * (game.height - 300);
    const width = 80 + Math.random() * 100;
    game.platforms.push(new Platform(x - width / 2, y, width));
  }

  // Generate flowers
  game.platforms.forEach(platform => {
    if (Math.random() > 0.3) {
      const flowerX = platform.x + Math.random() * (platform.width - 30);
      const flowerY = platform.y - 25;
      game.flowers.push(new Flower(flowerX, flowerY));
    }
  });

  // Ensure we have enough flowers
  while (game.flowers.length < game.targetScore) {
    const platform = game.platforms[Math.floor(Math.random() * game.platforms.length)];
    const flowerX = platform.x + Math.random() * (platform.width - 30);
    const flowerY = platform.y - 25;
    game.flowers.push(new Flower(flowerX, flowerY));
  }

  // Generate clouds
  for (let i = 0; i < 5; i++) {
    game.clouds.push(new Cloud(
      Math.random() * game.width,
      50 + Math.random() * 100,
      0.2 + Math.random() * 0.5
    ));
  }

  // Generate obstacles (bees) - more on higher levels
  const obstacleCount = Math.min(game.level - 1, 5);
  for (let i = 0; i < obstacleCount; i++) {
    const platform = game.platforms[Math.floor(Math.random() * game.platforms.length)];
    game.obstacles.push(new Obstacle(
      platform.x,
      platform.y - 60,
      platform.x - 50,
      platform.x + platform.width + 50
    ));
  }
}

function gameLoop() {
  if (!game.gameActive) return;

  // Clear canvas
  game.ctx.clearRect(0, 0, game.width, game.height);

  // Draw sky gradient
  const gradient = game.ctx.createLinearGradient(0, 0, 0, game.height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#E0F6FF');
  game.ctx.fillStyle = gradient;
  game.ctx.fillRect(0, 0, game.width, game.height);

  // Update and draw clouds
  game.clouds.forEach(cloud => {
    cloud.update();
    cloud.draw(game.ctx);
  });

  // Update and draw platforms
  game.platforms.forEach(platform => platform.draw(game.ctx));

  // Update and draw flowers
  game.flowers.forEach(flower => flower.draw(game.ctx));

  // Update and draw obstacles
  game.obstacles.forEach(obstacle => {
    obstacle.update();
    obstacle.draw(game.ctx);

    // Check collision with player
    if (game.player.collidesWith(obstacle)) {
      hitObstacle();
    }
  });

  // Update and draw player
  game.player.update();
  game.player.draw(game.ctx);

  // Check flower collection
  game.flowers.forEach(flower => {
    if (!flower.collected && game.player.collidesWith(flower)) {
      flower.collected = true;
      game.score++;
      updateHUD();
      createParticles(flower.x, flower.y, '#FFD700');

      if (game.score >= game.targetScore) {
        levelComplete();
      }
    }
  });

  // Update and draw particles
  game.particles = game.particles.filter(particle => {
    particle.update();
    particle.draw(game.ctx);
    return particle.life > 0;
  });

  requestAnimationFrame(gameLoop);
}

function createParticles(x, y, color) {
  for (let i = 0; i < 15; i++) {
    game.particles.push(new Particle(x, y, color));
  }
}

function hitObstacle() {
  game.timeLeft = Math.max(0, game.timeLeft - 5);
  updateHUD();
  
  // Flash effect
  game.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  game.ctx.fillRect(0, 0, game.width, game.height);

  // Respawn player
  game.player.x = 100;
  game.player.y = game.height - 200;
  game.player.velocityX = 0;
  game.player.velocityY = 0;
}

function levelComplete() {
  game.gameActive = false;
  clearInterval(game.timer);

  const stats = document.getElementById('win-stats');
  stats.innerHTML = `
    <p>🌟 Level ${game.level} Complete! 🌟</p>
    <p>🌸 Flowers Collected: ${game.score}</p>
    <p>⏱️ Time Remaining: ${game.timeLeft}s</p>
    <p>✨ Bonus Points: ${game.timeLeft * 10}</p>
  `;

  showScreen('win');
}

function gameOver() {
  game.gameActive = false;
  clearInterval(game.timer);

  const stats = document.getElementById('gameover-stats');
  stats.innerHTML = `
    <p>Level Reached: ${game.level}</p>
    <p>Flowers Collected: ${game.score} / ${game.targetScore}</p>
    <p>Keep trying! You can do it! 💪</p>
  `;

  showScreen('gameover');
}

function updateHUD() {
  document.getElementById('level-display').textContent = game.level;
  document.getElementById('score-display').textContent = game.score;
  document.getElementById('target-score').textContent = game.targetScore;
  document.getElementById('timer-display').textContent = game.timeLeft;
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  document.getElementById(`${screenId}-screen`).classList.remove('hidden');
}

// Start the game when page loads
window.addEventListener('load', init);
