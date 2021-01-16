import { Schema, type } from '@colyseus/schema';

export interface IEntity {
    id: string;
}

export class Entity extends Schema {
    //
    // Sync fields
    //
    @type('string')
    public id: string;

    //
    // Lifecycle
    //
    constructor(attributes: IEntity) {
        super();
        this.id = attributes.id;
    }
}
