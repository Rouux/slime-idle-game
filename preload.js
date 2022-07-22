const { contextBridge } = require('electron');

const Assets = {
	'block:prototype_64': {
		source: 'sprites/tile_64.png',
		unitWidth: 64,
		unitHeight: 64
	}
};

contextBridge.exposeInMainWorld('Assets', Assets);

const AnimatedAssets = {
	'character:slime': {
		source: 'sprites/slime_64.png',
		frames: {
			IDLE: [
				{
					filename: 'simple_slime_64 0.aseprite',
					frame: { x: 0, y: 0, w: 64, h: 64 },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
					sourceSize: { w: 64, h: 64 },
					duration: 380
				},
				{
					filename: 'simple_slime_64 1.aseprite',
					frame: { x: 64, y: 0, w: 64, h: 64 },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
					sourceSize: { w: 64, h: 64 },
					duration: 380
				}
			],
			WALKING: [
				{
					filename: 'simple_slime_64 2.aseprite',
					frame: { x: 128, y: 0, w: 64, h: 64 },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
					sourceSize: { w: 64, h: 64 },
					duration: 192
				},
				{
					filename: 'simple_slime_64 3.aseprite',
					frame: { x: 192, y: 0, w: 64, h: 64 },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
					sourceSize: { w: 64, h: 64 },
					duration: 576
				}
			],
			ATTACKING: [
				{
					filename: 'simple_slime_64 4.aseprite',
					frame: { x: 256, y: 0, w: 64, h: 64 },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
					sourceSize: { w: 64, h: 64 },
					duration: 192
				},
				{
					filename: 'simple_slime_64 5.aseprite',
					frame: { x: 320, y: 0, w: 64, h: 64 },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
					sourceSize: { w: 64, h: 64 },
					duration: 140
				},
				{
					filename: 'simple_slime_64 6.aseprite',
					frame: { x: 384, y: 0, w: 64, h: 64 },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
					sourceSize: { w: 64, h: 64 },
					duration: 160
				},
				{
					filename: 'simple_slime_64 7.aseprite',
					frame: { x: 448, y: 0, w: 64, h: 64 },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
					sourceSize: { w: 64, h: 64 },
					duration: 160
				},
				{
					filename: 'simple_slime_64 8.aseprite',
					frame: { x: 512, y: 0, w: 64, h: 64 },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
					sourceSize: { w: 64, h: 64 },
					duration: 80
				}
			]
		}
	}
};

contextBridge.exposeInMainWorld('AnimatedAssets', AnimatedAssets);

contextBridge.exposeInMainWorld('MathExt', {
	clamp: (num, min, max) => Math.min(Math.max(num, min), max)
});
