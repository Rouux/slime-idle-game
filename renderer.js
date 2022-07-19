window.entities = [];
/** @type HTMLCanvasElement*/
const canvas = document.getElementById('main-canvas');
const context = canvas.getContext('2d');

class Bounds {
	constructor({ x = 0, y = 0, width = 0, height = 0 }) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}

class Component {
	constructor() {}
	onInit() {}
	beforeDraw(_context) {}
	onDraw(_context) {}
	afterDraw(_context) {}
	onDestroy() {}
}

class Entity {
	constructor() {
		this.components = [];
		entities.push(this);
	}

	addComponent(component) {
		this.components.push(component);
		return this;
	}

	getComponent(name) {
		return this.components.find(
			component => component.constructor.name === name
		);
	}
}

const Assets = {
	'character:slime:lime': {
		source: 'sprites/slime_16_16_2.png',
		unitWidth: 64,
		unitHeight: 44
	},
	'block:prototype:64': {
		source: 'sprites/tile_64.png',
		unitWidth: 64,
		unitHeight: 64
	}
};

class Texture {
	constructor(name) {
		this.asset = Assets[name];
		this.image = new Image();
		this.image.addEventListener('load', () => (this.loaded = true), false);
		this.image.src = `./assets/${this.asset.source}`;
		this.loaded = false;
	}

	draw(
		context,
		sx = 0,
		sy = 0,
		sw = this.asset.unitWidth,
		sh = this.asset.unitHeight,
		dx = 0,
		dy = 0,
		dw = this.asset.unitWidth,
		dh = this.asset.unitHeight
	) {
		if (this.loaded) {
			context.drawImage(
				this.image,
				sx,
				sy,
				sw,
				sh,
				dx,
				canvas.height - dh - dy,
				dw,
				dh
			);
		} else {
			this.image.addEventListener('load', () => this.draw(context), false);
		}
	}
}

class SpriteComponent extends Component {
	constructor(name, options = { source: {}, destination: {} }) {
		super();
		this.source = new Bounds(options.source);
		this.destination = new Bounds(options.destination);
		this.texture = new Texture(name);
	}

	get width() {
		return this.source.width || this.texture.asset.unitWidth;
	}

	get height() {
		return this.source.height || this.texture.asset.unitHeight;
	}

	onDraw(context) {
		this.texture.draw(
			context,
			this.source.x,
			this.source.y,
			this.source.width || this.texture.asset.unitWidth,
			this.source.height || this.texture.asset.unitHeight,
			this.destination.x,
			this.destination.y,
			this.destination.width || this.texture.asset.unitWidth,
			this.destination.height || this.texture.asset.unitHeight
		);
	}
}

class SpriteAnimationComponent extends SpriteComponent {
	constructor(src, options = { source: {}, destination: {}, animationFrames }) {
		super(src, options);
		this.frame = parseInt(Math.random() * 10);
		this.animationFrame = 0;
		this.maxAnimationFrames = options.animationFrames || 1;
	}

	onDraw(context) {
		this.source.x = this.animationFrame * this.width;
		super.onDraw(context);
		this._nextFrame();
	}

	_nextFrame() {
		if (this.frame > 30) {
			this.animationFrame = (this.animationFrame + 1) % this.maxAnimationFrames;
			this.frame = 0;
		}
		this.frame++;
	}
}

new Entity().addComponent(
	new SpriteAnimationComponent('character:slime:lime', {
		source: {
			x: 0,
			y: 0
		},
		destination: {
			x: 64,
			y: 64
		},
		animationFrames: 2
	})
);

new Entity().addComponent(
	new SpriteComponent('block:prototype:64', {
		source: {
			x: 0,
			y: 0
		},
		destination: {
			x: 64,
			y: 0
		}
	})
);

(function () {
	callComponentMethod = (name, ...args) => {
		return entity =>
			entity.components.forEach(component => component[name](...args));
	};

	start = () => {
		entities.forEach(callComponentMethod('onInit'));
		loop();
	};

	loop = () => {
		context.fillStyle = '#FF0000';
		context.fillRect(0, 0, canvas.width, canvas.height);

		entities.forEach(callComponentMethod('beforeDraw', context));
		entities.forEach(callComponentMethod('onDraw', context));
		entities.forEach(callComponentMethod('afterDraw', context));

		window.requestAnimationFrame(loop);
	};

	return start();
})();
