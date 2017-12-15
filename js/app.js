var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 100;
document.body.appendChild(canvas);

// The main game loop
var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
}

function init() {
    terrainPattern = ctx.createPattern(resources.get('img/space_background.jpg'), 'repeat-x');

    document.getElementById('space-background').style.display = 'block';
    document.getElementById('game-start').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    document.getElementById('play').addEventListener('click', function() {
        document.getElementById('wrapper').style.display = 'flex';
        document.getElementById('space-background').style.display = 'none';
        document.getElementById('game-start').style.display = 'none';
        document.getElementById('game-over-overlay').style.display = 'none';
        backgroundSound.play();
        lastTime = Date.now();
        main();
    });
    document.getElementById('play-again').addEventListener('click', function() {
        reset();
    });


}

resources.load([
    'img/space_background.jpg',
    'img/sprites_new.png'
]);
resources.onReady(init);

// Game state
var player = {
    pos: [0, 0],
    sprite: new Sprite('img/sprites_new.png', [0, 0], [190, 114], 12, [0, 1])
};

var bullets = [];
var meteorites = [];
var ufos = [];
var explosions = [];

var lastFire = Date.now();
var gameTime = 0;
var isGameOver;
var random  = Math.random() * 1000;
var changeDirection = true;
var terrainPattern;
var counter = 1;

var bgSoundControlFlag = true;
var mySound = new Sound("music/sound-explosion.mp3");
var backgroundSound = new Sound("music/muzyka-kosmosa-muzyka-kosmosa.mp3");
document.getElementById('volume-control').addEventListener('click', function () {
    if (bgSoundControlFlag) {
        backgroundSound.stop();
        document.getElementById('volume-control').style.color = "#757575";
        bgSoundControlFlag = false;
    }
    else {
        backgroundSound.play();
        document.getElementById('volume-control').style.color = "white";
        bgSoundControlFlag = true;
    }
});

var currentScore = 0;
var bestScore = 0;
var bestScoreEl = document.getElementById('best-score');
var scoreEl = document.getElementById('current-score');

// Speed in pixels per second
var playerSpeed = 200;
var bulletSpeed = 500;
var enemySpeed = 150;
var ufoSpeed = 150;

// Update game objects
function update(dt) {
    gameTime += dt;
    handleInput(dt);
    updateEntities(dt);

    if(Math.random() < dt) {
        meteorites.push({
            pos: [canvas.width,
                  Math.random() * (canvas.height - 100)],
            sprite: new Sprite('img/sprites_new.png', [0, 214], [155, 100],
                               6, [0])
        });
        //console.log(counter);
        if (gameTime >= counter*20 && gameTime <= counter*20 + 20) {
            if (gameTime >= counter*20 && gameTime < (counter*20 + 5) ){
                document.getElementById('attention-ufos').style.display = 'block';
                document.getElementById('attention-ufos').innerHTML = 'Attention! UFOs!';
            }
            else {
                document.getElementById('attention-ufos').style.display = 'none';
            }
            ufos.push({
                pos: [canvas.width,
                    Math.random() * (canvas.height - 110)],
                sprite: new Sprite('img/sprites_new.png', [0, 475], [110, 110],
                    6, [0,1])
            });
        }
        if ((gameTime > (counter*20 + 20))) {
            counter += 2;
        }
    }

    checkCollisions(meteorites);
    checkCollisions(ufos);
    bestScoreEl.innerHTML = bestScore;
    scoreEl.innerHTML = currentScore;
}

function handleInput(dt) {
    if(input.isDown('DOWN') || input.isDown('s')) {
        player.pos[1] += playerSpeed * dt;
    }

    if(input.isDown('UP') || input.isDown('w')) {
        player.pos[1] -= playerSpeed * dt;
    }

    if(input.isDown('LEFT') || input.isDown('a')) {
        player.pos[0] -= playerSpeed * dt;
    }

    if(input.isDown('RIGHT') || input.isDown('d')) {
        player.pos[0] += playerSpeed * dt;
    }

    if(input.isDown('SPACE') &&
       !isGameOver &&
       Date.now() - lastFire > 400) {
        var x = player.pos[0] + player.sprite.size[0]*0.95;
        var y = player.pos[1] + player.sprite.size[1]/2.2;

        bullets.push({ pos: [x, y],
                       sprite: new Sprite('img/sprites_new.png', [0, 432], [61, 17]) });
        lastFire = Date.now();
    }
}

