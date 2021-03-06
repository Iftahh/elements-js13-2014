


var Player = {
	pos : vector_create(50 * CELL_SIZE, 900 * CELL_SIZE), // start position - near water
//	pos : vector_create(220 * CELL_SIZE, 490 * CELL_SIZE), // start position - top left
//	 pos: vector_create(820*CELL_SIZE, 30*CELL_SIZE), // start position - top mountain
	// of mountain
	v : vector_create(),
	lookY:0,
	lookX:0,
	health: 30,
//	maxHealth: 30,
	laser_temperature: 0
},
LASER_COOLDOWN = 5, LASER_OVERHEAT = 4,
yellow_man = 0, MAN_IMG_SIZE = 64 * SIZE_FACTOR | 0,
gameOver = function(win) {
	Player.health = 0;
	started = false;
	overlay.innerHTML = (win? "<h1>You WIN!</h1>Awesome!!!":"<h1>Game Over</h1>Better luck next time.")+"<br><br>Press Refresh (F5) to start over.";
	overlay.style.display = "block";
}

initFu("Chasing Sprites", 4, function() {

	var manImage = intArrayToImg([0, 0, 0, 44016, 0, 0, 176124, 0, 0, 152917, 0, 0, 177556, 0, 0, 174826, 0, 1024, 174680, 5119, -2096, 174752, 1365, 1431655764, 175088, 5467, -445688492, 437244, 86, -50380800, 437247, 6, -1124253696, 1747967, 1, -1359396864, 437247, 0, 1788870656, 1485823, 0, 444596224, 1485823, 0, 83886080, 1485567, 0, 0, 1747711, 0, 0, 1485804, 0, 0, 48175, 0, 0, 15407, 0, 0, 11307, 0, 0, 11304, 0, 0, 11307, 0, 0, 11051, 0, 0],
				48,24),

	man_canvas = createCanvas(2 * MAN_IMG_SIZE, MAN_IMG_SIZE),
	ctx = Ctx(man_canvas);

	ctx.drawImage(manImage, 0, 0, 2 * MAN_IMG_SIZE, MAN_IMG_SIZE);
	emboss(ctx, true);
	yellow_man = createCanvas(2 * MAN_IMG_SIZE, MAN_IMG_SIZE);
	var bctx = Ctx(yellow_man), pixels = ctx.getImageData(0, 0,
			2 * MAN_IMG_SIZE, MAN_IMG_SIZE).data,
	yellowid = bctx.createImageData(2 * MAN_IMG_SIZE, MAN_IMG_SIZE),
	yellow = yellowid.data, i = 0;
	duRange(2 * MAN_IMG_SIZE, MAN_IMG_SIZE, function() {
		yellow[i] = pixels[i];
		i++;
		yellow[i] = pixels[i];
		i++;
		yellow[i] = pixels[i] / 2;
		i++;
		yellow[i] = pixels[i];
		i++;
	});
	bctx.putImageData(yellowid, 0, 0);
	
	addWaveFrame()
});
	

var draw_man = function(v, angle) {
	var man = yellow_man;
	spritesCtx.save();
	spritesCtx.translate(v.x - MAN_IMG_SIZE / 2, v.y - MAN_IMG_SIZE);
	if (Player.leftFace) {
		spritesCtx.translate(MAN_IMG_SIZE, 0);
		spritesCtx.scale(-1, 1);
		angle = PI - angle;
	}
	spritesCtx.drawImage(man, 0, 0, MAN_IMG_SIZE, MAN_IMG_SIZE, 0, 0,
			MAN_IMG_SIZE, MAN_IMG_SIZE);
	spritesCtx.translate(MAN_IMG_SIZE / 3 + MAN_IMG_SIZE / 9, MAN_IMG_SIZE / 3);
	spritesCtx.rotate(angle);
	spritesCtx.drawImage(man, MAN_IMG_SIZE, 0, MAN_IMG_SIZE, MAN_IMG_SIZE,
			-MAN_IMG_SIZE / 3, -MAN_IMG_SIZE / 3, MAN_IMG_SIZE, MAN_IMG_SIZE);
	spritesCtx.restore();
	// C.fillStyle= "#f00";
	// C.fillRect(v.x-1, v.y-1, 3,3)
},

