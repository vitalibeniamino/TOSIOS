import { CircleJSON } from './Circle';
import { DungeonMap } from '../map';
import { Maths } from '..';

export interface PlayerJSON extends CircleJSON {
    name: string;
    lives: number;
    maxLives: number;
    kills: number;
    ack?: number;
}

export function movePlayer(
    x: number,
    y: number,
    radius: number,
    dirX: number,
    dirY: number,
    speed: number,
    map: DungeonMap,
): { x: number; y: number } {
    // Move
    const magnitude = Maths.normalize2D(dirX, dirY);
    const speedX = Math.round(Maths.round2Digits(dirX * (speed / magnitude)));
    const speedY = Math.round(Maths.round2Digits(dirY * (speed / magnitude)));
    x += speedX;
    y += speedY;

    //
    // Collisions: Walls
    //
    const corrected = map.correctByItemAndLayer(
        { x, y, w: radius * 2, h: radius * 2, type: 1, layer: 'players', id: 'ghost' },
        'tiles',
    );
    x = corrected.x;
    y = corrected.y;

    return { x, y };
}
