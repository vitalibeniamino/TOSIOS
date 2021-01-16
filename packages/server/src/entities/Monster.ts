import { Circle, ICircle } from './Circle';
import { Constants, Maths, Models } from '@tosios/common';
import { MapSchema, type } from '@colyseus/schema';
import { Player } from '.';

export interface IMonster extends ICircle {
    type: Models.MonsterType;
    mapWidth: number;
    mapHeight: number;
    lives: number;
}

export class Monster extends Circle {
    //
    // Sync fields
    //
    @type('string')
    private type: Models.MonsterType;

    @type('string')
    private state: Models.MonsterState;

    //
    // Local fields
    //
    private mapWidth: number;

    private mapHeight: number;

    private lives: number = 0;

    private lastActionAt: number = Date.now();

    private lastAttackAt: number = Date.now();

    private idleDuration: number = 0;

    private patrolDuration: number = 0;

    private targetPlayerId: string = null;

    //
    // Lifecycle
    //
    constructor(attributes: IMonster) {
        super(attributes);

        this.type = attributes.type;
        this.state = 'idle';
        this.mapWidth = attributes.mapWidth;
        this.mapHeight = attributes.mapHeight;
        this.lives = attributes.lives;
    }

    //
    // Update
    //
    update(players: MapSchema<Player>) {
        switch (this.state) {
            case 'idle':
                this.updateIdle(players);
                break;
            case 'patrol':
                this.updatePatrol(players);
                break;
            case 'chase':
                this.updateChase(players);
                break;
            default:
                break;
        }
    }

    updateIdle(players: MapSchema<Player>) {
        // Look for a player to chase
        if (this.lookForPlayer(players)) {
            return;
        }

        // Is state over?
        const delta = Date.now() - this.lastActionAt;
        if (delta > this.idleDuration) {
            this.startPatrol();
        }
    }

    updatePatrol(players: MapSchema<Player>) {
        // Look for a player to chase
        if (this.lookForPlayer(players)) {
            return;
        }

        // Is state over?
        const delta = Date.now() - this.lastActionAt;
        if (delta > this.patrolDuration) {
            this.startIdle();
            return;
        }

        // Move monster
        this.move(Constants.MONSTER_SPEED_PATROL, this.rotation);

        // Is the monster out of bounds?
        if (
            this.x < Constants.TILE_SIZE ||
            this.x > this.mapWidth - Constants.TILE_SIZE ||
            this.y < Constants.TILE_SIZE ||
            this.y > this.mapHeight - Constants.TILE_SIZE
        ) {
            this.x = Maths.clamp(this.x, 0, this.mapWidth);
            this.y = Maths.clamp(this.y, 0, this.mapHeight);
            this.rotation = Maths.getRandomInt(-3, 3);
        }
    }

    updateChase(players: MapSchema<Player>) {
        // Did player disconnect or die?
        const player = getPlayerFromId(this.targetPlayerId, players);
        if (!player || !player.isAlive) {
            this.startIdle();
            return;
        }

        // Did player run away?
        const distance = Maths.getDistance(this.x, this.y, player.x, player.y);
        if (distance > Constants.MONSTER_SIGHT) {
            this.startIdle();
            return;
        }

        // Move toward player
        this.rotation = Maths.calculateAngle(player.x, player.y, this.x, this.y);
        this.move(Constants.MONSTER_SPEED_CHASE, this.rotation);
    }

    //
    // Start
    //
    startIdle() {
        this.state = 'idle';
        this.rotation = 0;
        this.targetPlayerId = null;
        this.idleDuration = Maths.getRandomInt(
            Constants.MONSTER_IDLE_DURATION_MIN,
            Constants.MONSTER_IDLE_DURATION_MAX,
        );
        this.lastActionAt = Date.now();
    }

    startPatrol() {
        this.state = 'patrol';
        this.targetPlayerId = null;
        this.patrolDuration = Maths.getRandomInt(
            Constants.MONSTER_PATROL_DURATION_MIN,
            Constants.MONSTER_PATROL_DURATION_MAX,
        );
        this.rotation = Maths.getRandomInt(-3, 3);
        this.lastActionAt = Date.now();
    }

    startChase(playerId: string) {
        this.state = 'chase';
        this.targetPlayerId = playerId;
        this.lastActionAt = Date.now();
    }

    //
    // Methods
    //
    lookForPlayer(players: MapSchema<Player>): boolean {
        // if (!this.targetPlayerId) {
        //     const playerId = getClosestPlayerId(this.x, this.y, players);
        //     if (playerId) {
        //         this.startChase(playerId);
        //         return true;
        //     }
        // }

        return false;
    }

    hurt() {
        this.lives -= 1;
    }

    move(speed: number, rotation: number) {
        this.x += Math.cos(rotation) * speed;
        this.y += Math.sin(rotation) * speed;
    }

    attack() {
        this.lastAttackAt = Date.now();
    }

    //
    // Getters
    //
    get isAlive(): boolean {
        return this.lives > 0;
    }

    get canAttack(): boolean {
        const delta = Math.abs(this.lastAttackAt - Date.now());
        return this.state === 'chase' && delta > Constants.MONSTER_ATTACK_BACKOFF;
    }
}

//
// Utils
//
function getPlayerFromId(id: string, players: MapSchema<Player>): Player | null {
    return players.get(id);
}

function getClosestPlayerId(x: number, y: number, players: MapSchema<Player>): string | null {
    let selectedPlayerId = null;

    players.forEach((player, playerId) => {
        if (player.isAlive) {
            const distance = Maths.getDistance(x, y, player.x, player.y);
            if (distance <= Constants.MONSTER_SIGHT) {
                selectedPlayerId = playerId;
            }
        }
    });

    return selectedPlayerId;
}