// hack to keep on the ground few ticks even when in air
leftGround = 0,
/*******************************************************************************
 * Updates player location/speed for collision with mountain
 * 
 * @returns True if standing on ground (colliding down feet-floor)
 */
checkPlayerCollision = function() {
	var cell = getCellType(Player.pos.x / CELL_SIZE | 0,
			(Player.pos.y - MAN_IMG_SIZE * .4) / CELL_SIZE | 0), deepCollide = false, headCollide = false, feetCollide = false, horizOffset = 0, toMoveX = 0;

	Player.inWind = cell == AIR || cell == GRASS || cell == BURNED_GRASS;
	if (Player.v.x > 0) {
		horizOffset = MAN_IMG_SIZE / 4;
		toMoveX = -Player.pos.x % CELL_SIZE;
	}
	if (Player.v.x < 0) {
		horizOffset = MAN_IMG_SIZE / -4;
		toMoveX = -Player.pos.x % CELL_SIZE + CELL_SIZE;
	}

	// simple collision check

	// check collision at head level
	if (isCollide(Player.pos.x + horizOffset, Player.pos.y - MAN_IMG_SIZE * .8)) {
		headCollide = true;
		if (isCollide(Player.pos.x + horizOffset, Player.pos.y - MAN_IMG_SIZE * .6)){
			// deep collide - bounce back x and move back player
			deepCollide = true;
		}
	}
	// check at feet level
	if (isCollide(Player.pos.x + horizOffset, Player.pos.y + 2 * CELL_SIZE)) {
		feetCollide = true;
		// collide at feet level - check slightly above and lift if ok
		if (isCollide(Player.pos.x + horizOffset, Player.pos.y)) {
			deepCollide = true;
		}
	}

	if (feetCollide || headCollide) {
		if (deepCollide) {
			// deep collide - bounce back
			Player.v.x *= -.3;
			Player.pos.x += toMoveX;
		}

		if (abs(Player.v.y) < .2) {
			Player.v.y = 0;
		} else {
			Player.v.y *= ((Player.v.y > 0 && feetCollide) || Player.v.y < 0
					&& headCollide) ? -.3 : .3;
		}

		if (headCollide) {
			Player.pos.y += CELL_SIZE - (Player.pos.y % CELL_SIZE);
			if (!deepCollide) {
				Player.pos.y += CELL_SIZE;
			}
			Player.v.x *= .2; // friction with ceiling - remove for ice?
		}
		if (feetCollide) {

			Player.pos.y -= Player.pos.y % CELL_SIZE;
			if (deepCollide) {
				Player.pos.y -= CELL_SIZE;
			}
			Player.onGround = true;
			leftGround = 0;
			return;
		}
	}

	// hack: stay on ground for 6 ticks even if not feet collided
	if (leftGround++ > 6) {
		Player.onGround = false;
	}
},
hitPlayer=  function() {
	Player.health--;
	showTextFor = 50;
	textToPlayer = "Ouch!";
}
/***
 * sx: screen coordinate of wave, 
 * vy: vertical velocity of collider with water
 * wx,wy: world coordinates of water spray
 */
splashAt = function(sx, vy, wx,wy) { // sx is in screen coordinate
	if (sx < 0 || sx > WIDTH) {
		return;
	}
	springs[springs.length * (1 - sx / WIDTH) | 0].velocity = 22 * vy;
	if (fps > 20) {
		// splash some droplets
		water.active = true;
		water.position.x = wx;
		water.position.y = wy;
		water.speed = 0.75 * vy;
		water.emissionRate = 20 * abs(vy);
	}
	// water.angle = Math.atan2(-abs(Player.v.y), 2*Player.v.x) *
	// 180/PI;
}

KEYS = {},

