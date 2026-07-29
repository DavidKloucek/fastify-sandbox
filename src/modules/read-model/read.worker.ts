import { z } from 'zod';
import { appContainer, asValue, Cradle, initAppContainer } from '../../shared/container.js';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { AwilixContainer } from 'awilix';
import { ProductCardDto } from './types.js';

export const Input = z.object({
    id: z.number().positive(),
})
export type Input = z.infer<typeof Input>

let di: AwilixContainer<Cradle> | null = null
let globalEm: EntityManager | null = null

const getDi = async () => {
    if (di !== null) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return { di, globalEm: globalEm! };
    }
    const db = await initAppContainer();
    globalEm = db.em;
    di = appContainer.createScope();
    return { di, globalEm };
}

export async function read(input: Input): Promise<ProductCardDto | null> {
    const { id } = Input.parse(input)
    const { di, globalEm } = await getDi()

    return RequestContext.create(globalEm, async () => {
        const em = RequestContext.getEntityManager() as EntityManager;
        const scopedDi = di.createScope();
        scopedDi.register({ em: asValue(em) });

        return await scopedDi.resolve('productCardDtoFactory').getDtoById(id)
    });
}
