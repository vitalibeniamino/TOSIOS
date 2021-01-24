import { BulletType, PlayerType } from './models';
import { Dungeon, MonsterType, PropType, TileLayer, TileMap, TileType } from '@halftheopposite/dungeon';
import RBush from 'rbush';
import { nanoid } from 'nanoid';

export type ItemLayer = TileLayer | 'players' | 'projectiles';
export type ItemType = TileType | PropType | MonsterType | PlayerType | BulletType;
export interface Item {
    x: number;
    y: number;
    w: number;
    h: number;
    id: string;
    type: ItemType;
    layer: ItemLayer;
}
export type ItemMap = { [key: string]: Item };

//
// RBush
//
export class DungeonRBush extends RBush<Item> {
    //
    // Overrides
    //
    toBBox = (tile: Item) => {
        return {
            minX: tile.x,
            minY: tile.y,
            maxX: tile.x + tile.w,
            maxY: tile.y + tile.h,
            type: tile.type,
            layer: tile.layer,
        };
    };

    compareMinX = (a: Item, b: Item) => {
        return a.x - b.x;
    };

    compareMinY = (a: Item, b: Item) => {
        return a.y - b.y;
    };
}

//
// Map
//
export class DungeonMap {
    width: number = 0;

    height: number = 0;

    private tileSize: number = 32;

    private items: ItemMap = {};

    private rbush: DungeonRBush = new DungeonRBush();

    //
    // Lifecycle
    //
    constructor(tileSize: number) {
        this.tileSize = tileSize;
    }

    //
    // Dungeon
    //

    /** Load a newly generated dungeon. */
    loadDungeon = (dungeon: Dungeon) => {
        this.width = dungeon.width;
        this.height = dungeon.height;
        this.items = {
            ...tilemapToItems(dungeon.layers.tiles, 'tiles', this.tileSize),
            ...tilemapToItems(dungeon.layers.props, 'props', this.tileSize),
            ...tilemapToItems(dungeon.layers.monsters, 'monsters', this.tileSize),
        };

        this.rbush.load(Object.values(this.items));
    };

    /** Load all items in the dungeon. */
    clearDungeon = () => {
        this.width = 0;
        this.height = 0;
        this.items = {};
        this.rbush.clear();
    };

    //
    // Items
    //

    /** Add an item and returns its id (you can pass an optional `id` parameter to force it). */
    addItem = (x: number, y: number, w: number, h: number, layer: ItemLayer, type: number, id?: string): string => {
        const item = createItem(x, y, w, h, layer, type, id);

        this.items[item.id] = item;
        this.rbush.load([this.items[item.id]]);

        return item.id;
    };

    /** Update an item by id. */
    updateItem = (id: string, x: number, y: number): void => {
        if (!this.items[id]) {
            throw new Error(`Couldn't update a non exisiting item with id "${id}"`);
        }

        this.items[id].x = x;
        this.items[id].y = y;
    };

    /** Remove an item by id. */
    removeItem = (id: string): void => {
        this.rbush.remove(this.items[id]);
        delete this.items[id];
    };

    /** List all items matching the `layer`. */
    listItemsByLayer = (layer: ItemLayer): Item[] => {
        return Object.values(this.items).filter((item) => item.layer === layer);
    };

    /** List all items matching the `layer` and `type`. */
    listItemsByLayerAndTypes = (layer: ItemLayer, type: ItemType): Item[] => {
        return Object.values(this.items).filter((item) => item.layer === layer && item.type === type);
    };

    //
    // Collisions
    //

    /** List all items on `layer` that collide with `id`. */
    collidesByLayer = (id: string, layer: ItemLayer): Item[] => {
        return this.rbush.search(this.rbush.toBBox(this.items[id])).filter((item) => item.layer === layer);
    };