updateFromKeys = function(e) {
	KEYS[e.keyCode] = e.type == "keydown";
	if (e.keyCode == 32 || e.keyCode >= 37 && e.keyCoe <= 40)
		e.preventDefault();
}, 
isLeftPressed = function() {
	return KEYS[37] || // left arrow
	KEYS[65] || KEYS[83] // 'a' or 's';
}, 
isRightPressed = function() {
	return KEYS[39] || // right arrow
	KEYS[68] || KEYS[70] // 'd' or 'f'
}, 
isUpPressed = function() {
	return KEYS[38] || KEYS[32] || KEYS[87] || KEYS[69]; // Up or Space or 'w' or 'e'
};

DC.onkeydown = updateFromKeys;
DC.onkeyup = updateFromKeys;
/*
DC.ontouchstart = function(event) {
    var ct =  event.changedTouches;
    var jsMove = null;
    var jsButton = null;
    each(ct, function($) {
        var x = $.clientX- TchCan.offsetLeft;
        var y = $.clientY-TchCan.offsetTop;
        if (x < width/2 - 20) {
            jsMove = [$.identifier, x,y];
        }
        else if (x > width/2 + 20) {
            jsButton = [$.identifier, x,y];
        }
    })
    if (jsMove != null) {
        joystickMove(jsMove);
    }
    if (jsButton != null) {
        joystickButton(jsButton)
    }
    event.preventDefault();
};

var joystickMove = function(jsMove) {
    joystick.move = jsMove;
    var x = jsMove[1];
    var y = jsMove[2];
    Tch.clearRect(0,0,width/2,height);
    Tch.beginPath();
    Tch.arc(joystick.x, joystick.y, 20, 0, TPI);
    Tch.moveTo(joystick.x, joystick.y);
    Tch.lineTo(x, y);
    Tch.arc(x,y, 35, 0, TPI);
    Tch.stroke();
    Tch.fill();
    if (x < joystick.x-15) {
        Player.left = 1;
        Player.right = 0;
        Player.up = 0;
        Player.down = 0;
    }
    else if (x > joystick.x +15) {
        Player.left = 0;
        Player.right = 1;
        Player.up = 0;
        Player.down = 0;
    }
    else {
        Player.left = 0;
        Player.right = 0;
    }

    if (!Player.left && !Player.right) {
        if (y < joystick.y-15) {
            Player.up = 1;
            Player.down = 0;
        }
        else if (y > joystick.y +15) {
            Player.up = 0;
            Player.down = 1;
        }
        else {
            Player.up = 0;
            Player.down = 0;
        }
    }
    event.preventDefault();
}

var joystickButton=function(button) {
    Player.jump = 1;
    joystick.button= button;
    Tch.clearRect(width/2,0,width/2,height);
    Tch.beginPath()
    Tch.arc(button[1],button[2], 35, 0, TPI);
    Tch.fill();
}

DC.ontouchmove = function(event) {
    var ct =  event.changedTouches;
    var jsMove = null;
    var jsButton = null;
    each(ct, function($) {
        var x = $.clientX- TchCan.offsetLeft;
        var y = $.clientY-TchCan.offsetTop;
        if (x < width/2 - 20) {
            jsMove = [$.identifier, x,y];
        }
        else if (x > width/2 + 20) {
            jsButton = [$.identifier, x,y];
        }
    })
    if (jsMove != null) {
        joystickMove(jsMove)
    }
    if (jsButton != null) {
        joystickButton(jsButton)
    }
    event.preventDefault();
}

DC.ontouchend = function(event) {
    var ct =  event.changedTouches;
    each(ct, function($) {
        if (joystick.move != null && $.identifier == joystick.move[0]) {
            joystick.move = null;
            Player.left = 0;
            Player.right = 0;
            Player.up = 0;
            Player.down = 0;
            Tch.beginPath();
            Tch.clearRect(0,0,width/2,height);
            Tch.arc(joystick.x, joystick.y, 30, 0, TPI);
            Tch.fill()
        }
        if (joystick.button != null && $.identifier == joystick.button[0]) {
            joystick.button = null;
            Player.jump = 0;
            Tch.clearRect(width/2,0,width/2,height);
        }
    });
};*/

