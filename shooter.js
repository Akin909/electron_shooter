// var elWidth = require('./app.js').elWidth;
// var elHeight = require('./app.js').elHeight;

// console.log(elWidth);


var startBtn = document.querySelector('.start');
startBtn.addEventListener('click', start);
var stopBtn = document.querySelector('.stop')
stopBtn.addEventListener('click', stop)
window.addEventListener('keydown', function(event) {
	// This line prevents the default action of the Space and arrow keys	
	if ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
		event.preventDefault();
	}
}, false);

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d')
var playerBullets = [];
var enemies = []
var score = 0;
var winLimit = 15;
var frameID;
var running = false,
	started = false;
var currentStatus ='';

//This var is a modifier that changes game object velocity based on actual time
//passing
var delta = 0;

function initialize() {
	running ? stop() : start();
}
canvas.addEventListener('click', initialize);

document.querySelector('.reset').onclick = function() {
	location.reload();
}

const canvas_width = 800;//elWidth
const canvas_height = 500;//elHeight
canvas.width = canvas_width;
canvas.height = canvas_height;


var fire = new Audio('blaster.mp3');
var explosion = new Audio('Explosion.mp3');


var playerImage = new Image();
playerImage.src = 'ship.png'
var enemyImage = new Image();
enemyImage.src = 'enemies.png';
// player.addEventListener('load',loadImage,false)
//https://chrismalnu.files.wordpress.com/2016/02/clash.png?w=680
/*Player object with all the relevant attributes with a method with access to
these*/
var player = {
	x: canvas_width / 2,
	y: canvas_height / 2 + 200,
	width: playerImage.naturalWidth,
	height: playerImage.naturalHeight,
	active: true,
	draw: function() {
		if (this.active) {
			ctx.drawImage(playerImage, this.x, this.y)
		}
	}
}

var keyStatus = {
	left: false,
	right: false,
	down: false,
	up: false,
	spacebar: false
}
document.addEventListener('keydown', (event) => {
	if (event.keyCode === 37) {
		keyStatus.left = true
	} else if (event.keyCode === 39) {
		keyStatus.right = true
	} else if (event.keyCode === 38) {
		keyStatus.up = true
	} else if (event.keyCode === 40) {
		keyStatus.down = true
	} else if (event.keyCode === 32) {
		keyStatus.spacebar = true

	}

});

document.addEventListener('keyup', function(event) {
	for (var status in keyStatus) {
		if (keyStatus.hasOwnProperty(status)) {
			keyStatus[status] = false
		}
	}
});

window.onload = () => {
	ctx.font = '45px VT323';
	ctx.fillStyle = 'green';
	ctx.fillText('Click to Start', (canvas_width - 250) / 2, canvas_height / 2);
}

function Particle() {
	this.scale = 1;
	this.x = 0;
	this.y = 0;
	this.radius = 20;
	this.color = '#000'
	this.velocityX = 0;
	this.velocityY = 0;
	this.scaleSpeed = 0.5;

	this.update = function(ms, delta) {
		//Shrinking	
		this.scale -= this.scaleSpeed * ms / 1000.0

		if (this.scale <= 0) {
			this.scale = 0;
		}
		//Moving away from the explosion center
		this.x += this.velocityX * ms / 1000.0 //  * delta;
		this.y += this.velocityY * ms / 1000.0 // * delta;

		this.draw = function() {
			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.scale(this.scale, this.scale)

			//Drawing a filled circle in the particle's local scope
			ctx.beginPath();
			ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fillStyle = this.color;
			ctx.fill();

			ctx.restore();
		}
	}
}

var particles = [];
/* Creates explosion, all particles move and shrink at the same speed */
function createExplosion(x, y, color) {
	var minSize = 10;
	var maxSize = 30;
	var count = 20;
	var minSpeed = 60.0;
	var maxSpeed = 200.0;
	var minScaleSpeed = 1.0;
	var maxScaleSpeed = 4.0;
	//Creating 4 particles that scatter at 0,90,180,270 degrees, changed to
	//scatter in many more directions with 360/count	
	for (var angle = 0; angle < 360; angle += Math.round(360 / count)) {
		var particle = new Particle();
		//Particle will start at the explosion center
		particle.x = x;
		particle.y = y;

		particle.radius = randomFloat(minSize, maxSize)
		particle.color = color;

		particle.scaleSpeed = randomFloat(minScaleSpeed, maxScaleSpeed) // * delta;
		var speed = randomFloat(minSpeed, maxSpeed);

		//velocity is rotated by 'angle'
		particle.velocityX = speed * Math.cos(angle * Math.PI / 180.0) // * delta;
		particle.velocityY = speed * Math.sin(angle * Math.PI / 180.0) // * delta;

		//Add newly created particle to 'particles' array
		particles.push(particle);
	}
}