    /** Update the corrected position of an item. */
    correctByIdLayer = (id: string, layer: ItemLayer): Item => {
        const item = this.items[id];
        if (!item) {
            throw new Error(`Couldn't find item with id "${id}"`);
        }

        const collidingItems = this.collidesByLayer(id, layer);
        if (collidingItems.length === 0) {
            return this.items[id];
        }

        const updatedItem: Item = {
            ...this.items[id],
        };

        collidingItems.forEach((collidingItem) => {
            const side = rectangleToRectangleSide(updatedItem, collidingItem);
            switch (side) {
                case 'left':
                    updatedItem.x = collidingItem.x - updatedItem.w;
                    break;
                case 'top':
                    updatedItem.y = collidingItem.y - updatedItem.h;
                    break;
                case 'right':
                    updatedItem.x = collidingItem.x + collidingItem.w;
                    break;
                case 'bottom':
                    updatedItem.y = collidingItem.y + collidingItem.h;
                    break;
                default:
                    break;
            }
        });

        this.updateItem(id, updatedItem.x, updatedItem.y);

        return updatedItem;
    };

    correctByItemAndLayer = (item: Item, layer: ItemLayer): Item => {
        const collidingItems = this.rbush.search(this.rbush.toBBox(item)).filter((element) => element.layer === layer);
        if (collidingItems.length === 0) {
            return item;
        }

        const updatedItem: Item = {
            ...item,
        };

        collidingItems.forEach((collidingItem) => {
            const side = rectangleToRectangleSide(updatedItem, collidingItem);
            switch (side) {
                case 'left':
                    updatedItem.x = collidingItem.x - updatedItem.w;
                    break;
                case 'top':
                    updatedItem.y = collidingItem.y - updatedItem.h;
                    break;
                case 'right':
                    updatedItem.x = collidingItem.x + collidingItem.w;
                    break;
                case 'bottom':
                    updatedItem.y = collidingItem.y + collidingItem.h;
                    break;
                default:
                    break;
            }
        });

        return updatedItem;
    };
}

//
// Utils
//

/**
 * Computes which side `i1` is colliding `i2` on.
 */
const rectangleToRectangleSide = (i1: Item, i2: Item) => {
    const dx = i1.x + i1.w / 2 - (i2.x + i2.w / 2);
    const dy = i1.y + i1.h / 2 - (i2.y + i2.h / 2);
    const width = (i1.w + i2.w) / 2;
    const height = (i1.h + i2.h) / 2;
    const crossWidth = width * dy;
    const crossHeight = height * dx;

    let collision = 'none';
    if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
        if (crossWidth > crossHeight) {
            collision = crossWidth > -crossHeight ? 'bottom' : 'left';
        } else {
            collision = crossWidth > -crossHeight ? 'right' : 'top';
        }
    }
    return collision;
};

/**
 * Create an item.
 */
function createItem(x: number, y: number, w: number, h: number, layer: ItemLayer, type: number, id?: string): Item {
    const itemId = id || nanoid();

    return {
        x,
        y,
        w,
        h,
        id: itemId,
        layer,
        type,
    };
}

/**
 * Create a list of items from a tilemap.
 */
function tilemapToItems(tilemap: TileMap, layer: ItemLayer, tileSize: number): ItemMap {
    const result: ItemMap = {};

    let tileId: number;
    for (let y = 0; y < tilemap.length; y++) {
        for (let x = 0; x < tilemap[y].length; x++) {
            tileId = tilemap[y][x];
            if (tileId === 0) {
                continue;
            }

            const item = createItem(
                x * tileSize + tileSize / 2,
                y * tileSize + tileSize / 2,
                tileSize,
                tileSize,
                layer,
                normalizeTileId(tileId, layer),
            );
            result[item.id] = item;
        }
    }

    return result;
}

/**
 * Takes a tile's id and layer and return the normalized type.
 */
function normalizeTileId(tileId: number, layer: ItemLayer): number {
    if (layer !== 'tiles') {
        return tileId;
    }

    if (tileId > 0) {
        return TileType.Wall;
    }

    if (tileId < 0) {
        return TileType.Hole;
    }

    return 0;
}
