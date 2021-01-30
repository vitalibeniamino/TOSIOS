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
    toBBox = (item: Item) => {
        return {
            minX: item.x,
            minY: item.y,
            maxX: item.x + item.w,
            maxY: item.y + item.h,
            type: item.type,
            layer: item.layer,
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
    loadDungeon = (dungeon: Dungeon, layers: TileLayer[] = ['tiles', 'props', 'monsters']) => {
        this.width = dungeon.width;
        this.height = dungeon.height;

        this.items = {};
        layers.forEach((layer) => {
            if (layer in dungeon.layers) {
                this.items = {
                    ...this.items,
                    ...tilemapToItems(dungeon.layers[layer], layer, this.tileSize),
                };
            }
        });

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

    /** Get an item by id. */
    getItem = (id: string): Item => {
        const item = this.items[id];
        if (!item) {
            throw new Error(`Couldn't find item with id "${id}"`);
        }

        return item;
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
    listItemsByLayerAndType = (layer: ItemLayer, type: ItemType): Item[] => {
        return Object.values(this.items).filter((item) => item.layer === layer && item.type === type);
    };

    //
    // Collisions
    //

    /** List all items on `layer` with `type` that collide with `id`. */
    collidesById = (id: string, layers: ItemLayer[], types?: number[]): Item[] => {
        const item = this.getItem(id);
        const bbox = this.rbush.toBBox(item);

        return filterByLayerAndTypes(this.rbush.search(bbox), layers, types);
    };

    /** List all items on `layer` with `type` that collide with the provided `item`. */
    collidesByItem = (item: Item, layers: ItemLayer[], types?: number[]): Item[] => {
        const bbox = this.rbush.toBBox(item);
        const found = this.rbush.search(bbox);
        const filtered = filterByLayerAndTypes(found, layers, types);

        return filtered;
    };

    /** Collide and correct the position of an item by `id`. */
    collideAndCorrectById = (id: string, layers: ItemLayer[], types?: number[]): Item => {
        const item = this.getItem(id);
        const updatedItem = this.collideAndCorrectByItem(item, layers, types);
        this.updateItem(id, updatedItem.x, updatedItem.y);

        return updatedItem;
    };

    /** Collide and correct the position of the provided `item`. */
    collideAndCorrectByItem = (item: Item, layers: ItemLayer[], types?: number[]): Item => {
        const bbox = this.rbush.toBBox(item);
        const collidingItems = filterByLayerAndTypes(this.rbush.search(bbox), layers, types);
        if (collidingItems.length === 0) {
            return item;
        }

        return correctItem(item, collidingItems);
    };
}

//
// Utils
//

/**
 * Correct an `item` against a list of `items`.
 */
function correctItem(initial: Item, items: Item[]): Item {
    const updated = {
        ...initial,
    };

    items.forEach((item) => {
        const side = rectangleToRectangleSide(updated, item);
        switch (side) {
            case 'left':
                updated.x = item.x - updated.w;
                break;
            case 'top':
                updated.y = item.y - updated.h;
                break;
            case 'right':
                updated.x = item.x + item.w;
                break;
            case 'bottom':
                updated.y = item.y + item.h;
                break;
            default:
                break;
        }
    });

    return updated;
}

/**
 * Filter a list of `item` by their `layers` and `types` (if any).
 */
function filterByLayerAndTypes(items: Item[], layers: ItemLayer[], types?: number[]): Item[] {
    return items.filter((item) => {
        if (types && types.length > 0) {
            return layers.includes(item.layer) && types.includes(item.type);
        }

        return layers.includes(item.layer);
    });
}

/**
 * Computes which side `i1` is colliding `i2` on.
 */
function rectangleToRectangleSide(i1: Item, i2: Item) {
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
}

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