function updateEntities(dt) {
    // Update the player sprite animation
    player.sprite.update(dt);

    // Update all the bullets
    for( i=0; i<bullets.length; i++) {
        var bullet = bullets[i];

        bullet.pos[0] += bulletSpeed * dt;

        // Remove the bullet if it goes offscreen
        if(bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
           bullet.pos[0] > canvas.width) {
            bullets.splice(i, 1);
            i--;
        }
    }

    // Update all the meteorites
    for(var i=0; i<meteorites.length; i++) {
        meteorites[i].pos[0] -= enemySpeed * dt;
        meteorites[i].sprite.update(dt);

        // Remove if offscreen
        if(meteorites[i].pos[0] + meteorites[i].sprite.size[0] < 0) {
            meteorites.splice(i, 1);
            i--;
        }
    }
    for(var i=0; i<ufos.length; i++) {
        if (changeDirection) {
            random--;
            ufos[i].pos[1] -= ufoSpeed * dt;
            ufos[i].pos[0] -= ufoSpeed * dt;
            if (random < 0) {
                changeDirection = false;
                random = Math.random() * 1000;
            }
        } else {
            random--;
            ufos[i].pos[1] += ufoSpeed * dt;
            ufos[i].pos[0] -= ufoSpeed * dt;
            if (random < 0) {
                changeDirection = true;
                random = Math.random() * 1000;
            }
        }

        // Remove if offscreen
        if(ufos[i].pos[0] + ufos[i].sprite.size[0] < 0) {
            ufos.splice(i, 1);
            i--;
        }
    }

    // Update all the explosions
    for(var i=0; i<explosions.length; i++) {
        explosions[i].sprite.update(dt);

        // Remove if animation is done
        if(explosions[i].sprite.done) {
            explosions.splice(i, 1);
            i--;
        }
    }
}

// Collisions

function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

function checkCollisions(enemy) {
    checkPlayerBounds();
    
    // Run collision detection for all enemies and bullets
    for(var i=0; i<enemy.length; i++) {
        var pos = enemy[i].pos;
        var size = enemy[i].sprite.size;

        for(var j=0; j<bullets.length; j++) {
            var pos2 = bullets[j].pos;
            var size2 = bullets[j].sprite.size;

            if(boxCollides(pos, size, pos2, size2)) {
                // Remove the enemy
                if (!bgSoundControlFlag) {
                    mySound.stop();
                }
                else {
                    mySound.play();
                }

                enemy.splice(i, 1);
                i--;

                // Add currentScore
                if(!isGameOver) {
                    currentScore += 100;
                }

                // Add an explosion
                explosions.push({
                    pos: pos,
                    sprite: new Sprite('img/sprites_new.png',
                                       [0, 114],
                                       [100, 100],
                                       16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8],
                                       null,
                                       true)
                });

                // Remove the bullet and stop this iteration
                bullets.splice(j, 1);
                break;
            }
        }
        if(boxCollides(pos, size, player.pos, player.sprite.size)&& !isGameOver) {
            gameOver();
        }
    }
}

function checkPlayerBounds() {
    // Check bounds
    if(player.pos[0] < 0) {
        player.pos[0] = 0;
    }
    else if(player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }

    if(player.pos[1] < 0) {
        player.pos[1] = 0;
    }
    else if(player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - player.sprite.size[1];
    }
}

// Draw everything
function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player);
    }

    renderEntities(bullets);
    renderEntities(meteorites);
    renderEntities(ufos);
    renderEntities(explosions);
}

function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        renderEntity(list[i]);
    }    
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}

// Game over
function gameOver() {
    if (currentScore > bestScore) {
        bestScore = currentScore;
        document.getElementById('new-record-message').style.display = 'block';
        document.getElementById('new-record-message').innerHTML = 'Congratulations! You showed the best result!';
    }
    else {
        document.getElementById('new-record-message').style.display = 'none';
    }
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    document.getElementById('attention-ufos').style.display = 'none';
    isGameOver = false;
    gameTime = 0;
    currentScore = 0;
    counter = 1;

    meteorites = [];
    bullets = [];
    ufos = [];

    player.pos = [50, canvas.height / 2];
}

function Sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    };
    this.stop = function(){
        this.sound.pause();
    };
}

