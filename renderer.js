window.entities = [];
/** @type HTMLCanvasElement*/
const canvas = document.getElementById('main-canvas');
const context = canvas.getContext('2d');

class Vector2 {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	static ZERO = new Vector2(0, 0);
	static ONE = new Vector2(1, 1);
	static UP = new Vector2(0, 1);
	static RIGHT = new Vector2(1, 0);
	static DOWN = new Vector2(0, -1);
	static LEFT = new Vector2(-1, 0);
}

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

	get position() {
		return this.entity.transform.position;
	}

	onInit() {}
	beforeDraw(_context) {}
	onDraw(_context) {}
	afterDraw(_context) {}
	onDestroy() {}
}

class Transform {
	constructor(position = Vector2.ZERO) {
		this.position = position;
	}
}

class Entity {
	constructor(x = 0, y = 0) {
		this.transform = new Transform(new Vector2(x, y));
		this.components = [];
		entities.push(this);
	}

	addComponent(component) {
		component.entity = this;
		this.components.push(component);
		return this;
	}

	getComponent(name) {
		return this.components.find(
			component => component.constructor.name === name
		);
	}
}

class Texture {
	constructor(asset) {
		this.asset = asset;
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
	constructor(assetName) {
		super();
		this.asset = Assets[assetName];
		this.source = new Bounds({});
	}

	onInit() {
		this.texture = new Texture(this.asset);
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
			this.width,
			this.height,
			this.position.x,
			this.position.y,
			this.width,
			this.height
		);
	}
}

class AnimatedSpriteComponent extends SpriteComponent {
	constructor(assetName) {
		super(assetName);
		this.asset = AnimatedAssets[assetName];
		this.frame = parseInt(Math.random() * 10);
		this.animationFrame = 0;
		this.maxAnimationFrames = this.asset.frames || 1;
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

(function () {
	const callComponentMethod = (name, ...args) => {
		return entity =>
			entity.components.forEach(component => component[name](...args));
	};

	const start = () => {
		for (let col = 0; col < 10; col++) {
			new Entity(col * 64, 0).addComponent(
				new SpriteComponent('block:prototype:64')
			);
		}
		new Entity(64, 64).addComponent(
			new AnimatedSpriteComponent('character:slime:lime')
		);

		entities.forEach(callComponentMethod('onInit'));
		loop();
	};

	const loop = () => {
		context.fillStyle = 'lightblue';
		context.fillRect(0, 0, canvas.width, canvas.height);

		entities.forEach(callComponentMethod('beforeDraw', context));
		entities.forEach(callComponentMethod('onDraw', context));
		entities.forEach(callComponentMethod('afterDraw', context));

		window.requestAnimationFrame(loop);
	};

	return start();
})();
