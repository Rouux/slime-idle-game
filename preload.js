const { contextBridge } = require('electron');

const Assets = {
	'block:prototype:64': {
		source: 'sprites/tile_64.png',
		unitWidth: 64,
		unitHeight: 64
	}
};

contextBridge.exposeInMainWorld('Assets', Assets);

const AnimatedAssets = {
	'character:slime:lime': {
		source: 'sprites/slime_16_16_2.png',
		unitWidth: 64,
		unitHeight: 44,
		frames: 2
	}
};

contextBridge.exposeInMainWorld('AnimatedAssets', AnimatedAssets);
