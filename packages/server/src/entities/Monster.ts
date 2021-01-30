import { Circle, ICircle } from './Circle';
import { Constants, Geometry, Map, Maths, Models } from '@tosios/common';
import { MonsterType } from '@halftheopposite/dungeon';
import { lineBox } from 'intersects';
import { type } from '@colyseus/schema';

const RANGE = Constants.TILE_SIZE * 4;
const DELAY = 300; // ms

export interface IMonster extends ICircle {
    type: MonsterType;
    state: Models.MonsterState;
    lives: number;
}

export class Monster extends Circle {
    //
    // Sync fields
    //
    @type('number')
    public type: MonsterType;

    @type('string')
    public state: Models.MonsterState;

    //
    // Local fields
    //
    private home: Geometry.Vector2;

    private lives: number = 0;

    private lastActionAt: number = 0;

    private targetedPlayerId: string;

    //
    // Lifecycle
    //
    constructor(attributes: IMonster) {
        super(attributes);

        this.type = attributes.type;
        this.state = attributes.state;
        this.home = new Geometry.Vector2(attributes.x, attributes.y);
        this.lives = attributes.lives;
    }

    //
    // Update
    //
    update(map: Map.DungeonMap) {
        switch (this.state) {
            case 'idle':
                this.updateIdle(map);
                break;
            case 'chase':
                this.updateChase(map);
                break;
            default:
                break;
        }
    }

    updateIdle(map: Map.DungeonMap) {
        // Is the monster ready to check again?
        if (!this.canAct()) {
            return;
        }

        // Are there some players in range?
        const inRange = getPlayersInRange(this, map);
        if (inRange.length === 0) {
            return;
        }

        // Are there some players in sight?
        const inSight = getPlayersInSight(this, map, inRange);
        if (inSight.length === 0) {
            return;
        }

        this.startChase(inSight[0].id);
    }

    updateChase(map: Map.DungeonMap) {
        // Is the targeted player still in range?
        if (!isPlayerInRange(this, map, this.targetedPlayerId)) {
            // If not, we go back to idle state
            this.startIdle();
            return;
        }

        // Is the targeted player still in sight?
        if (!isPlayerInSight(this, map, this.targetedPlayerId)) {
            // If not, we try to find some crumbs that he left over
            this.startIdle(); // TODO: Replace by isCrumbInSight();
            return;
        }

        const player = map.getItem(this.targetedPlayerId);
        this.rotation = Maths.calculateAngle(player.x, player.y, this.x, this.y);
        this.move(Constants.MONSTER_SPEED_CHASE, this.rotation);
    }

    //
    // Start
    //
    startIdle() {
        this.state = 'idle';
        this.targetedPlayerId = null;
        this.rotation = 0;
    }

    startChase(playerId: string) {
        this.state = 'chase';
        this.targetedPlayerId = playerId;
    }

    //
    // Methods
    //
    hurt() {
        this.lives -= 1;
    }

    move(speed: number, rotation: number) {
        this.x = Maths.round2Digits(this.x + Math.cos(rotation) * speed);
        this.y = Maths.round2Digits(this.y + Math.sin(rotation) * speed);
    }

    canAct() {
        if (Date.now() - this.lastActionAt < DELAY) {
            return false;
        }

        this.lastActionAt = Date.now();
        return true;
    }

    //
    // Getters
    //
    get isAlive(): boolean {
        return this.lives > 0;
    }
}

//
// Utils
//

/**
 * Get the players in range.
 */
function getPlayersInRange(monster: Monster, map: Map.DungeonMap): Map.Item[] {
    const rangeItem = createMonsterRangeItem(monster, map);
    const players = map.collidesByItem(rangeItem, ['players']).sort((a, b) => {
        return Maths.getDistance(monster.x, monster.y, a.x, a.y) - Maths.getDistance(monster.x, monster.y, b.x, b.y);
    });

    return players;
}

/**
 * Get the ids of the players in range.
 */
function getPlayersInSight(monster: Monster, map: Map.DungeonMap, players: Map.Item[]): Map.Item[] {
    const item = createMonsterRangeItem(monster, map);
    const walls = map.collidesByItem(item, ['tiles']);

    const inSightPlayers = players.filter((player) => {
        const collidingWalls = walls.filter((wall) =>
            lineBox(monster.x, monster.y, player.x, player.y, wall.x, wall.y, wall.w, wall.h),
        );

        return collidingWalls.length === 0;
    });

    return inSightPlayers;
}

/**
 * Is the player in the monster's range?
 */
function isPlayerInRange(monster: Monster, map: Map.DungeonMap, playerId: string): boolean {
    const players = map.collidesByItem(createMonsterRangeItem(monster, map), ['players']);
    return players.some((player) => player.id === playerId);
}

/**
 * Is the player in the monster's sight?
 */
function isPlayerInSight(monster: Monster, map: Map.DungeonMap, playerId: string): boolean {
    const inRange = getPlayersInRange(monster, map);
    const inSight = getPlayersInSight(monster, map, inRange);
    return inSight.some((player) => player.id === playerId);
}

/**
 * Create a dummy item with the dimensions of it's sighting range.
 */
function createMonsterRangeItem(monster: Monster, map: Map.DungeonMap): Map.Item {
    const mapWidth = map.width * Constants.TILE_SIZE;
    const mapHeight = map.height * Constants.TILE_SIZE;

    return {
        x: Maths.clamp(monster.x - RANGE, 0, mapWidth),
        y: Maths.clamp(monster.y - RANGE, 0, mapHeight),
        w: Maths.clamp(RANGE * 2, 0, mapWidth),
        h: Maths.clamp(RANGE * 2, 0, mapHeight),
        layer: 'monsters',
        type: 0,
        id: 'none',
    };
}
