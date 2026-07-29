import { delay as delayExecution } from "../../shared/utils.js";
import { UsefulService } from "../../shared/useful-service.js";
import { BaseStockUpdater as BaseStockUpdater, BaseResult } from "./types.js";

export class AdidasStockUpdater extends BaseStockUpdater {

    private readonly usefulService: UsefulService;

    readonly resultSchema = BaseResult

    constructor({ usefulService }: Dependencies<'usefulService'>) {
        super()
        this.usefulService = usefulService
    }

    async process(): Promise<BaseResult> {
        await delayExecution(2000)
        return {
            updatedCount: 5,
        }
    }

}
