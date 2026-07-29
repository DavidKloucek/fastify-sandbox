import { IProductReadModel, ProductCardDto } from "./types.js";

export class ProductCardCache implements IProductReadModel {

    private readonly cache: Map<number, ProductCardDto> = new Map();
    private readonly readModel: IProductReadModel;

    constructor({ productReadModel: reader }: { productReadModel: IProductReadModel }) {
        this.readModel = reader;
    }

    async getDtoById(id: number): Promise<ProductCardDto> {
        if (!this.cache.has(id)) {
            const card = await this.readModel.getDtoById(id)
            this.cache.set(id, ProductCardDto.parse(card))
        }
        const card = this.cache.get(id)
        if (!card) {
            throw new Error()
        }
        return card
    }

    deleteDtoById(id: number): void {
        this.cache.delete(id)
    }

    deleteAll(): void {
        this.cache.clear()
    }
}
