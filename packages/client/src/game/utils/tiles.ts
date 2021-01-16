import * as PIXI from 'pixi.js';
import { Constants } from '@tosios/common';
import { TileMap } from '@halftheopposite/dungeon';
import { TilesTextures } from '../assets/images';

export function drawTiles(tiles: TileMap, container: PIXI.Container) {
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            const id = tiles[y][x];
            const texture = TilesTextures.sprites[id];
            if (texture) {
                const sprite = new PIXI.Sprite(texture);
                sprite.scale.set(Constants.TILE_SIZE / texture.width);
                sprite.position.set(x * Constants.TILE_SIZE, y * Constants.TILE_SIZE);
                container.addChild(sprite);
            } else {
                const rectangle = new PIXI.Graphics();
                rectangle.beginFill(0xff0000);
                rectangle.drawRect(0, 0, Constants.TILE_SIZE, Constants.TILE_SIZE);
                rectangle.endFill();
                rectangle.position.set(x * Constants.TILE_SIZE, y * Constants.TILE_SIZE);
                container.addChild(rectangle);
            }
        }
    }
}
