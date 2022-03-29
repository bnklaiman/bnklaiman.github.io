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

This toy uses modifications of "Firework - Take off - Small pop.wav" from user 
Quistard on freesound.com and "Fireworks" from user MrAuralization on freesound.com
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

// HSV to RGB conversion for firework colors, because apparently it's only RGB for PS3, you see
// adapted to JS using the formula at https://www.rapidtables.com/convert/color/hsv-to-rgb.html
// returns array in the format: [r, g, b]
function HSV2RGB(H, S, V) {
	// error checking, return [r=0, g=0, b=0] if invalid
	if (H < 0 || H >= 360) {
		PS.debug("HSV2RGB: Hue (the 'H' in 'HSV') must be 0 <= H < 360");
		return [0, 0, 0];
	} else if (S < 0 || S > 1) {
		PS.debug("HSV2RGB: Saturation (the 'S' in 'HSV') must be 0 <= S <= 1. Did you use a number greater than 1?");
		return [0, 0, 0];
	} else if (V < 0 || V > 1) {
		PS.debug("HSV2RGB: Value (the 'V' in 'HSV') must be 0 <= V <= 1. Did you use a number greater than 1?");
		return [0, 0, 0];
	}

	var C = V * S;
	var X = C * (1 - Math.abs(H / 60 % 2 - 1));
	var m = V - C;

	// temp[0] = red, temp[1] = green, temp[2] = blue;
	var temp = [];
	if (H >= 0 && H < 60) {
		temp = [C, X, 0];
	} else if (H >= 60 && H < 120) {
		temp = [X, C, 0];
	} else if (H >= 120 && H < 180) {
		temp = [0, C, X];
	} else if (H >= 180 && H < 240) {
		temp = [0, X, C];
	} else if (H >= 240 && H < 300) {
		temp = [X, 0, C];
	} else if (H >= 300 && H < 360) {
		temp = [C, 0, X];
	}

	var red = temp[0];
	var green = temp[1];
	var blue = temp[2];

	return [Math.round((red + m) * 255), Math.round((green + m) * 255), Math.round((blue + m) * 255)];
}

