import { delay } from "../../shared/utils.js";
import { UserRepository } from "../user/user.repository.js";
import { IProductReadModel, ProductCardDto } from "./types.js";

export class ProductCardFactory implements IProductReadModel {

    private readonly userRepository: UserRepository

    constructor({ userRepository }: Dependencies<'userRepository'>) {
        this.userRepository = userRepository;
    }

    async getDtoById(id: number): Promise<ProductCardDto> {
        await delay(1000)
        const data = await this.userRepository.findOneOrFail({ id: 1 })

        return {
            id,
            name: "Product ABC-" + id.toString() + " by " + data.email,
            description: "xxx"
        }
    }
}
