/*
game.js for Perlenspiel 3.3.x
Last revision: 2022-03-15 (BM)

Perlenspiel is a scheme by Professor Moriarty (bmoriarty@wpi.edu).
This version of Perlenspiel (3.3.x) is hosted at <https://ps3.perlenspiel.net>
Perlenspiel is Copyright © 2009-22 Brian Moriarty.
This file is part of the standard Perlenspiel 3.3.x devkit distribution.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with the Perlenspiel devkit. If not, see <http://www.gnu.org/licenses/>.
*/

/*
This JavaScript file is a template for creating new Perlenspiel 3.3.x games.
Any unused event-handling function templates can be safely deleted.
Refer to the tutorials and documentation at <https://ps3.perlenspiel.net> for details.
*/

/*
The following comment lines are for JSHint <https://jshint.com>, a tool for monitoring code quality.
You may find them useful if your development environment is configured to support JSHint.
If you don't use JSHint (or are using it with a configuration file), you can safely delete these two lines.
*/

/* jshint browser : true, devel : true, esversion : 6, freeze : true */
/* globals PS : true */

"use strict"; // Do NOT remove this directive!

// Array of level objects:
var LEVELS = [
	{
		// grid dimensions
		"gridSize": {
			"width": 11,
			"height": 11
		},
		// status text to be displayed:
		"statusText": "Click the circle.",
		// height of button area (bottom half)
		"buttonAreaHeight": 9,
		// all gates that can be controlled
		"gates": [
			{
				// color of gate and respective button
				"color": 0xFF0000,
				// x-position of gate
				"gateX": 5,
				// y-position of gate
				"gateY": 1,
				// x-position of button
				"buttonX": 5,
				// y-position of button
				"buttonY": 7,
				// index of other affected gates that this gate's button controls
				"otherAffectedGates": [],
				// is gate active? It's getting defined here, so for now yes.
				"isActive": true
			}
		],
		// define where the water starts
		"waterPathStartingPoint": {
			"x": 1,
			"y": 1
		},
		// path of water, each character is one step on the grid
		// '[' marks the beginning of a fork, ']' marks the end
		"waterPath": ">>>>>>>>"
	}
];

var currentLevel = 0;
var currentWaterPathPosition = 0; // position (index) tracker in waterPath
var waterPathLength = 0; // make separate counter to ignore branching path characters
var currentWaterXPosition = 0;
var currentWaterYPosition = 0;

