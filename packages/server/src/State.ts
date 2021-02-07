import { Bullet, Circle, Game, Monster, Player, Prop } from './entities';
import { Collisions, Constants, Geometry, Map, Maps, Maths, Models } from '@tosios/common';
import { MapSchema, Schema, type } from '@colyseus/schema';
import { MonsterType, PropType, TileType, generate } from '@halftheopposite/dungeon';
import { nanoid } from 'nanoid';

export interface GameStateArgs {
    roomName: string;
    maxPlayers: number;
    onMessage: (message: Models.MessageJSON) => void;
}

export class GameState extends Schema {
    //
    // Sync fields
    //
    @type(Game)
    public game: Game;

    @type({ map: Player })
    public players: MapSchema<Player> = new MapSchema<Player>();

    @type({ map: Monster })
    public monsters: MapSchema<Monster> = new MapSchema<Monster>();

    @type({ map: Prop })
    public props: MapSchema<Prop> = new MapSchema<Prop>();

    @type({ map: Bullet })
    public bullets: MapSchema<Bullet> = new MapSchema<Bullet>();

    //
    // Local fields
    //
    private map: Map.DungeonMap = new Map.DungeonMap(Constants.TILE_SIZE);

    private actions: Models.ActionJSON[] = [];

    private onMessage: (message: Models.MessageJSON) => void = null;

    //
    // Lifecycle
    //
    constructor(args: GameStateArgs) {
        super();

        // Game
        this.game = new Game({
            state: 'lobby',
            roomName: args.roomName,
            maxPlayers: args.maxPlayers,
            stateEndsAt: Date.now() + 1000 * 5,
            onLobbyStart: this.handleLobbyStart,
            onGameStart: this.handleGameStart,
            onGameEnd: this.handleGameEnd,
        });

        // Callbacks
        this.onMessage = args.onMessage;
    }

    //
    // Updates
    //
    update = () => {
        this.updateGame();

        if (this.game.state === 'game') {
            this.updateActions();
            this.updatePlayers();
            this.updateMonsters();
            this.updateProps();
            this.updateBullets();
        }
    };

    private updateGame = () => {
        this.game.update(this.players);
    };

    private updateActions = () => {
        let action: Models.ActionJSON;

        while (this.actions.length > 0) {
            action = this.actions.shift();

            switch (action.type) {
                case 'move':
                    this.playerMove(action.playerId, action.ts, action.value);
                    break;
                case 'rotate':
                    this.playerRotate(action.playerId, action.ts, action.value.rotation);
                    break;
                case 'shoot':
                    this.playerShoot(action.playerId, action.ts, action.value.angle);
                    break;
                default:
                    break;
            }
        }
    };

    private updatePlayers = () => {
        this.players.forEach((player, playerId) => {
            this.playerUpdate(playerId);
        });
    };

    private updateMonsters = () => {
        this.monsters.forEach((monster, monsterId) => {
            this.monsterUpdate(monsterId);
        });
    };

    private updateProps = () => {
        this.props.forEach((prop, propId) => {
            this.propUpdate(propId);
        });
    };

    private updateBullets = () => {
        this.bullets.forEach((bullet, bulletId) => {
            this.bulletUpdate(bulletId);
        });
    };

    //
    // Game
    //
    private resetGame = () => {
        // Reset current states
        this.map.clearDungeon();
        this.monstersClear();
        this.propsClear();
        this.bulletsClear();

        // 1. Create dungeon
        const seed = nanoid();
        // TODO: This can fail, retry if so.
        const dungeon = generate({
            ...Maps.DEFAULT_DUNGEON,
            seed,
        });

        this.game.seed = seed;
        this.map.loadDungeon(dungeon, ['tiles', 'props', 'monsters']);

        // 2. Create monsters
        const monstersItems = this.map.listItemsByLayer('monsters');
        monstersItems.forEach((item) => {
            const monster = new Monster({
                id: item.id,
                x: item.x,
                y: item.y,
                radius: item.w / 2,
                rotation: 0,
                type: item.type as MonsterType,
                state: 'idle',
                lives: Constants.MONSTER_LIVES,
            });

            this.monsters.set(item.id, monster);
        });

        // 3. Create props
        const propsItems = this.map.listItemsByLayer('props');
        propsItems.forEach((item) => {
            const prop = new Prop({
                id: item.id,
                x: item.x,
                y: item.y,
                radius: item.w / 2,
                rotation: 0,
                type: item.type as PropType,
                lives: Collisions.HURTABLE_PROPS.includes(item.type as PropType) ? Constants.PROP_LIVES : undefined,
            });

            this.props.set(item.id, prop);
        });

        // 4. Players
        const ladder = this.getLadderCoord();
        this.players.forEach((player) => {
            player.setPosition(ladder.x, ladder.y);
            this.map.addItem(player.x, player.y, player.width, player.height, 'players', player.type, player.id);
        });
    };

