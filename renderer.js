window.entities = [];
window.classes = [];
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

	add(other) {
		return new Vector2(this.x + other.x, this.y + other.y);
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
	constructor(position) {
		this.transform = new Transform(position);
		this._hasInit = false;
		this._entity = undefined;
		if (!Component._entities[this.constructor.name]) {
			Component._entities[this.constructor.name] = [];
		}
	}

	static get entities() {
		return Component._entities[this.prototype.constructor.name];
	}

	get entities() {
		return Component._entities[this.constructor.name];
	}

	set entity(entity) {
		Component._entities[this.constructor.name].push(entity);
		this._entity = entity;
	}

	get entity() {
		return this._entity;
	}

	get position() {
		return this.transform.position;
	}

	onInit() {
		this.transform.parent = this.entity.transform;
		this._hasInit = true;
	}

	afterInit() {}
	update(_delta) {
		if (!this._hasInit) this.onInit();
	}
	beforeDraw(_context, _delta) {}
	onDraw(_context, _delta) {}
	afterDraw(_context, _delta) {}
	onDestroy() {
		const ownerIndex = this.entities.findIndex(
			entity => entity === this.entity
		);
		this.entities.splice(ownerIndex, 1);
	}
}
Component._entities = [];

class Transform {
	constructor(position = Vector2.ZERO) {
		this._position = position;
		this.parent = undefined;
	}

	get position() {
		if (!this.parent) return this._position;
		return this._position.add(this.parent.position);
	}

	set position(position) {
		this._position = position;
	}
}

class Entity {
	constructor(x = 0, y = 0) {
		this.transform = new Transform(new Vector2(x, y));
		this.components = [];
		entities.push(this);
	}

