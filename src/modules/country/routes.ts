import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { withoutAuth, PaginationQuery } from '../../shared/schema.js';
import { AllCountriesDto, PaginatedCountriesDto } from './country.schema.js';

export function registerCountryRoutes(app: FastifyInstance) {
    const route = app.withTypeProvider<ZodTypeProvider>();

    route.get<{
        Reply: AllCountriesDto
    }>("/all", {
        schema: {
            tags: ["Country"],
            ...withoutAuth(),
            response: {
                200: AllCountriesDto,
            }
        }
    }, async (req) => {
        const facade = req.di.resolve('countryFacade');
        const data = await facade.listAll();
        return { data };
    });

    route.get<{
        Querystring: PaginationQuery
        Reply: PaginatedCountriesDto
    }>("/list", {
        schema: {
            tags: ["Country"],
            ...withoutAuth(),
            querystring: PaginationQuery,
            response: {
                200: PaginatedCountriesDto,
            }
        }
    }, async (req) => {
        const facade = req.di.resolve('countryFacade');
        const { items, total } = await facade.list(req.query);
        return {
            data: items,
            total,
            page: req.query.page,
            limit: req.query.limit
        };
    });
}