function randomFloat(min, max) {
	return min + Math.random() * (max - min);
}

function generateExplosion(delta) {
	for (var i = 0, len = particles.length; i < len; i++) {
		let particle = particles[i];
		particle.update(20, delta);
		particle.draw()
	}
}



function update(delta) {
	//Adding array length stops player from shooting endlessly
	if (keyStatus.spacebar && playerBullets.length < 7) {
		player.shoot();
	}
	//Conditionals stops player from moving of the canvas
	if (keyStatus.right && player.x + player.width <= canvas_width) {
		player.x += 0.8 * delta;
	}
	if (keyStatus.left && player.x >= 0) {
		player.x -= 0.8 * delta;
	}
	if (keyStatus.up && player.y >= 0) {
		player.y -= 0.8 * delta;
	}
	if (keyStatus.down && player.y + player.height <= canvas_height) {
		player.y += 0.8 * delta;
	}
	
	
	
playerBullets.forEach(function(bullet) {
		bullet.update(delta);
	})
	playerBullets = playerBullets.filter(function(bullet) {
		return bullet.active;
	});
	enemies.forEach((enemy) => {
			enemy.update(delta);
		})
		/*This random number generator controls the rate at which new enemy ships are
			drawn I've also added a limit of 5*/
	enemies = enemies.filter(enemy => enemy.active)
	if (Math.random() < 0.03 && enemies.length <= 5) {
		enemies.push(Enemy());
	}
	handleCollisions();
}

function reset() {
	canvas.removeEventListener('click', initialize);
	// 	ctx.clearRect(0, 0, canvas_width, canvas_height)
	if (score >= winLimit && running) {
		cancelAnimationFrame(frameID);
		running = false;
		started = false;
		// ctx.font = '40px VT323'
		// ctx.fillText('You Win!!', (canvas_width / 2) - 50, canvas_height / 2)
		currentStatus = 'You Win!'
	}
	if (!player.active) {
		running = false;
		started = false;
		// ctx.font = '50px VT323';
		// ctx.fillStyle = 'Green';
		// ctx.fillText('Game Over!', (canvas_width - 180) / 2, canvas_height / 2);
		currentStatus = 'Game Over!'
		cancelAnimationFrame(frameID);
	}
}

function draw() {
	// 	cancelAnimationFrame(frameID);
	running = true;
	ctx.clearRect(0, 0, canvas_width, canvas_height);
	player.draw();
	playerBullets.forEach(function(bullet) {
		bullet.draw();
	});
	enemies.forEach((enemy) => enemy.draw());
	generateExplosion();
	ctx.font = '40px VT323';
	ctx.fillStyle = 'green'
	ctx.fillText(`Score: ${score}`, 5, 30);
	ctx.fillText(currentStatus,(canvas_width - 180) / 2, canvas_height / 2);
	fpsDisplay.textContent = Math.round(fps) + ' FPS'; // display the FPS
	if (score >= winLimit) {
		//Resets the game if score is greater than a preset win limit
		reset();

		//If player is hit becomes inactive and game stops and message is printed
	} else if (!player.active) {
		reset();
	}
}

function Bullet(I) {
	I.active = true;
	I.xVelocity = 0;
	I.yVelocity = -I.speed;
	I.height = 5;
	I.width = 3;
	fire.currentTime = 0;
	I.color = '#FF0000';

	I.inBounds = function() {
		return I.x >= 0 && I.x <= canvas_width && I.y > 0 && I.y <= canvas_height;
	}
	I.draw = function() {
		ctx.fillStyle = this.color
		ctx.fillRect(this.x, this.y, this.width, this.height)
	}
	I.update = (delta) => {
		I.x += I.xVelocity * delta
		I.y += I.yVelocity * delta

		I.active = I.active && I.inBounds();
	}
	return I
}

player.shoot = function() {
	fire.currentTime = 0;
	fire.play();
	var bulletPosition = this.midpoint();

	playerBullets.push(Bullet({
		speed: 0.8,
		x: bulletPosition.x,
		y: bulletPosition.y,

	}));
};
player.midpoint = function() {
	return {
		//Uses the x position plus half of the width to generate bullets at middle of
		//the ship and just its y position to ensure comes out of the right point
		x: this.x + this.width / 2,
		y: this.y
	};
};

