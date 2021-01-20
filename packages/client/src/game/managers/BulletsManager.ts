import { BaseManager } from './BaseManager';
import { Bullet } from '../entities';

export default class BulletsManager extends BaseManager<Bullet> {
    constructor() {
        super('Bullets');
    }
}
