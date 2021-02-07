import { Constants, Models } from '@tosios/common';
import { Effects, PlayerLivesSprite, TextSprite } from '../sprites';
import { Graphics, Sprite, Texture } from 'pixi.js';
import { ParticlesManager, SoundManager } from '../managers';
import { PlayerTextures, WeaponTextures } from '../assets/images';
import { Circle } from '.';

const NAME_OFFSET = 4;
const LIVES_OFFSET = 10;
const HURT_COLOR = 0xff0000;
const HEAL_COLOR = 0x00ff00;
const BULLET_DELAY_FACTOR = 1.1; // Add 10% to delay as server may lag behind sometimes (rarely)
const SMOKE_DELAY = 500;
const DEAD_ALPHA = 0.2;
const ZINDEXES = {
    SHADOW: 0,
    WEAPON_BACK: 1,
    PLAYER: 2,
    WEAPON_FRONT: 3,
    INFOS: 4,
};

export type PlayerDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface IPlayer extends Models.PlayerJSON {
    isGhost: boolean;
}

export class Player extends Circle {
    //
    // Sync fields
    //
    private _type: Models.PlayerType = Models.PlayerType.Wizard;

    private _name: string = '';

    private _lives: number = 0;

    private _maxLives: number = 0;

    private _money: number = 0;

    private _rotation: number = 0;

    public ack?: number;

    //
    // Local fields
    //
    private _isGhost: boolean = false;

    private _direction: PlayerDirection = 'bottom-right';

    private _lastShootAt: number = 0;

    private _toX: number = 0;

    private _toY: number = 0;

    private _weaponSprite: Sprite;

    private _nameTextSprite: TextSprite;

    private _livesSprite: PlayerLivesSprite;

    private _shadow: Graphics;

    private _soundManager: SoundManager;

    private _particlesManager: ParticlesManager;

    private _lastSmokeAt: number = 0;

    //
    // Lifecycle
    //
    constructor(player: IPlayer, managers: { sound: SoundManager; particles: ParticlesManager }) {
        super({
            id: player.id,
            x: player.x,
            y: player.y,
            radius: player.radius,
            rotation: player.rotation,
            textures: getTexture(player.lives),
            zIndex: ZINDEXES.PLAYER,
        });

        // Weapon
        this._weaponSprite = new Sprite(WeaponTextures.staff);
        this._weaponSprite.anchor.set(0, 0.5);
        this._weaponSprite.position.set(player.radius, player.radius);
        this._weaponSprite.zIndex = ZINDEXES.WEAPON_BACK;
        this.container.addChild(this._weaponSprite);

        // Name
        this._nameTextSprite = new TextSprite(player.name, 8, 0.5, 1);
        this._nameTextSprite.position.set(player.radius, -NAME_OFFSET);
        this._nameTextSprite.zIndex = ZINDEXES.INFOS;
        this.container.addChild(this._nameTextSprite);

        // Lives
        this._livesSprite = new PlayerLivesSprite(0.5, 1, 8, player.maxLives, player.lives);
        this._livesSprite.position.set(
            player.radius,
            this._nameTextSprite.y - this._nameTextSprite.height - LIVES_OFFSET,
        );
        this._livesSprite.anchorX = 0.5;
        this._livesSprite.zIndex = ZINDEXES.INFOS;
        this.container.addChild(this._livesSprite);

        // Shadow
        this._shadow = new Graphics();
        this._shadow.zIndex = ZINDEXES.SHADOW;
        this._shadow.pivot.set(0.5);
        this._shadow.beginFill(0x000000, 0.3);
        this._shadow.drawEllipse(player.radius, player.radius * 2, player.radius * 0.7, player.radius * 0.3);
        this._shadow.endFill();
        this.container.addChild(this._shadow);

        // Sort rendering order
        this.container.sortChildren();

        // References to the managers
        this._soundManager = managers.sound;
        this._particlesManager = managers.particles;

        // Player
        this.type = player.type;
        this.toX = player.x;
        this.toY = player.y;
        this.rotation = player.rotation;
        this.name = player.name;
        this.lives = player.lives;
        this.maxLives = player.maxLives;
        this.isGhost = player.isGhost;

        // Ghost
        if (player.isGhost) {
            this.visible = Constants.DEBUG;
            this.container.alpha = 0.5;
        }
    }

    // Methods
    move(dirX: number, dirY: number, speed: number) {
        const { x, y } = Models.movePlayer(
            { x: this.x, y: this.y, w: this.width, h: this.height },
            { x: dirX, y: dirY },
            speed,
        );
        this.setPosition(x, y);
    }

    hurt() {
        Effects.flash(this.sprite, HURT_COLOR, 0xffffff);
        this._particlesManager.spawn('hurt', this);
    }

    heal() {
        Effects.flash(this.sprite, HEAL_COLOR, 0xffffff);
        this._particlesManager.spawn('heal', this);
    }