function Enemy(I) {
	I = I || {};

	I.active = true;
	I.age = Math.floor(Math.random() * 128)

	// 	I.color = '#A2B';
	I.x = canvas_width / 4 + Math.random() * canvas_width / 2;
	I.y = 0;
	I.xVelocity = 0;
	I.yVelocity = 0.4;
	//Using naturalWidth native methods gives me the image loaded in's width and
	//height instead of using static values
	I.width = enemyImage.naturalWidth;
	I.height = enemyImage.naturalHeight;

	I.inBounds = function() {
		return I.x >= 0 && I.x <= canvas_width &&
			I.y >= 0 && I.y <= canvas_height;
	};

	I.draw = function() {
		ctx.drawImage(enemyImage, I.x, I.y)
			// ctx.fillStyle = this.color;
			// ctx.fillRect(this.x, this.y, this.width, this.height);
	};

	I.update = function(delta) {
		I.x += I.xVelocity * delta;
		I.y += I.yVelocity * delta;

		I.xVelocity = 0.3 * Math.sin(I.age * Math.PI / 64);

		I.age++;
		I.explode = function() {
			if (this) {
				explosion.currentTime = 0;
				explosion.play();
				createExplosion(this.x, this.y, '#525252');
				createExplosion(this.x, this.y, '#FFA318');
				this.active = false;
			} else if (!this) {
				return;
			}
		}
		I.active = I.active && I.inBounds();
	};

	return I;
}


function collides(a, b) {
	return a.x < b.x + b.width &&
		a.x + a.width > b.x && a.y < b.y +
		b.height && a.y + a.height > b.y;
}

function handleCollisions() {
	playerBullets.forEach(function(bullet) {
		enemies.forEach(function(enemy) {
			if (enemy && bullet && collides(bullet, enemy)) {
				enemy.explode();
				bullet.active = false;
				if (player.active && running) {
					score += 1
				}
			}
		})
	});
	enemies.forEach((enemy) => {
		if (enemy && player.active && collides(enemy, player)) {
			enemy.explode();
			player.explode();
		}
	})
}

player.explode = function() {
	//Add conditional to prevent undefined error
	if (this && this.active) {
		createExplosion(this.x, this.y, '#525252');
		createExplosion(this.x, this.y, '#FFA318');
		this.active = false;
	} else if (!this) {
		return;
	}
}


var fps = 60,
	framesThisSecond = 0,
	lastFPSUpdate = 0;

var lastFrameTimeMs = 0, // The last time the loop was run
	maxFPS = 60; // The maximum FPS we want to allow
var timestep = 1000 / 60;

function runGame(timeStamp) {
	//Throttle the framerate
	if (timeStamp < lastFrameTimeMs + (1000 / maxFPS)) {
		frameID = requestAnimationFrame(runGame);
		return;
	}
	if (timeStamp > lastFPSUpdate + 1000) { //Update every second
		fps = 0.25 * framesThisSecond + (1 - 0.25) * fps; //compute the new FPS	
		lastFPSUpdate = timeStamp;
		framesThisSecond = 0;
	}
	framesThisSecond++
	delta += timeStamp - lastFrameTimeMs;
	lastFrameTimeMs = timeStamp

	//Simulate the total elapsed time in fixed-size chunks
	while (delta >= timestep) {
		//Time step value is reduced further to slow movement of game objects
		update(timestep / 3.5);
		delta -= timestep;
	}
	draw();
	frameID = requestAnimationFrame(runGame);
}

var fpsDisplay = document.getElementById('fpsDisplay');


function stop() {
	if (running) {
		ctx.font = '50px VT323';
		ctx.fillStyle = 'Green';
		ctx.fillText(currentStatus, (canvas_width - 100) / 2, canvas_height / 2)
		running = false;
		started = false;
		cancelAnimationFrame(frameID);
	}
}

function start() {
	if (!started) { //don't request multiple frames
		started = true;
		//Dummy frame to get our timestamps and initial drawing right.
		//Track the frame ID so we can cancel it if we stop quickly.
		frameID = requestAnimationFrame(function(timeStamp) {
			draw(1); //initial draw	
			running = true;
			//reset some time tracking variables
			lastFrameTimeMs = timeStamp;
			//start the main loop
			frameID = requestAnimationFrame(runGame);
		})
	}
}
