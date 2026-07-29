import { EntityRepository } from '@mikro-orm/postgresql';
import { User } from './user.entity.js';

export class UserRepository extends EntityRepository<User> {
}
