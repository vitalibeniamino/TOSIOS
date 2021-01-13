import { DungeonArgs, RoomTemplate } from '@halftheopposite/dungeon';
import { TMX } from '../tiled';
import gigantic from './gigantic.json';
import roomsJSON from './rooms.json';
import small from './small.json';

export const List: { [key: string]: TMX.IMap } = {
    small,
    gigantic,
};

const rooms: RoomTemplate[] = roomsJSON as RoomTemplate[];
export const DEFAULT_DUNGEON: DungeonArgs = {
    mapWidth: 64,
    mapHeight: 64,
    mapGutterWidth: 1,
    iterations: 4,
    containerMinimumRatio: 0.45,
    containerMinimumSize: 4,
    containerSplitRetries: 30,
    corridorWidth: 2,
    rooms,
};
