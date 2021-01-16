export interface IEntity {
    id: string;
}

export class Entity {
    id: string;

    constructor(attributes: IEntity) {
        this.id = attributes.id;
    }
}
