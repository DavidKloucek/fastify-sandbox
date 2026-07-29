import { defineEntity, p } from '@mikro-orm/postgresql';

export const BaseSchema = defineEntity({
    name: 'BaseEntity',
    abstract: true,
    properties: {
        id: p.integer().primary(),
    },
});

export class BaseEntity extends BaseSchema.class { }

BaseSchema.setClass(BaseEntity);