    private handleLobbyStart = () => {};

    private handleGameStart = () => {
        this.resetGame();
        this.setPlayersActive(true);
        this.onMessage({
            type: 'start',
            from: 'server',
            ts: Date.now(),
            params: {},
        });
    };

    private handleGameEnd = () => {
        this.setPlayersActive(false);
        this.onMessage({
            type: 'stop',
            from: 'server',
            ts: Date.now(),
            params: {},
        });
    };

    //
    // Players
    //
    playerAdd = (playerId: string, name: string) => {
        const ladder = this.getLadderCoord();
        const player = new Player({
            id: playerId,
            x: ladder.x,
            y: ladder.y,
            radius: Constants.PLAYER_SIZE / 2,
            rotation: 0,
            type: Models.PlayerType.Wizard,
            name: name || playerId,
            lives: 0,
            maxLives: Constants.PLAYER_MAX_LIVES,
            money: 0,
        });
        this.players.set(playerId, player);
        this.map.addItem(player.x, player.y, player.width, player.height, 'players', player.type, player.id);

        // Broadcast message to other players
        this.onMessage({
            type: 'joined',
            from: 'server',
            ts: Date.now(),
            params: {
                name: this.players.get(playerId).name,
            },
        });
    };

    playerUpdate = (playerId: string) => {
        const player = this.players.get(playerId);
        if (!player || !player.isAlive) {
            return;
        }

        //
        // Collisions: Traps
        //
        const trapsProps = this.map.collidesById(player.id, ['props'], Collisions.TRAP_PROPS);
        if (trapsProps.length > 0) {
            trapsProps.forEach((item) => {
                const prop = this.props.get(item.id);
                if (!prop) {
                    return;
                }

                // Trigger
                if (prop.canActivate()) {
                    prop.activate();
                }

                // Hurt
                if (prop.canHurt() && player.canBeHurt()) {
                    player.hurt();
                }
            });
        }

        //
        // Collisions: Pickables
        //
        const pickableProps = this.map.collidesById(player.id, ['props'], Collisions.PICKABLE_PROPS);
        if (pickableProps.length > 0) {
            const toRemove = [];
            pickableProps.forEach((item) => {
                // Health
                if (player.canBeHeal() && Collisions.HEALABLE_PROPS.includes(item.type as PropType)) {
                    player.heal();
                    toRemove.push(item.id);
                }

                // Money
                if (Collisions.MONEY_PROPS.includes(item.type as PropType)) {
                    player.pay();
                    toRemove.push(item.id);
                }
            });

            toRemove.forEach((propId) => {
                this.propRemove(propId);
            });
        }
    };

    playerRemove = (playerId: string) => {
        // Broadcast message to other players
        this.onMessage({
            type: 'left',
            from: 'server',
            ts: Date.now(),
            params: {
                name: this.players.get(playerId).name,
            },
        });

        this.map.removeItem(playerId);
        this.players.delete(playerId);
    };

    //
    // Actions
    //
    playerPushAction = (action: Models.ActionJSON) => {
        this.actions.push(action);
    };

