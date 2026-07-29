import { defineEntity, p } from '@mikro-orm/postgresql';
import { CountryRepository } from './country.repository.js';

const CountrySchema = defineEntity({
    name: "Country",
    repository: () => CountryRepository,
    properties: {
        id: p.integer().unsigned().primary(),
        name: p.string().length(100).unique(),
        isoCode: p.string().length(2).unique(),
    }
})

export class Country extends CountrySchema.class { }

CountrySchema.setClass(Country);