    updateTextures() {
        const isAlive = this.lives > 0;

        // Player
        this.sprite.alpha = isAlive ? 1 : DEAD_ALPHA;
        this.sprite.textures = isAlive ? PlayerTextures.playerIdleTextures : PlayerTextures.playerDeadTextures;
        this.sprite.anchor.set(0.5);
        this.sprite.width = this.body.width;
        this.sprite.height = this.body.height;
        this.sprite.play();

        // Weapon
        this._weaponSprite.visible = this.isGhost ? isAlive && Constants.DEBUG : isAlive;

        // Name
        this._nameTextSprite.alpha = isAlive ? 1 : DEAD_ALPHA;

        // Lives
        this._livesSprite.alpha = isAlive ? 1 : DEAD_ALPHA;

        // Shadow
        this._shadow.alpha = isAlive ? 1 : DEAD_ALPHA;
    }

    canShoot(): boolean {
        if (!this.isAlive) {
            return false;
        }

        const now: number = Date.now();
        if (now - this.lastShootAt < Constants.BULLET_RATE * BULLET_DELAY_FACTOR) {
            return false;
        }

        this.lastShootAt = now;
        return true;
    }

    spawnSmoke() {
        if (!this.isAlive) {
            return;
        }

        const timeSinceLastSmoke = Date.now() - this._lastSmokeAt;
        if (timeSinceLastSmoke < SMOKE_DELAY) {
            return;
        }
        this._lastSmokeAt = Date.now();
        this._particlesManager.spawn('smoke', this);
    }

    setPosition(x: number, y: number, smoke: boolean = false) {
        this.x = x;
        this.y = y;

        if (smoke) {
            this.spawnSmoke();
        }
    }

    setToPosition(toX: number, toY: number) {
        this.toX = toX;
        this.toY = toY;
    }

    // Setters
    set type(type: Models.PlayerType) {
        this._type = type;
    }

    set toX(toX: number) {
        this._toX = toX;
    }

    set toY(toY: number) {
        this._toY = toY;
    }

    set name(name: string) {
        this._name = name;
        this._nameTextSprite.text = name;
    }

    set lives(lives: number) {
        if (this._lives === lives) {
            return;
        }

        if (lives > this._lives) {
            this.heal();
        } else {
            this.hurt();
        }

        this._lives = lives;
        this._livesSprite.lives = this._lives;
        this.updateTextures();
    }

    set maxLives(maxLives: number) {
        if (this._maxLives === maxLives) {
            return;
        }

        this._maxLives = maxLives;
        this._livesSprite.maxLives = this._maxLives;
        this.updateTextures();
    }

    set money(money: number) {
        if (this._money === money) {
            return;
        }

        if (money > this._money) {
            this._soundManager.play('coin');
        }

        this._money = money;
    }

    set rotation(rotation: number) {
        this._direction = getDirection(rotation);

        switch (this._direction) {
            case 'top-left':
                this.sprite.scale.x = -2;
                this._weaponSprite.zIndex = ZINDEXES.WEAPON_BACK;
                break;
            case 'top-right':
                this.sprite.scale.x = 2;
                this._weaponSprite.zIndex = ZINDEXES.WEAPON_BACK;
                break;
            case 'bottom-left':
                this.sprite.scale.x = -2;
                this._weaponSprite.zIndex = ZINDEXES.WEAPON_FRONT;
                break;
            case 'bottom-right':
                this.sprite.scale.x = 2;
                this._weaponSprite.zIndex = ZINDEXES.WEAPON_FRONT;
                break;
            default:
                break;
        }

        this._rotation = rotation;
        this._weaponSprite.rotation = rotation;
        this.container.sortChildren();
    }

    set isGhost(isGhost: boolean) {
        this._isGhost = isGhost;
    }

    set lastShootAt(lastShootAt: number) {
        this._lastShootAt = lastShootAt;
    }

    // Getters
    get type(): Models.PlayerType {
        return this._type;
    }

    get toX(): number {
        return this._toX;
    }

    get toY(): number {
        return this._toY;
    }

    get name() {
        return this._name;
    }

    get lives() {
        return this._lives;
    }

    get maxLives() {
        return this._maxLives;
    }

    get money() {
        return this._money;
    }

    get rotation() {
        return this._rotation;
    }

    get isGhost() {
        return this._isGhost;
    }

    get lastShootAt() {
        return this._lastShootAt;
    }

    get isAlive() {
        return this._lives > 0;
    }
}

/**
 * Return a texture depending on the number of lives.
 */
const getTexture = (lives: number): Texture[] => {
    return lives > 0 ? PlayerTextures.playerIdleTextures : PlayerTextures.playerDeadTextures;
};

/**
 * Get a direction given a rotation.
 */
function getDirection(rotation: number): PlayerDirection {
    const top = -(Math.PI / 2);
    const right = 0;
    const bottom = Math.PI / 2;

    // Top
    if (rotation < right) {
        if (rotation > top) {
            return 'top-right';
        }

        return 'top-left';
    }

    // Bottom
    if (rotation < bottom) {
        return 'bottom-right';
    }

    return 'bottom-left';
}
