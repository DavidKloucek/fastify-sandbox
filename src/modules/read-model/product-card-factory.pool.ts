import { Piscina } from "piscina";
import * as worker from "./read.worker.js";
import { ProductCardFactory as ProductCardDtoFactory } from "./product-card.factory.js";
import { IProductReadModel, ProductCardDto } from "./types.js";
import { resolveRelative } from "../../shared/utils.js";

export class ProductCardFactoryPool implements IProductReadModel {

    private piscina: Piscina | null = null
    private readonly factory: ProductCardDtoFactory

    constructor({ productCardDtoFactory }: Dependencies<'productCardDtoFactory'>) {
        this.factory = productCardDtoFactory;
    }

    private getPiscina(): Piscina {
        if (!this.piscina) {
            this.piscina = new Piscina({
                filename: resolveRelative(import.meta.url, 'read.worker.js'),
                idleTimeout: 60 * 1000,
                closeTimeout: 30 * 1000,
                maxThreads: 2,
                minThreads: 0,
            });
        }
        return this.piscina;
    }

    async getDtoById(id: number): Promise<ProductCardDto> {
        const product: unknown = await this.getPiscina().run({
            id
        } satisfies worker.Input, {
            name: worker.read.name
        })
        return ProductCardDto.parse(product)
    }
}