	get position() {
		return this.transform.position;
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

	getComponents(name) {
		return this.components.filter(
			component => component.constructor.name === name
		);
	}

	destroy() {
		this.components.forEach(component => component.onDestroy());
		const index = entities.findIndex(entity => entity === this);
		entities.splice(index, 1);
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
		super.onInit();
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
	constructor(name, animation, options = {}) {
		this.frames = animation.frames;
		this.name = name;
		this.loop = false;
		this.frameNumber = options.frameNumber || 0;
		this.timeSpent = options.timeSpent || 0;
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
			'IDLE',
			this.asset.animations['IDLE'],
			{
				frameNumber: MathExt.randomInt(
					0,
					this.asset.animations['IDLE'].frames.length - 1
				),
				timeSpent: MathExt.randomInt(0, 100)
			}
		);
		this.animations = Object.keys(this.asset.animations).map(
			key => new SpriteAnimation(key, this.asset.animations[key])
		);
		this.animation = this.defaultAnimation;
		this.keys = this.asset.keys;
		this.watched = {};
	}

	watch(key, callback) {
		this.watched[key] = callback;
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
		const currentFrameNumber = this.animation.frameNumber;
		const newFrame = this.animation.progress(delta);
		if (newFrame != this.frame) {
			const endKey = this.keys
				.filter(
					({ animation, time }) =>
						animation === this.animation.name && time === 'end'
				)
				.find(key => key.frame === currentFrameNumber)?.name;
			if (endKey && this.watched[endKey]) this.watched[endKey]();

			const startKey = this.keys
				.filter(
					({ animation, time }) =>
						animation === this.animation.name && time === 'start'
				)
				.find(key => key.frame === this.animation.frameNumber)?.name;
			if (startKey && this.watched[startKey]) this.watched[startKey]();
		}
		this.frame = newFrame;
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

class HitboxComponent extends Component {
	constructor(position, size, style) {
		super();
		this.transform = new Transform(position);
		this.size = size;
		this.style = style || { color: 'yellow' };
	}

	collideWith(other) {
		return (
			this.position.x < other.position.x + other.size.width &&
			this.position.x + this.size.width > other.position.x &&
			this.position.y < other.position.y + other.size.height &&
			this.size.height + this.position.y > other.position.y
		);
	}

	onDraw(context) {
		context.beginPath();
		context.strokeStyle = this.style.color;
		context.rect(
			this.position.x,
			canvas.height - this.size.height - this.position.y,
			this.size.width,
			this.size.height
		);
		context.lineWidth = 3;
		context.stroke();
		context.closePath();
	}
}

class HurtBoxComponent extends HitboxComponent {
	constructor(self, position, size, damage) {
		super(position, size, { color: 'red' });
		this.self = self;
		this.damage = damage;
		this.ignoreSelf = true;
		this.harmedEntities = [];
	}

	update(delta) {
		super.update(delta);
		const hitboxes = entities
			.filter(
				entity =>
					!this.harmedEntities.find(harmedEntity => harmedEntity === entity)
			)
			.filter(entity => (this.ignoreSelf ? entity !== this.self : true))
			.map(entity => entity.getComponent('HitboxComponent'))
			.filter(component => component !== undefined);

		hitboxes
			.filter(hitbox => hitbox.collideWith(this))
			.map(hitbox => hitbox.entity.getComponent('HealthComponent'))
			.filter(component => component !== undefined)
			.forEach(healthComponent => {
				healthComponent.decreaseHealth(this.damage);
				this.harmedEntities.push(healthComponent.entity);
			});
	}
}

class HealthComponent extends Component {
	constructor(baseHealth, maxHealth) {
		super();
		this.baseHealth = baseHealth;
		this.health = baseHealth;
		this.maxHealth = maxHealth ?? baseHealth;
	}

	get percentage() {
		return this.health / this.maxHealth;
	}

	decreaseHealth(amount) {
		this.health = Math.max(this.health - amount, 0);
		if (this.health <= 0) this.die();
	}

	die() {
		this.entity.destroy();
	}

	increaseHealth(amount) {
		this.health = Math.min(this.health + amount, this.maxHealth);
	}
}

class FloatingHealthComponent extends Component {
	constructor(position, width = 64, height = 12) {
		super(position);
		this.width = width;
		this.height = height;
	}

	onInit() {
		super.onInit();
		this.healthComponent = this.entity.getComponent('HealthComponent');
	}

	onDraw(context) {
		super.onDraw(context);
		context.beginPath();
		context.strokeStyle = 'red';
		context.lineWidth = 1;
		context.rect(
			this.position.x,
			canvas.height - this.height - this.position.y,
			this.width,
			this.height
		);
		context.closePath();
		context.stroke();

		context.beginPath();
		context.fillStyle = 'red';
		const width = this.width * this.healthComponent.percentage;
		context.rect(
			this.position.x,
			canvas.height - this.height - this.position.y,
			width,
			this.height
		);
		context.closePath();
		context.fill();
	}
}

class AttackComponent extends Component {
	constructor(attackName, damage, cooldown, bounds) {
		super();
		this.attackName = attackName;
		this.damage = damage;
		this.cooldown = cooldown;
		this.lastAttack = 0;
		this.bounds = new Bounds(bounds);
	}

	onInit() {
		super.onInit();
		this.animatedSprite = this.entity.getComponent('AnimatedSpriteComponent');
		this.duration = this.animatedSprite.animations
			.find(animation => animation.name === this.attackName)
			.frames.reduce((prev, animation) => animation.duration + prev, 0);
		if (this.cooldown === undefined) {
			this.cooldown = this.duration;
		}
	}

	startHurtOn(key) {
		this.animatedSprite.watch(key, () => {
			this.hurtBox = new Entity(this.position.x, this.position.y).addComponent(
				new HurtBoxComponent(
					this.entity,
					new Vector2(this.bounds.x, this.bounds.y),
					{
						width: this.bounds.width,
						height: this.bounds.height
					},
					this.damage
				)
			);
		});
	}

	endHurtOn(key) {
		this.animatedSprite.watch(key, () => {
			this.hurtBox?.destroy();
			this.hurtBox = undefined;
		});
	}

	isAnimationOver() {
		return performance.now() - this.lastAttack >= this.duration;
	}

	canAttack() {
		return performance.now() - this.lastAttack >= this.cooldown;
	}

	attack(force = false) {
		if (force || this.canAttack()) {
			this.animatedSprite.playAnimationOnce(this.attackName);
			this.lastAttack = performance.now();
		}
	}
}

class CharacterController extends Component {
	constructor(speed) {
		super();
		this.speed = speed;
		this.target = undefined;
		this.xOffset = 0;
	}

	onTargetReached() {}
	canFindTarget() {}
	findTarget() {}

	onInit() {
		super.onInit();
		this.animatedSprite = this.entity.getComponent('AnimatedSpriteComponent');
	}

	update(time, delta) {
		super.update(delta);
		if (this.target) {
			const reached = this.moveTowardTarget(delta);
			if (reached) {
				this.target = undefined;
				this.onTargetReached();
			}
		} else if (this.canFindTarget(time)) {
			this.animatedSprite.playAnimationLoop('WALKING');
			this.target = this.findTarget();
		}
		this.animatedSprite.animationSpeed = this.speed / 100.0;
	}

	moveTowardTarget(delta) {
		const targetPosition = new Vector2(
			this.target.position.x + this.xOffset,
			this.entity.position.y
		);
		const direction = targetPosition.sub(this.entity.position).normalize();
		const directionalDistance = delta * this.speed * direction.x;
		const distanceToTarget = this.entity.position.distance(targetPosition);
		this.entity.position.x += MathExt.clamp(
			directionalDistance,
			-distanceToTarget,
			distanceToTarget
		);

		return Math.abs(directionalDistance) >= Math.abs(distanceToTarget);
	}
}

class EnemyControllerComponent extends CharacterController {
	constructor(speed = 100) {
		super(speed);
		this.xOffset = 32;
	}

	onTargetReached() {
		// @todo : do something
		console.log('Well, now do something');
	}

	canFindTarget() {
		return SlimeControllerComponent.entities?.length > 0;
	}

	findTarget() {
		return SlimeControllerComponent.entities?.[0];
	}
}

class SlimeControllerComponent extends CharacterController {
	constructor(speed = 100) {
		super(speed);
		this.xOffset = -32;
	}

	onInit() {
		super.onInit();
		const attacks = this.entity.getComponents('AttackComponent');
		this.biteAttack = attacks.find(
			attackComponent => attackComponent.attackName === 'ATTACK_BITE'
		);
	}

	afterInit() {
		this.biteAttack.startHurtOn('startBite');
		this.biteAttack.endHurtOn('endBite');
	}

	onTargetReached() {
		this.biteAttack.attack();
	}

	findTarget() {
		let leftestEnemy = undefined;
		let minPositionX = Number.MAX_VALUE;
		EnemyControllerComponent.entities.forEach(entity => {
			if (entity.position.x < minPositionX) {
				minPositionX = entity.position.x;
				leftestEnemy = entity;
			}
		});
		return leftestEnemy;
	}

	canFindTarget() {
		return (
			this.biteAttack.isAnimationOver() &&
			EnemyControllerComponent.entities?.length > 0
		);
	}
}

class EntityBuilder {
	static spawnEntityPrefab(name, transform = { x: 0, y: 0 }) {
		const entityPrefab = EntityPrefab[name];
		if (!entityPrefab) throw Error(`Entity Prefab ${name} cannot be found !`);
		const entity = new Entity(transform.x, transform.y);
		const components = (entityPrefab.components || []).map(component =>
			this.makeComponent(component)
		);
		components.forEach(component => entity.addComponent(component));
		return entity;
	}

	static makeComponent(prefab) {
		const args = (prefab.args || []).map(arg => this.computeArgument(arg));
		return new classes[prefab.name](...args);
	}

	static computeArgument(argument) {
		const clazz = argument._clazz;
		if (!clazz) return argument;
		const args = argument.args.map(arg => this.computeArgument(arg));
		return new classes[clazz](...args);
	}
}

(function initClasses() {
	classes = {
		Vector2,
		Bounds,
		Component,
		Transform,
		Entity,
		Texture,
		SpriteComponent,
		SpriteAnimation,
		AnimatedSpriteComponent,
		HitboxComponent,
		HurtBoxComponent,
		HealthComponent,
		FloatingHealthComponent,
		AttackComponent,
		EnemyControllerComponent,
		SlimeControllerComponent
	};
})();

(function game() {
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
		EntityBuilder.spawnEntityPrefab('slime:static', { x: 324, y: 64 });
		EntityBuilder.spawnEntityPrefab('slime:static', { x: 522, y: 64 });
		EntityBuilder.spawnEntityPrefab('slime:static', { x: 892, y: 64 });

		new Entity(0, 64)
			.addComponent(new SlimeControllerComponent(80))
			.addComponent(new AnimatedSpriteComponent('character:slime'))
			.addComponent(
				new AttackComponent('ATTACK_BITE', 30, 1000, {
					x: 32,
					y: 16,
					width: 48,
					height: 48
				})
			)
			.addComponent(
				new HitboxComponent(new Vector2(0, 0), { width: 64, height: 64 })
			)
			.addComponent(new HealthComponent(100));

		entities.forEach(callComponentMethod('onInit'));
		entities.forEach(callComponentMethod('afterInit'));
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
