/*
game.js for Perlenspiel 3.3.x
Last revision: 2022-03-15 (BM)

/* jshint browser : true, devel : true, esversion : 6, freeze : true */
/* globals PS : true */

// Benny Klaiman
// Creators of Caerbannog
// Mod 1: Changed grid size to 17x17
// Mod 2: Changed click color from black to random
// Mod 3: On click, fills screen with a horizontal bidirectional wipe starting from where a bead was clicked
// Mod 4: Add a code-specified chance of playing a certain sound effect
// Mod 5: Changed border and grid colors to change as grid is clicked

"use strict"; // Do NOT remove this directive!

var G = (function() {
	// Grid dimensions
	const WIDTH = 17;
	const HEIGHT = 17;

	// track current position of edges in bead wipe
	var currentLeft, currentRight, currentTop, currentBottom = 0; 
	var timeElapsed = 0;
	var exports = {
		// initialize global variables
		init: function() {
			// Initialize timer
			var myTimer;

			// Establish grid dimensions
			PS.gridSize(WIDTH, HEIGHT);

			// Set background color to Perlenspiel logo gray
			PS.gridColor(0x303030);

			// Make border and  transparent
			PS.border(PS.ALL, PS.ALL, 1);
			PS.borderAlpha(PS.ALL, PS.ALL, 0);

			// Change status line color and text
			PS.statusColor(PS.COLOR_WHITE);
			PS.statusText("Touch any bead, and then try a different bead");

			// Preload click sound
			PS.audioLoad("fx_zurp");
			PS.audioLoad("fx_wilhelm");
		},

		tick: function (startX, startY, r, g, b) {
			if (startY - timeElapsed < 0) {
				PS.color(PS.ALL, 0, r, g, b);
				PS.borderColor(PS.ALL, 0, r, g, b);
				G.currentTop = 0;
			} else {
				PS.color(PS.ALL, startY - timeElapsed, r, g, b);
				PS.borderColor(PS.ALL, startY - timeElapsed, r, g, b);
				G.currentTop = startY - timeElapsed;
			}
			
			if (startY + timeElapsed > HEIGHT - 1) {
				PS.color(PS.ALL, HEIGHT - 1, r, g, b);
				PS.borderColor(PS.ALL, HEIGHT - 1, r, g, b);
				G.currentBottom = HEIGHT - 1;
			} else {
				PS.color(PS.ALL, startY + timeElapsed, r, g, b);
				PS.borderColor(PS.ALL, startY + timeElapsed, r, g, b);
				G.currentBottom = startY + timeElapsed;
			}
			
			timeElapsed += 1;
			if (G.currentTop <= 0 && G.currentBottom >= HEIGHT - 1) {
				PS.gridColor(r, g, b);
				PS.timerStop(G.myTimer);
				timeElapsed = 0;
			}
		}
	}
	return exports;
}());

PS.init = G.init;

PS.touch = function(x, y, data, options) {
	var r, g, b;

	r = PS.random(256) - 1;
	g = PS.random(256) - 1;
	b = PS.random(256) - 1;

	// PS.color(x, y, r, g, b); // set color to current value of data

	// Start the animation timer
	G.timeElapsed = 0;
	G.myTimer = PS.timerStart(1, G.tick, x, y, r, g, b);

	// Determine which sfx to play
	var audioChance = PS.random(100);
	if (audioChance === 69) {
		PS.audioPlay("fx_wilhelm");
	} else {
		PS.audioPlay("fx_zurp");
	}
};