    private playerMove = (playerId: string, ts: number, dir: Geometry.Vector2) => {
        const player = this.players.get(playerId);
        if (!player || dir.empty) {
            return;
        }

        player.move(dir.x, dir.y, Constants.PLAYER_SPEED);
        this.map.updateItem(player.id, player.x, player.y);

        //
        // Collisions: Walls
        //
        const collidingWalls = this.map.collidesById(player.id, ['tiles'], Collisions.PLAYER_TILES);
        if (collidingWalls.length > 0) {
            const corrected = this.map.collideAndCorrectById(player.id, ['tiles'], Collisions.PLAYER_TILES);
            player.setPosition(corrected.x, corrected.y);
            this.map.updateItem(player.id, player.x, player.y);
        }

        //
        // Collisions: Props
        //
        const collidingProps = this.map.collidesById(player.id, ['props'], Collisions.PLAYER_PROPS);
        if (collidingProps.length > 0) {
            const corrected = this.map.collideAndCorrectById(player.id, ['props'], Collisions.PLAYER_PROPS);
            player.setPosition(corrected.x, corrected.y);
            this.map.updateItem(player.id, player.x, player.y);
        }

        // Acknowledge last treated action
        player.ack = ts;
    };

    private playerRotate = (playerId: string, ts: number, rotation: number) => {
        const player = this.players.get(playerId);
        if (!player) {
            return;
        }

        player.setRotation(rotation);
    };

    private playerShoot = (playerId: string, ts: number, angle: number) => {
        const player = this.players.get(playerId);
        if (!player || !player.isAlive || this.game.state !== 'game') {
            return;
        }

        // Check if player can shoot
        const delta = ts - player.lastShootAt;
        if (player.lastShootAt && delta < Constants.BULLET_RATE) {
            return;
        }
        player.lastShootAt = ts;

        // Make the bullet start at the staff
        const bulletX = player.x + Math.cos(angle) * Constants.PLAYER_WEAPON_SIZE;
        const bulletY = player.y + Math.sin(angle) * Constants.PLAYER_WEAPON_SIZE;

        const bulletId = this.map.addItem(
            bulletX,
            bulletY,
            Constants.BULLET_SIZE * 2,
            Constants.BULLET_SIZE * 2,
            'projectiles',
            Models.BulletType.Magic,
        );
        const bullet = new Bullet({
            id: bulletId,
            x: bulletX,
            y: bulletY,
            radius: Constants.BULLET_SIZE,
            rotation: angle,
            type: Models.BulletType.Magic,
            playerId,
            shotAt: Date.now(),
        });
        this.bullets.set(bulletId, bullet);
    };

    //
    // Monsters
    //
    private monsterUpdate = (monsterId: string) => {
        const monster = this.monsters.get(monsterId);
        if (!monster || !monster.isAlive) {
            return;
        }

        // Update monster
        monster.update(this.map);
        this.map.updateItem(monster.id, monster.x, monster.y);
    };

    private monsterRemove = (monsterId: string) => {
        this.map.removeItem(monsterId);
        this.monsters.delete(monsterId);
    };

    private monstersClear = () => {
        const ids = Array.from(this.monsters.keys());
        ids.forEach(this.monsterRemove);
    };

    //
    // Props
    //
    private propUpdate = (propId: string) => {
        const prop = this.props.get(propId);
        if (!prop.toX || !prop.toY) {
            return;
        }

        const distance = Maths.getDistance(prop.x, prop.y, prop.toX, prop.toY);
        if (distance === 0) {
            return;
        }

        if (distance > 0.1) {
            prop.setPosition(Maths.lerp(prop.x, prop.toX, 0.3), Maths.lerp(prop.y, prop.toY, 0.3));
        } else {
            prop.setPosition(prop.toX, prop.toY);
        }

        this.map.updateItem(propId, prop.x, prop.y);
    };

    private propRemove = (propId: string) => {
        this.map.removeItem(propId);
        this.props.delete(propId);
    };

    private propsClear = () => {
        const ids = Array.from(this.props.keys());
        ids.forEach(this.propRemove);
    };

