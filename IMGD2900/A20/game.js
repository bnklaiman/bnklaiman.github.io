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

var G = (function() {
	var exports = {
		BACKGROUND_COLOR: 0x000000,

		/* Button layout:
		   [1]          [5]
		[0][2][3]    [4][6][7]
		*/
		BUTTON_BEAD_POSITIONS: [
			[[1, 13], [1, 14]],
			[[3, 12], [4, 12]],
			[[3, 14], [4, 14]],
			[[6, 13], [6, 14]],
			
			[[9, 13], [9, 14]],
			[[11, 12], [12, 12]],
			[[11, 14], [12, 14]],
			[[14, 13], [14, 14]],
		],
		BUTTON_KEYCODES: [97, 119, 115, 100, PS.KEY_ARROW_LEFT, PS.KEY_ARROW_UP, PS.KEY_ARROW_DOWN, PS.KEY_ARROW_RIGHT],
		
		BUTTON_COLORS: [0xD40F00, 0xFF7400, 0xE3D500, 0x41E300, 0x00FFD5, 0x0020FF, 0x7300BB, 0xDC00C6],
		UNUSED_BUTTON_COLOR: 0x202020,
		
		TIMER_COLOR: 0xFFFFFF,
		TIMER_BEAD_POSITIONS: [[14, 1], [13, 1], [12, 1], [11, 1], [10, 1], [9, 1], [8, 1], [7, 1], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1]],

		MUSIC_AREA_LEFT: 1,
		MUSIC_AREA_TOP: 3,
		MUSIC_AREA_WIDTH: 14,
		MUSIC_AREA_HEIGHT: 8,
		MUSIC_AREA_COLOR: 0x202020,

		LEVELS: [
			{
				layout: [
					{
						note: 0,
						sound: "hchord_g4",
						pre_sound: "piano_g3"
					},
					{
						note: 1,
						sound: "hchord_c5",
						pre_sound: "piano_c4"
					},
					{
						note: 2,
						sound: "hchord_e5",
						pre_sound: "piano_e4"
					},
					{
						note: 3,
						sound: "hchord_g5",
						pre_sound: "piano_g4"
					}
				],
				pattern: "22_2_12_3",
				patternLength: 6,
				timerInterval: 30
			}
		],

		currentLevel: 0,
		
		timerID: null,
		timeElapsed: 0,
		timeLimit: 13,
		ticksPassed: 0, // for running code on certain timer-independent intervals
		timerModulus: 15, // the smaller this number, the faster the timer runs out

		currentUserInput: "",
		isGameOver: false,
		isPlayingBackPreview: false,
		currentPreviewNote: 0,
		currentSide: "left", // define which side is taking input from WASD/arrow keys
		
		loadLevel: function(level) {
			G.timeElapsed = 0;

			// fill in BG beads
			PS.bgAlpha(PS.ALL, PS.ALL, 255);
			PS.bgColor(PS.ALL, PS.ALL, G.BACKGROUND_COLOR);
			PS.border(PS.ALL, PS.ALL, 0);
			PS.color(PS.ALL, PS.ALL, G.BACKGROUND_COLOR);
			PS.radius(PS.ALL, PS.ALL, 0);
			// fill in note button beads
			for (var i = 0; i < 8; i++) {
				PS.color(G.BUTTON_BEAD_POSITIONS[i][0][0], G.BUTTON_BEAD_POSITIONS[i][0][1], G.UNUSED_BUTTON_COLOR);
				PS.color(G.BUTTON_BEAD_POSITIONS[i][1][0], G.BUTTON_BEAD_POSITIONS[i][1][1], G.UNUSED_BUTTON_COLOR);
			}

			// fill in initial timer state
			for (var bead in G.TIMER_BEAD_POSITIONS) {
				PS.color(G.TIMER_BEAD_POSITIONS[bead][0], G.TIMER_BEAD_POSITIONS[bead][1], G.TIMER_COLOR);
			}

			// draw music visualization space (rectangle)
			PS.applyRect(G.MUSIC_AREA_LEFT, G.MUSIC_AREA_TOP, G.MUSIC_AREA_WIDTH, G.MUSIC_AREA_HEIGHT, PS.color, G.MUSIC_AREA_COLOR);

			G.isPlayingBackPreview = true;
			G.currentPreviewNote = 0;
		},

		playPreviewNote: function() {
			switch (G.LEVELS[G.currentLevel].pattern[G.currentPreviewNote]) {
				case "0":
					PS.audioPlay(G.LEVELS[G.currentLevel].layout[0].pre_sound);
					if (G.currentPreviewNote < 8) {
						PS.color(G.currentPreviewNote + 4, 4, G.BUTTON_COLORS[0]);
						PS.bgColor(G.currentPreviewNote + 4, 4, G.MUSIC_AREA_COLOR);
						PS.radius(G.currentPreviewNote + 4, 4, 50);
					} else {
						PS.color((G.currentPreviewNote - 8) + 4, 6, G.BUTTON_COLORS[0]);
						PS.bgColor((G.currentPreviewNote - 8) + 4, 6, G.MUSIC_AREA_COLOR);
						PS.radius((G.currentPreviewNote - 8) + 4, 6, 50);
					}
					break;
				case "1":
					PS.audioPlay(G.LEVELS[G.currentLevel].layout[1].pre_sound);
					if (G.currentPreviewNote < 8) {
						PS.color(G.currentPreviewNote + 4, 4, G.BUTTON_COLORS[1]);
						PS.bgColor(G.currentPreviewNote + 4, 4, G.MUSIC_AREA_COLOR);
						PS.radius(G.currentPreviewNote + 4, 4, 50);
					} else {
						PS.color((G.currentPreviewNote - 8) + 4, 6, G.BUTTON_COLORS[1]);
						PS.bgColor((G.currentPreviewNote - 8) + 4, 6, G.MUSIC_AREA_COLOR);
						PS.radius((G.currentPreviewNote - 8) + 4, 6, 50);
					}
					break;
				case "2":
					PS.audioPlay(G.LEVELS[G.currentLevel].layout[2].pre_sound);
					if (G.currentPreviewNote < 8) {
						PS.color(G.currentPreviewNote + 4, 4, G.BUTTON_COLORS[2]);
						PS.bgColor(G.currentPreviewNote + 4, 4, G.MUSIC_AREA_COLOR)
						PS.radius(G.currentPreviewNote + 4, 4, 50);
					} else {
						PS.color((G.currentPreviewNote - 8) + 4, 6, G.BUTTON_COLORS[2]);
						PS.bgColor((G.currentPreviewNote - 8) + 4, 6, G.MUSIC_AREA_COLOR);
						PS.radius((G.currentPreviewNote - 8) + 4, 6, 50);
					}
					break;
				case "3":
					PS.audioPlay(G.LEVELS[G.currentLevel].layout[3].pre_sound);
					if (G.currentPreviewNote < 8) {
						PS.color(G.currentPreviewNote + 4, 4, G.BUTTON_COLORS[3]);
						PS.bgColor(G.currentPreviewNote + 4, 4, G.MUSIC_AREA_COLOR);
						PS.radius(G.currentPreviewNote + 4, 4, 50);
					} else {
						PS.color((G.currentPreviewNote - 8) + 4, 6, G.BUTTON_COLORS[3]);
						PS.bgColor((G.currentPreviewNote - 8) + 4, 6, G.MUSIC_AREA_COLOR);
						PS.radius((G.currentPreviewNote - 8) + 4, 6, 50);
					}
					break;
			}
			if (G.currentPreviewNote !== "_") {
				G.currentPreviewNote++;
			}
		},

		tick: function() {
			if (G.ticksPassed < G.timerModulus) {
				G.ticksPassed++;
			} else {
				G.ticksPassed = 0;
			}

			if (G.currentSide === "left") {
				for (var i = 0; i < 4; i++) {
					PS.color(G.BUTTON_BEAD_POSITIONS[i][0][0], G.BUTTON_BEAD_POSITIONS[i][0][1], G.BUTTON_COLORS[i]);
					PS.color(G.BUTTON_BEAD_POSITIONS[i][1][0], G.BUTTON_BEAD_POSITIONS[i][1][1], G.BUTTON_COLORS[i]);
				}
			} else if (G.currentSide === "right") {
				for (var i = 4; i < 8; i++) {
					PS.color(G.BUTTON_BEAD_POSITIONS[i][0][0], G.BUTTON_BEAD_POSITIONS[i][0][1], G.BUTTON_COLORS[i]);
					PS.color(G.BUTTON_BEAD_POSITIONS[i][1][0], G.BUTTON_BEAD_POSITIONS[i][1][1], G.BUTTON_COLORS[i]);
				}
			}

			if (G.timeElapsed < G.timeLimit) {
				if (G.ticksPassed % G.timerModulus === G.timerModulus - 1) {
					PS.color(G.TIMER_BEAD_POSITIONS[G.timeElapsed][0], G.TIMER_BEAD_POSITIONS[G.timeElapsed][1], G.BACKGROUND_COLOR);
					G.timeElapsed++;
				}
			} else {
				PS.timerStop(G.timerID);
				G.isGameOver = true;
				PS.statusText("Oh no! You ran out of time.");
				PS.audioPlay("fx_blast1");
			}

			if (G.isPlayingBackPreview) {
				G.playPreviewNote();
			} else {
				PS.applyRect(G.MUSIC_AREA_LEFT, G.MUSIC_AREA_TOP, G.MUSIC_AREA_WIDTH, G.MUSIC_AREA_HEIGHT, PS.color, G.MUSIC_AREA_COLOR);
			}
		},

		validateInput: function() {
			// temporarily erase rest periods for easier checking
			if (G.currentUserInput === G.LEVELS[G.currentLevel].pattern.split("_").join("")) {
				PS.timerStop(G.timerID);
				PS.statusText("Correct!");
				PS.audioPlay("fx_jump1");
			} else {
				PS.statusText("Not quite! Try again.");
				PS.audioPlay("fx_bloink");
				G.currentPreviewNote = 0;
				G.isPlayingBackPreview = true;
			}
			G.currentUserInput = "";
		}
	};

	return exports;
}());

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
	PS.audioLoad("hchord_g4", { volume: 0.25 });
	PS.audioLoad("hchord_c5", { volume: 0.25 });
	PS.audioLoad("hchord_e5", { volume: 0.25 });
	PS.audioLoad("hchord_g5", { volume: 0.25 });
	PS.audioLoad("piano_g3", { volume: 0.25 });
	PS.audioLoad("piano_c4", { volume: 0.25 });
	PS.audioLoad("piano_e4", { volume: 0.25 });
	PS.audioLoad("piano_g4", { volume: 0.25 });
	PS.audioLoad("fx_jump1", { volume: 0.3 });
	PS.audioLoad("fx_bloink", { volume: 0.3 });
	PS.audioLoad("fx_blast1", { volume: 0.4 });
	PS.gridSize(16, 16);
	PS.gridColor(0x333333);
	PS.statusColor(0xFFFFFF);
	PS.statusText("Play it back!");
	G.loadLevel(G.currentLevel);
	G.timerID = PS.timerStart(15, G.tick);
};

