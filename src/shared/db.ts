import { MikroORM, Options, EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../modules/user/user.entity.js';
import { Country } from '../modules/country/country.entity.js';
import { UserRepository } from '../modules/user/user.repository.js';
import config from './mikro-orm.config.js';

export interface Services {
    orm: MikroORM;
    em: EntityManager;
    user: UserRepository;
    country: EntityRepository<Country>;
}

let cache: Services | null = null;

export async function initORM(options?: Options): Promise<Services> {
    if (cache) {
        return cache;
    }

    const orm = await MikroORM.init({
        ...config,
        ...options,
    });

    return cache = {
        orm,
        em: orm.em,
        user: orm.em.getRepository(User),
        country: orm.em.getRepository(Country),
    };
}
