window.entities = [];
/** @type HTMLCanvasElement*/
const canvas = document.getElementById('main-canvas');
const context = canvas.getContext('2d');

class Vector2 {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	get magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	sub(other) {
		return new Vector2(this.x - other.x, this.y - other.y);
	}

	divide(number) {
		return new Vector2(this.x / number, this.y / number);
	}

	distance(other) {
		return Math.sqrt(
			(this.x - other.x) * (this.x - other.x) +
				(this.y - other.y) * (this.y - other.y)
		);
	}

	normalize() {
		const magnitude = this.magnitude;
		if (magnitude !== 0) {
			return this.divide(magnitude);
		}
		return this;
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
	update(_delta) {}
	beforeDraw(_context, delta) {}
	onDraw(_context, delta) {}
	afterDraw(_context, delta) {}
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

class SpriteAnimation {
	constructor(frames, name) {
		this.frames = frames;
		this.name = name;
		this.loop = false;
		this.frameNumber = 0;
		this.timeSpent = 0;
		this.speed = 1;
		this.animationSpeed = 1;
	}

	get duration() {
		return this.frames[this.frameNumber].duration;
	}

	get frame() {
		return this.frames[this.frameNumber].frame;
	}

	reset() {
		this.frameNumber = 0;
		this.timeSpent = 0;
		return this.frame;
	}

	progress(delta) {
		this.timeSpent += delta * this.animationSpeed;
		if (this.timeSpent < this.duration) return this.frame;

		this.frameNumber++;
		this.timeSpent = 0;
		if (this.frameNumber >= this.frames.length) {
			this.reset();
			return this.loop ? this.frame : undefined;
		}
		return this.frame;
	}
}

class AnimatedSpriteComponent extends SpriteComponent {
	constructor(assetName) {
		super(assetName);
		this.asset = AnimatedAssets[assetName];
		this.defaultAnimation = new SpriteAnimation(
			this.asset.frames['IDLE'],
			'IDLE'
		);
		this.animations = Object.keys(this.asset.frames).map(
			key => new SpriteAnimation(this.asset.frames[key], key)
		);
		this.animation = this.defaultAnimation;
	}

	_playAnimation(name, loop = false) {
		this.animation = this.animations.find(animation => animation.name === name);
		this.animation.loop = loop;
		this.animation.reset();
	}

	playAnimationOnce(name) {
		this._playAnimation(name);
	}

	playAnimationLoop(name) {
		this._playAnimation(name, true);
	}

	stopAnimation() {
		this.animation = undefined;
	}

	onDraw(context, delta) {
		this.frame = this.animation.progress(delta);
		if (!this.frame) {
			this.animation = this.defaultAnimation;
			this.frame = this.animation.reset();
		}

		this.source.x = this.frame.x;
		this.source.y = this.frame.y;
		this.source.width = this.frame.w;
		this.source.height = this.frame.h;
		super.onDraw(context);
	}
}

class SlimeControllerComponent extends Component {
	constructor(speed = 100) {
		super();
		this.speed = speed;
		this.target = undefined;
		this.lastTargetReachedTime = 0;
	}

	onInit() {
		this.animatedSprite = this.entity.getComponent('AnimatedSpriteComponent');
	}

	update(time, delta) {
		if (this.target) {
			const reached = this.moveToTarget(delta);
			if (reached) {
				this.target = undefined;
				this.lastTargetReachedTime = time;
				this.animatedSprite.playAnimationOnce('ATTACKING');
			}
		} else if (this.canFindTarget(time)) {
			this.animatedSprite.playAnimationLoop('WALKING');
			this.target = new Vector2(
				parseInt(Math.random() * (canvas.width - this.animatedSprite.width)),
				this.position.y
			);
		}
		this.animatedSprite.animationSpeed = this.speed / 100.0;
	}

	moveToTarget(delta) {
		const direction = this.target.sub(this.position).normalize();
		const directionalDistance = delta * this.speed * direction.x;
		const distanceToTarget = this.position.distance(this.target);
		this.position.x += MathExt.clamp(
			directionalDistance,
			-distanceToTarget,
			distanceToTarget
		);

		return Math.abs(directionalDistance) >= Math.abs(distanceToTarget);
	}

	canFindTarget(time) {
		return (
			this.animatedSprite.animation.name === 'IDLE' &&
			time - this.lastTargetReachedTime > this.restTime()
		);
	}

	restTime() {
		return Math.random() * 2500 + 1000;
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
				new SpriteComponent('block:prototype_64')
			);
		}
		new Entity(64, 64)
			.addComponent(new SlimeControllerComponent())
			.addComponent(new AnimatedSpriteComponent('character:slime'));

		entities.forEach(callComponentMethod('onInit'));
		loop();
	};

	let lastUpdate = 0;

	const loop = (timeSinceStart = 0) => {
		const delta = timeSinceStart - lastUpdate;
		context.fillStyle = 'lightblue';
		context.fillRect(0, 0, canvas.width, canvas.height);

		entities.forEach(
			callComponentMethod('update', timeSinceStart, delta / 1e3)
		);
		entities.forEach(callComponentMethod('beforeDraw', context, delta));
		entities.forEach(callComponentMethod('onDraw', context, delta));
		entities.forEach(callComponentMethod('afterDraw', context, delta));

		lastUpdate = timeSinceStart;
		window.requestAnimationFrame(loop);
	};

	return start();
})();