/*
PS.init(system, options)
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

function loadLevel(level) {
	PS.gridSize(level.gridSize.width, level.gridSize.height);
	PS.data(PS.ALL, PS.ALL, null);
	PS.gridColor(0x303030);
	PS.statusColor(0xFFFFFF);
	PS.statusText(level.statusText);
	PS.color(PS.ALL, PS.ALL, 0x000000);
	PS.bgAlpha(PS.ALL, PS.ALL, 255);
	PS.bgColor(PS.ALL, PS.ALL, 0x101116)
	PS.radius(PS.ALL, PS.ALL, 0);
	PS.border(PS.ALL, PS.ALL, 0);
	// Fill in button area.
	PS.applyRect(1, level.gridSize.height - level.buttonAreaHeight + 1, level.gridSize.width - 2, level.buttonAreaHeight - 2, PS.color, 0x101116);
	// Fill in initial water path.
	var initialPathX = level.waterPathStartingPoint.x;
	var initialPathY = level.waterPathStartingPoint.y;
	PS.color(initialPathX, initialPathY, 0x101116);
	for (let i = 0; i < level.waterPath.length; i++) {
		switch (level.waterPath[i]) {
			case "<":
				initialPathX--;
				break;
			case "^":
				initialPathY++;
				break;
			case "v":
				initialPathY--;
				break;
			case ">":
				initialPathX++;
				break;
			default:
				PS.debug("Uh oh! Invalid direction.\n");
				break;
		}
		PS.color(initialPathX, initialPathY, 0x101116);
	}

	// Place gates and buttons.
	level.gates.forEach(gate => {
		PS.color(gate.gateX, gate.gateY, gate.color);
		PS.data(gate.gateX, gate.gateY, "gate");
		PS.radius(gate.buttonX, gate.buttonY, 50);
		PS.color(gate.buttonX, gate.buttonY, gate.color);
	});

	// Place reset button.
	PS.radius(level.gridSize.width - 2, level.gridSize.height - 2, 25);
	PS.color(level.gridSize.width - 2, level.gridSize.height - 2, 0xFFFFFF);
	PS.glyphColor(level.gridSize.width - 2, level.gridSize.height - 2, 0x000000);
	PS.glyph(level.gridSize.width - 2, level.gridSize.height - 2, 0x21BA);

	// Make water start at the beginning
	currentWaterPathPosition = 0;
	// Set water path length, ignore branching path characters
	waterPathLength = 0;
	for (var i = 0; i < level.waterPath.length; i++) {
		if (level.waterPath[i] !== '[' || level.waterPath[i] !== ']') {
			waterPathLength += 1;
		}
	}
	// Initialize water starting point
	currentWaterXPosition = level.waterPathStartingPoint.x;
	currentWaterYPosition = level.waterPathStartingPoint.y;
}

// Every tick, unless a gate is up, make water flow.
function tick() {
	if (currentWaterPathPosition <= waterPathLength) {
		PS.color(currentWaterXPosition, currentWaterYPosition, 0x4285F4);
		PS.data(currentWaterXPosition, currentWaterYPosition, "water");
		switch (LEVELS[currentLevel].waterPath[currentWaterPathPosition]) {
			case '<':
				if (PS.data(currentWaterXPosition - 1, currentWaterYPosition) !== "gate") {
					currentWaterXPosition -= 1;
					currentWaterPathPosition++;
				}
				break;
			case '^':
				if (PS.data(currentWaterXPosition, currentWaterYPosition - 1) !== "gate") {
					currentWaterYPosition -= 1;
					currentWaterPathPosition++;
				}
				break;
			case 'v':
				if (PS.data(currentWaterXPosition, currentWaterYPosition + 1) !== "gate") {
					currentWaterYPosition += 1;
					currentWaterPathPosition++;
				}
				break;
			case '>':
				if (PS.data(currentWaterXPosition + 1, currentWaterYPosition) !== "gate") {
					currentWaterXPosition += 1;
					currentWaterPathPosition++;
				}
				break;
		}
	} else {
		// Puzzle complete!
		PS.statusText("&#128077");
		PS.audioPlay("fx_tada");
	}
}

PS.init = function(system, options) {
	PS.timerStart(7, tick)
	PS.audioLoad("fx_scratch");
	PS.audioLoad("fx_tada");
	loadLevel(LEVELS[currentLevel]);
};

/*
PS.touch (x, y, data, options)
Called when the left mouse button is clicked over bead(x, y), or when bead(x, y) is touched.
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.touch = function(x, y, data, options) {
	var gates = LEVELS[currentLevel].gates;

	// If reset button is clicked, reset puzzle
	if (x === LEVELS[currentLevel].gridSize.width - 2 && y === LEVELS[currentLevel].gridSize.height - 2) {
		PS.audioPlay("fx_scratch", { volume: 0.5 });
		gates.forEach(gate => {
			if (gate.isActive) {
				gate.isActive = false;
			}
		});
		loadLevel(LEVELS[currentLevel]);
	}

	// If button is clicked, affect gates
	gates.forEach(gate => {
		if (gate.isActive) {
			PS.data(gate.gateX, gate.gateY, null);
			PS.color(gate.gateX, gate.gateY, 0x101116);
			PS.color(gate.buttonX, gate.buttonY, 0x101116);
			gate.isActive = false;
		}
	});
};

/*
PS.release ( x, y, data, options )
Called when the left mouse button is released, or when a touch is lifted, over bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.release = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.release() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse button/touch is released over a bead.
};

/*
PS.enter ( x, y, button, data, options )
Called when the mouse cursor/touch enters bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.enter = function( x, y, data, options ) {
	if (x === LEVELS[currentLevel].gridSize.width - 2 && y === LEVELS[currentLevel].gridSize.height - 2) {
		PS.statusText("Reset water stream");
	} else {
		PS.statusText(LEVELS[currentLevel].statusText);
	}
};

/*
PS.exit ( x, y, data, options )
Called when the mouse cursor/touch exits bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exit = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.exit() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch exits a bead.
};

/*
PS.exitGrid ( options )
Called when the mouse cursor/touch exits the grid perimeter.
This function doesn't have to do anything. Any value returned is ignored.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exitGrid = function( options ) {
	// Uncomment the following code line to verify operation:

	// PS.debug( "PS.exitGrid() called\n" );

	// Add code here for when the mouse cursor/touch moves off the grid.
};

/*
PS.keyDown ( key, shift, ctrl, options )
Called when a key on the keyboard is pressed.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyDown = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is pressed.
};

/*
PS.keyUp ( key, shift, ctrl, options )
Called when a key on the keyboard is released.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyUp = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyUp(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is released.
};

/*
PS.input ( sensors, options )
Called when a supported input device event (other than those above) is detected.
This function doesn't have to do anything. Any value returned is ignored.
[sensors : Object] = A JavaScript object with properties indicating sensor status; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
NOTE: Currently, only mouse wheel events are reported, and only when the mouse cursor is positioned directly over the grid.
*/

PS.input = function( sensors, options ) {
	// Uncomment the following code lines to inspect first parameter:

//	 var device = sensors.wheel; // check for scroll wheel
//
//	 if ( device ) {
//	   PS.debug( "PS.input(): " + device + "\n" );
//	 }

	// Add code here for when an input event is detected.
};

