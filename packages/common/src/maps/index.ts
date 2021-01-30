import { DungeonArgs, RoomTemplate } from '@halftheopposite/dungeon';
import roomsJSON from './rooms.json';

const rooms: RoomTemplate[] = roomsJSON as RoomTemplate[];
export const DEFAULT_DUNGEON: DungeonArgs = {
    // mapWidth: 64,
    // mapHeight: 64,
    mapWidth: 32,
    mapHeight: 32,
    mapGutterWidth: 1,
    // iterations: 4,
    iterations: 3,
    containerMinimumRatio: 0.45,
    containerMinimumSize: 4,
    containerSplitRetries: 30,
    corridorWidth: 2,
    rooms,
};
