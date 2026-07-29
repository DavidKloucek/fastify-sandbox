import { z } from 'zod'

export const ProductCardDto = z.object({
    id: z.number().positive(),
    name: z.string(),
    description: z.string(),
})
export type ProductCardDto = z.infer<typeof ProductCardDto>

export interface IProductReadModel {
    getDtoById(id: number): Promise<ProductCardDto>;
}
