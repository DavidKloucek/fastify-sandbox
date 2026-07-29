import type { CountryDto } from './country.schema.js';
import type { PaginationQuery } from '../../shared/schema.js';
import { paginationOffset } from '../../shared/schema.js';
import { CountryRepository } from './country.repository.js';

export class CountryFacade {
    private readonly countryRepository: CountryRepository

    constructor({ countryRepository }: Dependencies<"countryRepository">) {
        this.countryRepository = countryRepository
    }

    async listAll(): Promise<CountryDto[]> {
        const countries = await this.countryRepository.findAll({ orderBy: { name: 'ASC' } });
        return countries.map(c => ({
            id: c.id,
            name: c.name,
            isoCode: c.isoCode
        }));
    }

    async list(pagination: PaginationQuery): Promise<{
        items: CountryDto[];
        total: number
    }> {
        const offset = paginationOffset(pagination);
        const [countries, total] = await this.countryRepository.findAndCount(
            {},
            { orderBy: { name: 'ASC' }, limit: pagination.limit, offset },
        );
        return {
            items: countries.map(c => ({ id: c.id, name: c.name, isoCode: c.isoCode })),
            total,
        };
    }
}
