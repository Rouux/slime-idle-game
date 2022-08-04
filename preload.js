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
		keys: [
			{
				name: 'startBite',
				animation: 'ATTACK_BITE',
				frame: 2,
				time: 'start'
			},
			{
				name: 'endBite',
				animation: 'ATTACK_BITE',
				frame: 2,
				time: 'end'
			}
		],
		animations: {
			IDLE: {
				frames: [
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
				]
			},
			WALKING: {
				frames: [
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
				]
			},
			ATTACK_BITE: {
				frames: [
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
	}
};

contextBridge.exposeInMainWorld('AnimatedAssets', AnimatedAssets);

contextBridge.exposeInMainWorld('EntityPrefab', {
	'slime:static': {
		components: [
			{
				name: 'AnimatedSpriteComponent',
				args: ['character:slime']
			},
			{
				name: 'HitboxComponent',
				args: [
					{
						_clazz: 'Vector2',
						args: [0, 0]
					},
					{ width: 64, height: 64 }
				]
			},
			{
				name: 'HealthComponent',
				args: [100]
			},
			{
				name: 'FloatingHealthComponent',
				args: [
					{
						_clazz: 'Vector2',
						args: [0, 0]
					}
				]
			}
		]
	}
});

contextBridge.exposeInMainWorld('MathExt', {
	clamp: (num, min, max) => Math.min(Math.max(num, min), max)
});
