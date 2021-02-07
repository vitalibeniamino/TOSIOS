import { Application, Container, SCALE_MODES, settings, utils } from 'pixi.js';
import { Bullet, Game, IGame, IPlayer, Monster, Player, Prop } from './entities';
import {
    BulletsManager,
    MonstersManager,
    ParticlesManager,
    PlayersManager,
    PropsManager,
    SoundManager,
} from './managers';
import { Collisions, Constants, Geometry, Map, Maps, Maths, Models } from '@tosios/common';
import { PropType, generate } from '@halftheopposite/dungeon';
import { GUITextures } from './assets/images';
import { Inputs } from './utils/inputs';
import { Viewport } from 'pixi-viewport';
import { drawTiles } from './utils/tiles';

// We don't want to scale textures linearly because they would appear blurry.
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

const ME_ID = 'me';
const MAX_DISTANCE = 0.1;
const ZINDEXES = {
    GROUND: 1,
    PROPS: 2,
    PARTICLES: 3,
    PLAYERS: 4,
    ME: 5,
    MONSTERS: 6,
    BULLETS: 7,
};

// TODO: These two constants should be calculated automatically.
// They are used to interpolate movements of other players for smoothness.
const TOREMOVE_MAX_FPS_MS = 1000 / 60;
const TOREMOVE_AVG_LAG = 50;

export interface GameStats {
    game: IGame;
    players: IPlayer[];
}

export interface IGameState {
    screenWidth: number;
    screenHeight: number;
    onActionSend: (action: Models.ActionJSON) => void;
}

/**
 * The main entrypoint for the game logic on the client-side.
 */
export class GameState {
    //
    // Sync fields
    //
    private game: Game;

    //
    // Local fields
    //
    private app: Application;

    private viewport: Viewport;

    private tilesContainer: Container;

    private playersManager: PlayersManager;

    private monstersManager: MonstersManager;

    private propsManager: PropsManager;

    private bulletsManager: BulletsManager;

    private particlesManager: ParticlesManager;

    private soundManager: SoundManager;

    private onActionSend: (action: Models.ActionJSON) => void;

    private me: Player | null;

    private simulationBody: Geometry.RectangleBody;

    private moveActions: Models.ActionJSON[];

    private inputs: Inputs;

    private map: Map.DungeonMap;

    //
    // Lifecycle
    //
    constructor(attributes: IGameState) {
        this.game = new Game({
            state: 'lobby',
            stateEndsAt: 0,
            roomName: '',
            maxPlayers: 0,
        });

        // App
        this.app = new Application({
            width: attributes.screenWidth,
            height: attributes.screenHeight,
            antialias: false,
            backgroundColor: utils.string2hex(Constants.BACKGROUND_COLOR),
            autoDensity: true,
            resolution: window.devicePixelRatio,
        });

        // Cursor
        const defaultIcon = `url('${GUITextures.crosshairIco}') 32 32, auto`;
        this.app.renderer.plugins.interaction.cursor = 'default';
        this.app.renderer.plugins.interaction.cursorStyles.default = defaultIcon;

        // Viewport
        this.viewport = new Viewport({
            screenWidth: attributes.screenWidth,
            screenHeight: attributes.screenHeight,
        });
        this.viewport.zoomPercent(utils.isMobile.any ? 0.25 : 1.0);
        this.viewport.sortableChildren = true;
        this.app.stage.addChild(this.viewport);

        // Tiles
        this.tilesContainer = new Container();
        this.tilesContainer.zIndex = ZINDEXES.GROUND;
        this.viewport.addChild(this.tilesContainer);

        // Particles
        this.particlesManager = new ParticlesManager();
        this.particlesManager.zIndex = ZINDEXES.PARTICLES;
        this.viewport.addChild(this.particlesManager);

        // Players
        this.playersManager = new PlayersManager();
        this.playersManager.zIndex = ZINDEXES.PLAYERS;
        this.viewport.addChild(this.playersManager);

        // Monsters
        this.monstersManager = new MonstersManager();
        this.monstersManager.zIndex = ZINDEXES.MONSTERS;
        this.viewport.addChild(this.monstersManager);

        // Props
        this.propsManager = new PropsManager();
        this.propsManager.zIndex = ZINDEXES.PROPS;
        this.viewport.addChild(this.propsManager);

        // Bullets
        this.bulletsManager = new BulletsManager();
        this.bulletsManager.zIndex = ZINDEXES.BULLETS;
        this.viewport.addChild(this.bulletsManager);

        // Sound
        this.soundManager = new SoundManager();

        // Callbacks
        this.onActionSend = attributes.onActionSend;

        //
        // Others
        //
        this.me = null;
        this.simulationBody = new Geometry.RectangleBody(0, 0, Constants.PLAYER_SIZE, Constants.PLAYER_SIZE);
        this.moveActions = [];
        this.inputs = new Inputs();
        this.map = new Map.DungeonMap(Constants.TILE_SIZE);
    }

