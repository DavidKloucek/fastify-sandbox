import { EntityRepository } from '@mikro-orm/postgresql';
import { Country } from './country.entity.js';

export class CountryRepository extends EntityRepository<Country> {
}
