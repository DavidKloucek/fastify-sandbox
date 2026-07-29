import { defineEntity, EventArgs, p } from '@mikro-orm/postgresql';
import { hash, verify } from 'argon2';
import { BaseSchema } from '../../shared/base.entity.js';
import { UserRepository } from './user.repository.js';

const UserSchema = defineEntity({
    name: 'User',
    extends: BaseSchema,
    repository: () => UserRepository,
    properties: {
        email: p.string().hidden(),
        password: p.string().hidden(),
    },
});

export class User extends UserSchema.class {

    constructor(email: string, password: string) {
        super();
        this.email = email;
        this.password = password;
    }

    async verifyPassword(password: string) {
        return verify(this.password, password);
    }
}

UserSchema.setClass(User);

async function hashPassword(args: EventArgs<User>) {
    const password = args.changeSet?.payload.password;
    if (password) {
        args.entity.password = await hash(password as string);
    }
}

UserSchema.addHook('beforeCreate', hashPassword);
UserSchema.addHook('beforeUpdate', hashPassword);