var mouse = {
	x : 0,
	y : 0,
	pressed: 0
};
DC.onmousemove = function(evt) {
	var rect = canvases[1].getBoundingClientRect();
	mouse.x = evt.clientX - rect.left;
	mouse.y = evt.clientY - rect.top;
}

DC.onmousedown = function(e) {
	mouse.pressed |= 1<<e.button;
}
DC.onmouseup= function(e) {
	mouse.pressed &= ~(1<<e.button);
}

var updatePlayer = function(dt) {
	var WATER_FRICTION = 0.76, AIR_FRICTION = .99;

	if (Player.health <= 0) {
		gameOver();
		return;
	}
	var speed = isUpPressed() ? 1.65 : 0.6;

	Player.leftFace = Player.angle > PI / 2 || Player.angle < -PI / 2
	if (isLeftPressed()) {
		Player.v.x = max(-10, Player.v.x - speed);
		if (Player.onGround)
			Player.leftFace = true;
	} else if (isRightPressed()) {
		Player.v.x = min(10, Player.v.x + speed);
		if (Player.onGround)
			Player.leftFace = false;
	} 
	if (!Player.onGround && Player.inWind) {
		Player.v.x += windForce(Wind(), Player.v.x, .02);
	}

	jetpack.active = !Player.engine_frozen && isUpPressed();
	var above = Player.pos.y < water_y;
	Player.v.scale(above ? AIR_FRICTION : WATER_FRICTION) // air or water
															// friction

	// gravity or jetpack - higher gravity while "onGround" to allow going down
	// diagonal without hopping
	Player.v.y = minmax(-10, 20, Player.v.y
			+ (jetpack.active ? -.25 : (Player.onGround ? 0.8 : .5)));
	var dist = vector_multiply(Player.v, dt)
	Player.pos.add(dist);

	Player.angle = Math.atan2(OffsetY+mouse.y - Player.pos.y + MAN_IMG_SIZE*.72, OffsetX+mouse.x - Player.pos.x);
	var targetLookX = Math.cos(Player.angle)*CELL_SIZE*50,
		targetLookY= sin(Player.angle)*CELL_SIZE*50;
	
	Player.lookY = Player.lookY*.9+.1*targetLookY;
	Player.lookX = Player.lookX*.9+.1*targetLookX;

	if (Player.pos.y > water_y) {
		if (above) {
			splashAt(WIDTH / 2 - Player.lookX, Player.v.y, Player.pos.x, Player.pos.y+MAN_IMG_SIZE-2*CELL_SIZE)
		}
		if (Player.pos.y > water_y + HEIGHT * .5)
			Player.pos.y = 0;
	}
	if (Player.pos.x > WORLD_WIDTH + WIDTH) {
		Player.pos.x = -WIDTH;
	}
	if (Player.pos.x < -WIDTH) {
		Player.pos.x = WORLD_WIDTH + WIDTH;
	}

	checkPlayerCollision();
	if (Player.onGround) {
		// friction with ground - for ice do not alter v.x
		if (abs(Player.v.x) < .3) {
			Player.v.x = 0;
		} else {
			Player.v.x *= .8;
		}
	} else {
		if (Player.pos.y < -20 * CELL_SIZE) {
			Player.engine_frozen = 20;
		}
	}
	if (Player.engine_frozen> 0) {
		Player.engine_frozen--;
	}

	if (mouse.pressed && Player.laser_temperature < LASER_OVERHEAT) {
		laser.angle = Player.angle*360/TPI;
		laser.addParticle(Player.pos.x, Player.pos.y- MAN_IMG_SIZE*.72);
		Player.laser_temperature++;
		if (Player.laser_temperature >= LASER_OVERHEAT) { // just overheat - wait at least cooldown
			Player.laser_temperature += LASER_COOLDOWN;
		}
	}
	else {
		if (Player.laser_temperature >= LASER_OVERHEAT) {
			Player.laser_temperature--;
			if (Player.laser_temperature < LASER_OVERHEAT) // cooled down, ready to fire from start
				Player.laser_temperature = 0;
		}
	}
	
};
