import { normalize2D, round2Digits } from '../maths';
import { CircleJSON } from './Circle';

export enum PlayerType {
    Wizard = 1,
}
export interface PlayerJSON extends CircleJSON {
    type: PlayerType;
    name: string;
    lives: number;
    maxLives: number;
    ack?: number;
}

export function movePlayer(
    player: { x: number; y: number; w: number; h: number },
    dir: { x: number; y: number },
    speed: number,
): { x: number; y: number } {
    const magnitude = normalize2D(dir.x, dir.y);

    const speedX = Math.round(round2Digits(dir.x * (speed / magnitude)));
    const speedY = Math.round(round2Digits(dir.y * (speed / magnitude)));

    player.x += speedX;
    player.y += speedY;

    return { x: player.x, y: player.y };
}