var G = {
	// Grid dimensions
	GRID_WIDTH: 24,
	GRID_HEIGHT: 32,
	// Colors
	GRID_COLOR: 0x000000,
	FIREWORK_UPWARD_COLOR: 0xFFFFFF,
	FIREWORK_EXPLODE_COLOR: 0xFFFFFF,
	STATUS_COLOR: 0xFFFFFF,
	// Variable to determine firework explosion positions per tick
	stepsTaken: 0,
	// Set boundary line (a horizontal line, so y position only)
	BOUNDARY_LINE: 8,
	// Set max Perlenspiel dimensions for readability
	MAX_DIMENSION: 32,

	// store coordinates of active fireworks in arrays (thanks, examples page!)
	activeFireworks: [],

	// Do everything that needs to be done in a single timer tick
	tick: function() {
		var numberOfActiveFireworks, x, y;
		numberOfActiveFireworks = G.activeFireworks.length;
		
		for (var i = 0; i < numberOfActiveFireworks; i++) {
			x = G.activeFireworks[i].xPos;
			y = G.activeFireworks[i].yPos;

			if (y > G.BOUNDARY_LINE) {
				// erase current bead
				PS.fade(x, y, 10);
				PS.color(x, y, G.GRID_COLOR);
				// every other millisecond, unless at rightmost edge, offset xPos by 1
				// background cleanup
				if (x !== G.GRID_WIDTH - 1) {
					PS.color(x + 1, y, G.GRID_COLOR)
				}
				// decrease y position (make it go up)
				y -= 1;

				// every other millisecond, unless at rightmost edge, offset xPos by 1
				if ((PS.elapsed() % 2 == 1) && (x !== G.GRID_WIDTH - 1)) {
					x += 1;
				}

				// set y position of this particular firework
				G.activeFireworks[i].yPos = y;

				if (y > G.BOUNDARY_LINE) {
					// Recolor new bead to show updated firework position
					PS.color(x, y, HSV2RGB(Math.floor(Math.random() * 359), 0.15, 1));
				} else {
					// Trigger explosion
					G.explode(x, y);
				}
			}
		}
	},

	// cause firework explosion from (x,y) location
	explode: function(x, y) {
		PS.audioPlay("explode", { fileTypes: ["wav"], path: "audio/"})

		// explosion effect
		// don't draw specific beads if outside border dimensions
		if (PS.elapsed() % 3 === 0) {
			/* Pattern 1:
			. . a . .
			. b . c .
			d . e . f
			. g . h .
			. . i . .
			*/
			if (x > 1) {
				/* +d */ PS.color(x-2, y, G.FIREWORK_EXPLODE_COLOR);
				/* -d */ PS.color(x-2, y, G.GRID_COLOR);
			}
			if (x > 0) {
				/* +b */ PS.color(x-1, y-1, G.FIREWORK_EXPLODE_COLOR);
				/* +g */ PS.color(x-1, y+1, G.FIREWORK_EXPLODE_COLOR);
				/* -b */ PS.color(x-1, y-1, G.GRID_COLOR);
				/* -g */ PS.color(x-1, y+1, G.GRID_COLOR);
			}
			/* +a */ PS.color(x, y-2, G.FIREWORK_EXPLODE_COLOR);
			/* +e */ PS.color(x, y,   G.FIREWORK_EXPLODE_COLOR);
			/* +i */ PS.color(x, y+2, G.FIREWORK_EXPLODE_COLOR);
			/* -a */ PS.color(x, y-2, G.GRID_COLOR);
			/* -e */ PS.color(x, y,   G.GRID_COLOR);
			/* -i */ PS.color(x, y+2, G.GRID_COLOR);
			if (x < G.GRID_WIDTH - 1) {
				/* +c */ PS.color(x+1, y-1, G.FIREWORK_EXPLODE_COLOR);
				/* +h */ PS.color(x+1, y+1, G.FIREWORK_EXPLODE_COLOR);
				/* -c */ PS.color(x+1, y-1, G.GRID_COLOR);
				/* -h */ PS.color(x+1, y+1, G.GRID_COLOR);
			}
			if (x < G.GRID_WIDTH - 2) {
				/* +f */ PS.color(x+2, y, G.FIREWORK_EXPLODE_COLOR);
				/* -f */ PS.color(x+2, y, G.GRID_COLOR);
			}
		} else if (PS.elapsed() % 3 === 1) {
			/* Pattern 2:
			. a . b .
			c . d . e
			. f . g .
			h . i . j
			. k . l .
			*/
			if (x > 1) {
				/* +c */ PS.color(x-2, y-1, G.FIREWORK_EXPLODE_COLOR);
				/* -c */ PS.color(x-2, y-1, G.GRID_COLOR);
				/* +h */ PS.color(x-2, y+1, G.FIREWORK_EXPLODE_COLOR);
				/* -h */ PS.color(x-2, y+1, G.GRID_COLOR);
			}
			if (x > 0) {
				/* +a */ PS.color(x-1, y-2, G.FIREWORK_EXPLODE_COLOR);
				/* -a */ PS.color(x-1, y-2, G.GRID_COLOR);
				/* +f */ PS.color(x-1, y, G.FIREWORK_EXPLODE_COLOR);
				/* -f */ PS.color(x-1, y, G.GRID_COLOR);
				/* +k */ PS.color(x-1, y+2, G.FIREWORK_EXPLODE_COLOR);
				/* -k */ PS.color(x-1, y+2, G.GRID_COLOR);
			}
			/* +d */ PS.color(x,   y-1, G.FIREWORK_EXPLODE_COLOR);
			/* -d */ PS.color(x,   y-1, G.GRID_COLOR);
			/* +i */ PS.color(x,   y+1, G.FIREWORK_EXPLODE_COLOR);
			/* -i */ PS.color(x,   y+1, G.GRID_COLOR);
			if (x < G.GRID_WIDTH - 1) {
				/* +b */ PS.color(x+1, y-2, G.FIREWORK_EXPLODE_COLOR);
				/* -b */ PS.color(x+1, y-2, G.GRID_COLOR);
				/* +g */ PS.color(x+1, y, G.FIREWORK_EXPLODE_COLOR);
				/* -g */ PS.color(x+1, y, G.GRID_COLOR);
				/* +l */ PS.color(x+1, y+2, G.FIREWORK_EXPLODE_COLOR);
				/* -l */ PS.color(x+1, y+2, G.GRID_COLOR);
			}
			if (x < G.GRID_WIDTH - 2) {
				/* +e */ PS.color(x+2, y-1, G.FIREWORK_EXPLODE_COLOR);
				/* -e */ PS.color(x+2, y-1, G.GRID_COLOR);
				/* +j */ PS.color(x+2, y+1, G.FIREWORK_EXPLODE_COLOR);
				/* -j */ PS.color(x+2, y+1, G.GRID_COLOR);
			}
		} else {
			/* Pattern 3:
			a . b . c
			. d . e .
			f . g . h
			. i . j .
			k . l . m
			*/
			if (x > 1) {
				/* +a */ PS.color(x-2, y-2, G.FIREWORK_EXPLODE_COLOR);
				/* +f */ PS.color(x-2, y,   G.FIREWORK_EXPLODE_COLOR);
				/* +k */ PS.color(x-2, y+2, G.FIREWORK_EXPLODE_COLOR);
				/* -a */ PS.color(x-2, y-2, G.GRID_COLOR);
				/* -f */ PS.color(x-2, y,   G.GRID_COLOR);
				/* -k */ PS.color(x-2, y+2, G.GRID_COLOR);
			}
			if (x > 0) {
				/* +d */ PS.color(x-1, y-1, G.FIREWORK_EXPLODE_COLOR);
				/* +f */ PS.color(x-1, y+1, G.FIREWORK_EXPLODE_COLOR);
				/* -d */ PS.color(x-1, y-1, G.GRID_COLOR);
				/* -f */ PS.color(x-1, y+1, G.GRID_COLOR);
			}
			/* +b */ PS.color(x, y-2, G.FIREWORK_EXPLODE_COLOR);
			/* +g */ PS.color(x, y,   G.FIREWORK_EXPLODE_COLOR);
			/* +l */ PS.color(x, y+2, G.FIREWORK_EXPLODE_COLOR);
			/* -b */ PS.color(x, y-2, G.GRID_COLOR);
			/* -g */ PS.color(x, y,   G.GRID_COLOR);
			/* -l */ PS.color(x, y+2, G.GRID_COLOR);
			if (x < G.GRID_WIDTH - 1) {
				/* +e */ PS.color(x+1, y-1, G.FIREWORK_EXPLODE_COLOR);
				/* +j */ PS.color(x+1, y+1, G.FIREWORK_EXPLODE_COLOR);
				/* -e */ PS.color(x+1, y-1, G.GRID_COLOR);
				/* -j */ PS.color(x+1, y+1, G.GRID_COLOR);
			}
			if (x < G.GRID_WIDTH - 2) {
				/* +c */ PS.color(x+2, y-2, G.FIREWORK_EXPLODE_COLOR);
				/* +h */ PS.color(x+2, y,   G.FIREWORK_EXPLODE_COLOR);
				/* +m */ PS.color(x+2, y+2, G.FIREWORK_EXPLODE_COLOR);
				/* -c */ PS.color(x+2, y-2, G.GRID_COLOR);
				/* -h */ PS.color(x+2, y,   G.GRID_COLOR);
				/* -m */ PS.color(x+2, y+2, G.GRID_COLOR);
			}
		}
	}
};