    //
    // Bullets
    //
    private bulletUpdate = (bulletId: string) => {
        const bullet = this.bullets[bulletId];
        if (!bullet) {
            return;
        }

        bullet.move(Constants.BULLET_SPEED);
        this.map.updateItem(bulletId, bullet.x, bullet.y);

        //
        // Collisions: Out of map
        //
        if (this.isOutOfMap(bullet.x, bullet.y)) {
            this.bulletRemove(bulletId);
            return;
        }

        //
        // Collisions: Monsters
        //
        const collidingMonsters = this.map.collidesById(bullet.id, ['monsters']);
        if (collidingMonsters.length > 0) {
            collidingMonsters.forEach((item) => {
                const monster = this.monsters[item.id];
                if (!monster) {
                    return;
                }

                monster.hurt();
                if (!monster.isAlive) {
                    this.spawnMonsterDrops(monster);
                    this.monsterRemove(monster.id);
                }
            });

            this.bulletRemove(bulletId);
            return;
        }

        //
        // Collisions: Walls
        //
        const collidingWalls = this.map.collidesById(bullet.id, ['tiles'], [TileType.Wall]);
        if (collidingWalls.length > 0) {
            this.bulletRemove(bulletId);
            return;
        }

        //
        // Collisions: Props
        //
        const collidingProps = this.map.collidesById(bullet.id, ['props'], Collisions.BULLET_PROPS);
        if (collidingProps.length > 0) {
            collidingProps.forEach((item) => {
                if (!Collisions.HURTABLE_PROPS.includes(item.type as PropType)) {
                    return;
                }

                const prop = this.props[item.id];
                if (!prop) {
                    return;
                }

                prop.hurt();

                if (!prop.isAlive) {
                    this.spawnCrateDrops(prop);
                    this.propRemove(prop.id);
                }
            });

            this.bulletRemove(bulletId);
        }
    };

    private bulletRemove = (bulletId: string) => {
        this.map.removeItem(bulletId);
        this.bullets.delete(bulletId);
    };

    private bulletsClear = () => {
        const ids = Array.from(this.bullets.keys());
        ids.forEach(this.bulletRemove);
    };

    //
    // Utils
    //
    private getLadderCoord(): { x: number; y: number } {
        const ladders = this.map.listItemsByLayerAndType('props', PropType.Ladder);

        if (ladders.length > 0) {
            return ladders[0];
        }

        return { x: 0, y: 0 };
    }

    private isOutOfMap(x: number, y: number): boolean {
        return x < 0 || y < 0 || x > this.map.width * Constants.TILE_SIZE || y > this.map.height * Constants.TILE_SIZE;
    }

    private setPlayersActive(active: boolean) {
        if (active) {
            this.players.forEach((player) => {
                player.lives = player.maxLives;
                player.money = 0;
                player.ack = 0;
            });
        } else {
            this.players.forEach((player) => {
                player.lives = 0;
            });
        }
    }

    private spawnMonsterDrops(prop: Prop) {
        const coinsCount = Maths.getRandomInt(0, 2);
        this.spawnProps(prop, PropType.Coin, coinsCount, Constants.PROP_COIN_SIZE, Constants.PROP_DROP_RADIUS);
    }

    private spawnCrateDrops(prop: Prop) {
        const coinsCount = Maths.getRandomInt(1, 3);
        const healthCount = Maths.getRandomInt(0, 1);
        this.spawnProps(prop, PropType.Coin, coinsCount, Constants.PROP_COIN_SIZE, Constants.PROP_DROP_RADIUS);
        this.spawnProps(prop, PropType.HealthSmall, healthCount, Constants.TILE_SIZE, Constants.PROP_DROP_RADIUS);
    }

    private spawnProps(circle: Circle, propType: PropType, count: number, propSize: number, spawnRadius: number) {
        // Recursively finds a valid position to spawn a prop
        const pointInDisk = (iterations: number) => {
            // If we have done too many recursive calls, we force the position
            if (iterations === 0) {
                return { x: circle.x, y: circle.y };
            }

            const point = Maths.randomPointInDisk(circle.x, circle.y, spawnRadius);
            const item: Map.Item = {
                id: '',
                x: Math.floor(point.x),
                y: Math.floor(point.y),
                w: propSize,
                h: propSize,
                layer: 'props',
                type: propType,
            };

            const collides = this.map.collidesByItem(item, ['tiles', 'props']);

            // If the prop collides, retry a new random position
            if (collides.length > 0) {
                return pointInDisk(iterations - 1);
            }

            return point;
        };

        for (let i = 0; i < count; i++) {
            const point = pointInDisk(10);
            const propId = this.map.addItem(circle.x, circle.y, propSize, propSize, 'props', propType);
            const prop = new Prop({
                id: propId,
                x: circle.x,
                y: circle.y,
                rotation: 0,
                radius: propSize / 2,
                type: propType,
                toX: point.x,
                toY: point.y,
            });
            this.props.set(propId, prop);
        }
    }
}