/*
PS.keyDown (key, shift, ctrl, options)
Called when a key on the keyboard is pressed.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyDown = function(key, shift, ctrl, options) {
	G.isPlayingBackPreview = false;
	if (!G.isGameOver) {
		if (G.currentSide === "left") {
			if (key === G.BUTTON_KEYCODES[0] || key === G.BUTTON_KEYCODES[4]) {
				PS.audioPlay(G.LEVELS[G.currentLevel].layout[0].sound);
				G.currentUserInput += "0";
			} else if (key === G.BUTTON_KEYCODES[1] || key === G.BUTTON_KEYCODES[5]) {
				PS.audioPlay(G.LEVELS[G.currentLevel].layout[1].sound);
				G.currentUserInput += "1";
			} else if (key === G.BUTTON_KEYCODES[2] || key === G.BUTTON_KEYCODES[6]) {
				PS.audioPlay(G.LEVELS[G.currentLevel].layout[2].sound);
				G.currentUserInput += "2";
			} else if (key === G.BUTTON_KEYCODES[3] || key === G.BUTTON_KEYCODES[7]) {
				PS.audioPlay(G.LEVELS[G.currentLevel].layout[3].sound);
				G.currentUserInput += "3";
			}
		} else if (G.currentSide === "right") {
			if (key === G.BUTTON_KEYCODES[0] || key === G.BUTTON_KEYCODES[4]) {
				PS.audioPlay(G.LEVELS[G.currentLevel].layout[0].sound);
				G.currentUserInput += "4";
			} else if (key === G.BUTTON_KEYCODES[1] || key === G.BUTTON_KEYCODES[5]) {
				PS.audioPlay(G.LEVELS[G.currentLevel].layout[1].sound);
				G.currentUserInput += "5";
			} else if (key === G.BUTTON_KEYCODES[2] || key === G.BUTTON_KEYCODES[6]) {
				PS.audioPlay(G.LEVELS[G.currentLevel].layout[2].sound);
				G.currentUserInput += "6";
			} else if (key === G.BUTTON_KEYCODES[3] || key === G.BUTTON_KEYCODES[7]) {
				PS.audioPlay(G.LEVELS[G.currentLevel].layout[3].sound);
				G.currentUserInput += "7";
			}
		}
	}

	if (G.currentUserInput.length >= G.LEVELS[G.currentLevel].patternLength) {
		G.validateInput();
	}
};