    start = (renderView: any) => {
        renderView.appendChild(this.app.view);
        this.app.start();
        this.app.ticker.add(this.update);
        this.inputs.start();
    };

    private update = () => {
        if (this.game.state === 'game') {
            this.updateInputs();
            this.updatePlayers();
            this.updateMonsters();
            this.updateProps();
            this.updateBullets();
        }
    };

    private updateInputs = () => {
        // Move
        const dir = new Geometry.Vector2(0, 0);
        if (this.inputs.up || this.inputs.down || this.inputs.left || this.inputs.right) {
            if (this.inputs.up) {
                dir.y -= 1;
            }

            if (this.inputs.down) {
                dir.y += 1;
            }

            if (this.inputs.left) {
                dir.x -= 1;
            }

            if (this.inputs.right) {
                dir.x += 1;
            }

            if (!dir.empty) {
                this.move(dir);
            }
        }

        // Rotate
        this.rotate();

        // Shoot
        if (this.inputs.shoot) {
            this.shoot();
        }
    };

    private updatePlayers = () => {
        let distance;

        for (const player of this.playersManager.getAll()) {
            // Don't update "me"
            if (this.me && player.id === this.me.id && !player.isGhost) {
                continue;
            }

            distance = Maths.getDistance(player.x, player.y, player.toX, player.toY);
            if (distance === 0) {
                return;
            }

            if (distance > MAX_DISTANCE) {
                player.setPosition(
                    Maths.lerp(player.x, player.toX, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                    Maths.lerp(player.y, player.toY, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                );
            } else {
                player.setPosition(player.toX, player.toY);
            }

            this.map.updateItem(player.id, player.x, player.y);
        }
    };

    private updateMonsters = () => {
        let distance;

        for (const monster of this.monstersManager.getAll()) {
            distance = Maths.getDistance(monster.x, monster.y, monster.toX, monster.toY);
            if (distance === 0) {
                return;
            }

            if (distance > MAX_DISTANCE) {
                monster.setPosition(
                    Maths.lerp(monster.x, monster.toX, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                    Maths.lerp(monster.y, monster.toY, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                );
            } else {
                monster.setPosition(monster.toX, monster.toY);
            }
        }
    };

    private updateProps = () => {
        let distance;

        for (const prop of this.propsManager.getAll()) {
            distance = Maths.getDistance(prop.x, prop.y, prop.toX, prop.toY);
            if (distance === 0) {
                return;
            }

            if (distance > MAX_DISTANCE) {
                prop.setPosition(
                    Maths.lerp(prop.x, prop.toX, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                    Maths.lerp(prop.y, prop.toY, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                );
            } else {
                prop.setPosition(prop.toX, prop.toY);
            }
        }
    };

    private updateBullets = () => {
        const toDelete: string[] = [];

        for (const bullet of this.bulletsManager.getAll()) {
            bullet.move(Constants.BULLET_SPEED);

            //
            // Collisions: Monsters
            //
            const collidingMonsters = this.map.collidesById(bullet.id, ['monsters']);
            if (collidingMonsters.length > 0) {
                toDelete.push(bullet.id);

                // Hurt monsters
                collidingMonsters.forEach((item) => {
                    const monster = this.monstersManager.get(item.id);
                    if (monster) {
                        monster.hurt();
                        this.particlesManager.spawn('hurt', monster);
                    }
                });

                // Impact
                this.particlesManager.spawn('bullet', bullet);
                continue;
            }

            //
            // Collisions: Walls
            //
            const collidingWalls = this.map.collidesById(bullet.id, ['tiles'], Collisions.BULLET_TILES);
            if (collidingWalls.length > 0) {
                toDelete.push(bullet.id);

                // Impact
                this.particlesManager.spawn('bullet', bullet);
                continue;
            }

            //
            // Collisions: Props
            //
            const collidingProps = this.map.collidesById(bullet.id, ['props'], Collisions.BULLET_PROPS);
            if (collidingProps.length > 0) {
                toDelete.push(bullet.id);

                // Hurt props
                collidingProps.forEach((item) => {
                    if (Collisions.HURTABLE_PROPS.includes(item.type as PropType)) {
                        const prop = this.propsManager.get(item.id);
                        if (prop) {
                            prop.hurt();
                            this.particlesManager.spawn('prop', prop);
                        }
                    }
                });

                // Impact
                this.particlesManager.spawn('bullet', bullet);
                continue;
            }

            this.map.updateItem(bullet.id, bullet.x, bullet.y);
        }

        // Delete dead bullets
        toDelete.forEach((bulletId) => {
            const bullet = this.bulletsManager.get(bulletId);
            if (!bullet) {
                return;
            }
            bullet.kill();
            this.bulletsManager.remove(bulletId);
            this.map.removeItem(bulletId);
        });
    };

    stop = () => {
        this.app.ticker.stop();
        this.app.stop();
        this.inputs.stop();
    };

    //
    // Actions
    //
    private move = (dir: Geometry.Vector2) => {
        if (!this.me) {
            return;
        }

        //
        // Action
        //
        const action: Models.ActionJSON = {
            type: 'move',
            ts: Date.now(),
            playerId: this.me.id,
            value: {
                x: dir.x,
                y: dir.y,
            },
        };

        // Send the action to the server
        this.onActionSend(action);

        // Save the action for reconciliation
        this.moveActions.push(action);

        //
        // Movements
        //

        // Move the player
        this.me.move(dir.x, dir.y, Constants.PLAYER_SPEED);

        // Compute collisions
        const correctedPosition = this.computePlayerCollisions(this.me);
        this.me.setPosition(correctedPosition.x, correctedPosition.y, true);

        // Update in map
        this.map.updateItem(ME_ID, this.me.x, this.me.y);

        // Play sound
        this.soundManager.play('step');
    };

    private rotate = () => {
        if (!this.me) {
            return;
        }

        // On desktop we compute rotation with player and mouse position
        const screenPlayerPosition = this.viewport.toScreen(this.me.x, this.me.y);
        const mouse = this.app.renderer.plugins.interaction.mouse.global;
        const rotation = Maths.round2Digits(
            Maths.calculateAngle(mouse.x, mouse.y, screenPlayerPosition.x, screenPlayerPosition.y),
        );
        if (this.me.rotation !== rotation) {
            this.me.rotation = rotation;
            this.onActionSend({
                type: 'rotate',
                ts: Date.now(),
                playerId: this.me.id,
                value: {
                    rotation,
                },
            });
        }
    };

    private shoot = () => {
        if (!this.me || !this.me.canShoot()) {
            return;
        }

        this.me.lastShootAt = Date.now();

        //
        // Action
        //
        this.onActionSend({
            type: 'shoot',
            ts: Date.now(),
            playerId: this.me.id,
            value: {
                angle: this.me.rotation,
            },
        });

        //
        // Bullet
        //
        const bulletX = this.me.x + Math.cos(this.me.rotation) * Constants.PLAYER_WEAPON_SIZE;
        const bulletY = this.me.y + Math.sin(this.me.rotation) * Constants.PLAYER_WEAPON_SIZE;
        const bullet = new Bullet(
            {
                id: String(this.me.lastShootAt),
                x: bulletX,
                y: bulletY,
                radius: Constants.BULLET_SIZE,
                rotation: this.me.rotation,
                fromX: bulletX,
                fromY: bulletY,
                playerId: this.me.id,
                type: Models.BulletType.Magic,
                shotAt: this.me.lastShootAt,
            },
            this.particlesManager,
        );
        this.bulletsManager.add(bullet.id, bullet);
        this.map.addItem(bullet.x, bullet.y, bullet.width, bullet.height, 'projectiles', bullet.type, bullet.id);
    };

    //
    // Game
    //
    resetGame = () => {
        if (!this.game.seed) {
            return;
        }

        // 1. Reset current states
        this.map.clearDungeon();
        this.tilesContainer.removeChildren();

        // 2. Create dungeon using seed from server
        const dungeon = generate({
            ...Maps.DEFAULT_DUNGEON,
            seed: this.game.seed,
        });
        this.map.loadDungeon(dungeon, ['tiles']);

        // 3. Load players
        this.playersManager.getAll().forEach((player) => {
            this.map.addItem(player.x, player.y, player.width, player.height, 'players', player.type, player.id);
        });

        if (this.me) {
            this.map.addItem(this.me.x, this.me.y, this.me.width, this.me.height, 'players', this.me.type, ME_ID);
        }

        // 4. Draw dungeon
        drawTiles(dungeon.layers.tiles, this.tilesContainer);
    };

    gameUpdate = (name: string, value: any) => {
        switch (name) {
            case 'state':
                this.game.state = value;
                break;
            case 'stateEndsAt':
                this.game.stateEndsAt = value;
                break;
            case 'roomName':
                this.game.roomName = value;
                break;
            case 'maxPlayers':
                this.game.maxPlayers = value;
                break;
            case 'seed':
                this.game.seed = value;
                this.resetGame();
                break;
            default:
                break;
        }
    };

    //
    // Players
    //
    playerAdd = (playerId: string, attributes: Models.PlayerJSON, isMe: boolean) => {
        const player = new Player(
            { ...attributes, isGhost: isMe },
            { sound: this.soundManager, particles: this.particlesManager },
        );
        this.playersManager.add(playerId, player);
        this.map.addItem(player.x, player.y, player.width, player.height, 'players', player.type, player.id);

        if (isMe) {
            this.me = new Player(
                { ...attributes, isGhost: false },
                { sound: this.soundManager, particles: this.particlesManager },
            );
            this.playersManager.add(ME_ID, this.me);
            this.viewport.follow(this.me.container);

            this.map.addItem(this.me.x, this.me.y, this.me.width, this.me.height, 'players', this.me.type, ME_ID);
        }
    };

    playerUpdate = (playerId: string, attributes: Models.PlayerJSON, isMe: boolean) => {
        const player = this.playersManager.get(playerId);
        if (!player) {
            return;
        }

        // Update the player normally (or the current player's ghost)
        player.lives = attributes.lives;
        player.maxLives = attributes.maxLives;
        player.money = attributes.money;
        player.rotation = attributes.rotation;
        player.setPosition(player.toX, player.toY);
        player.setToPosition(attributes.x, attributes.y);
        this.map.updateItem(playerId, player.x, player.y);

        if (isMe && this.me) {
            this.me.lives = attributes.lives;
            this.me.maxLives = attributes.maxLives;
            this.me.money = attributes.money;

            if (this.me.ack !== attributes.ack && attributes.ack === 0) {
                this.me.setPosition(attributes.x, attributes.y);
                this.map.updateItem(ME_ID, this.me.x, this.me.y);
            }

            //
            // Server reconciliation
            //
            if (this.me.ack !== attributes.ack) {
                this.me.ack = attributes.ack;

                // Slice all actions already acknowledged by server
                const index = this.moveActions.findIndex((action) => action.ts === attributes.ack);
                this.moveActions = this.moveActions.slice(index + 1);

                // Are there remaining actions?
                if (this.moveActions.length > 0) {
                    this.simulationBody.x = attributes.x;
                    this.simulationBody.y = attributes.y;

                    // Run simulation
                    const correctedPosition = this.runActionsSimulation(this.simulationBody, this.moveActions);

                    // Check if our predictions were accurate, if not, force position of user
                    const distance = Maths.getDistance(this.me.x, this.me.y, correctedPosition.x, correctedPosition.y);
                    if (distance > MAX_DISTANCE) {
                        this.me.setPosition(correctedPosition.x, correctedPosition.y);
                        this.map.updateItem(ME_ID, this.me.x, this.me.y);
                    }
                }
            }
        }
    };

    playerRemove = (playerId: string, isMe: boolean) => {
        this.playersManager.remove(playerId);
        this.map.removeItem(playerId);

        if (isMe && this.me) {
            this.playersManager.remove(ME_ID);
            this.map.removeItem(ME_ID);
            this.me = null;
        }
    };

    //
    // Monsters
    //
    monsterAdd = (monsterId: string, attributes: Models.MonsterJSON) => {
        const monster = new Monster(attributes);
        this.monstersManager.add(monsterId, monster);

        // Map
        this.map.addItem(monster.x, monster.y, monster.width, monster.height, 'monsters', monster.type, monster.id);
    };

    monsterUpdate = (monsterId: string, attributes: Models.MonsterJSON) => {
        const monster = this.monstersManager.get(monsterId);
        if (!monster) {
            return;
        }

        monster.rotation = attributes.rotation;
        monster.setPosition(monster.toX, monster.toY);
        monster.setToPosition(attributes.x, attributes.y);

        // Map
        this.map.updateItem(monsterId, monster.toX, monster.toY);
    };

    monsterRemove = (monsterId: string) => {
        const monster = this.monstersManager.get(monsterId);
        if (!monster) {
            return;
        }

        this.monstersManager.remove(monsterId);

        // Map
        this.map.removeItem(monsterId);
    };

    //
    // Props
    //
    propAdd = (propId: string, attributes: Models.PropJSON) => {
        const prop = new Prop(attributes);
        this.propsManager.add(propId, prop);

        // Map
        this.map.addItem(prop.x, prop.y, prop.width, prop.height, 'props', prop.type, prop.id);
    };

    propUpdate = (propId: string, attributes: Models.PropJSON) => {
        const prop = this.propsManager.get(propId);
        if (!prop) {
            return;
        }

        prop.setPosition(prop.toX, prop.toY);
        prop.setToPosition(attributes.x, attributes.y);
        prop.setActivated(attributes.activatedAt);

        // Map
        this.map.updateItem(propId, prop.x, prop.y);
    };

    propRemove = (propId: string) => {
        const prop = this.propsManager.get(propId);
        if (!prop) {
            return;
        }

        this.propsManager.remove(propId);

        // Map
        this.map.removeItem(propId);
    };

    //
    // Bullets
    //
    bulletAdd = (bulletId: string, attributes: Models.BulletJSON) => {
        // We don't want to add our own bullet as we already did
        if (this.me && this.me.id === attributes.playerId) {
            return;
        }

        const bullet = new Bullet(attributes, this.particlesManager);
        this.bulletsManager.add(bulletId, bullet);

        // Map
        this.map.addItem(bullet.x, bullet.y, bullet.width, bullet.height, 'projectiles', bullet.type, bullet.id);
    };

    bulletUpdate = (bulletId: string, attributes: Models.BulletJSON) => {
        const bullet = this.bulletsManager.get(bulletId);
        if (!bullet) {
            return;
        }

        bullet.setPosition(attributes.x, attributes.y);

        // Map
        this.map.updateItem(bulletId, bullet.x, bullet.y);
    };

    bulletRemove = (bulletId: string) => {
        const bullet = this.bulletsManager.get(bulletId);
        if (!bullet) {
            return;
        }
        this.bulletsManager.remove(bulletId);

        // Map
        this.map.removeItem(bulletId);
    };

    //
    // Utils
    //
    private computePlayerCollisions = (player: Player): { x: number; y: number } => {
        let item: Map.Item = {
            x: player.x,
            y: player.y,
            w: player.width,
            h: player.height,
            type: player.type,
            layer: 'players',
            id: player.id,
        };

        //
        // Collisions: Walls
        //
        item = this.map.collideAndCorrectByItem(item, ['tiles'], Collisions.PLAYER_TILES);

        //
        // Collisions: Props
        //
        item = this.map.collideAndCorrectByItem(item, ['props'], Collisions.PLAYER_PROPS);

        return { x: item.x, y: item.y };
    };

    private runActionsSimulation = (
        body: Geometry.RectangleBody,
        actions: Models.ActionJSON[],
    ): { x: number; y: number } => {
        let { x, y } = body;

        actions.forEach((action) => {
            // Move
            const moved = Models.movePlayer(
                { x, y, w: body.width, h: body.height },
                action.value,
                Constants.PLAYER_SPEED,
            );

            // Collide
            const corrected = this.map.collideAndCorrectByItem(
                {
                    x: moved.x,
                    y: moved.y,
                    w: body.width,
                    h: body.height,
                    type: 0,
                    layer: 'players',
                    id: 'none',
                },
                ['tiles'],
            );

            x = corrected.x;
            y = corrected.y;
        });

        return { x, y };
    };

    setScreenSize = (screenWidth: number, screenHeight: number) => {
        this.app.renderer.resize(screenWidth, screenHeight);
        this.viewport.resize(
            screenWidth,
            screenHeight,
            this.map.width * Constants.TILE_SIZE,
            this.map.height * Constants.TILE_SIZE,
        );
    };

    getStats = (): GameStats => {
        const players: IPlayer[] = this.playersManager.getAll().map((player) => ({
            id: player.id,
            x: player.x,
            y: player.y,
            radius: player.body.radius,
            rotation: player.rotation,
            type: player.type,
            name: player.name,
            lives: player.lives,
            maxLives: player.maxLives,
            money: player.money,
            isGhost: player.isGhost,
        }));

        return {
            game: this.game,
            players,
        };
    };
}
