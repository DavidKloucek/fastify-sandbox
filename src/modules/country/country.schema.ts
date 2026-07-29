import { z } from 'zod';
import { paginatedSchema, unpaginatedSchema } from '../../shared/schema.js';

export const CountryDtoSchema = z.object({
    id: z.number(),
    name: z.string(),
    isoCode: z.string(),
});
export type CountryDto = z.infer<typeof CountryDtoSchema>;

export const AllCountriesDto = unpaginatedSchema(CountryDtoSchema)
export type AllCountriesDto = z.infer<typeof AllCountriesDto>

export const PaginatedCountriesDto = paginatedSchema(CountryDtoSchema);
export type PaginatedCountriesDto = z.infer<typeof PaginatedCountriesDto>;