/*
PS.init(system, options)
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.init = function(system, options) {
	PS.gridSize(G.GRID_WIDTH, G.GRID_HEIGHT);
	PS.statusColor(G.STATUS_COLOR);
	PS.statusText("Touch any bead.");
	PS.border(PS.ALL, PS.ALL, 1);
	PS.borderColor(PS.ALL, PS.ALL, 0x111111);
	PS.gridColor(G.GRID_COLOR);
	PS.color(PS.ALL, PS.ALL, G.GRID_COLOR);
	PS.fade(PS.ALL, PS.ALL, 10);
	PS.timerStart(2, G.tick);
	PS.audioPlay("launch", { fileTypes: ["wav"], path: "audio/" })
	PS.audioPlay("explode", { fileTypes: ["wav"], path: "audio/" })
};

/*
PS.touch(x, y, data, options)
Called when the left mouse button is clicked over bead(x, y), or when bead(x, y) is touched.
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.touch = function(x, y, data, options) {
	if (y > G.BOUNDARY_LINE) {
		// Position clicked is below boundary line, start ascent upwards from position clicked
		G.activeFireworks.push({xPos: x, yPos: y});
		PS.color(x, y, G.FIREWORK_UPWARD_COLOR);
		PS.audioPlay("launch", { fileTypes: ["wav"], path: "audio/", volume: 0.3 })
		PS.statusText("Touch any bead.")
	} else {
		// if boundary line or higher clicked, explode on boundary line at x position immediately
		// in case of an in-class demo
		PS.statusText("That's not how fireworks work but okay");
		G.explode(x, G.BOUNDARY_LINE);
	}
};