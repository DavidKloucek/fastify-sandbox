import { z } from 'zod'
import { BaseResult, IStockUpdater } from "./types.js";
import { UsefulService } from "../../shared/useful-service.js";
import { delay } from '../../shared/utils.js';

const PumaResult = BaseResult.extend({
    untouchedCount: z.number()
})
type PumaResult = z.infer<typeof PumaResult>
type PumaInput = {
    useFastMode: boolean
}

export interface IPumaStockUpdater extends IStockUpdater<PumaInput, PumaResult> {
    process(input: PumaInput): Promise<PumaResult>
}

export class PumaStockUpdater implements IPumaStockUpdater {

    private readonly usefulService: UsefulService;

    readonly resultSchema = PumaResult

    constructor({ usefulService }: Dependencies<'usefulService'>) {
        this.usefulService = usefulService
    }

    async process(input: PumaInput): Promise<PumaResult> {
        await delay(input.useFastMode ? 1000 : 2500)
        return {
            updatedCount: 5,
            untouchedCount: 1
        }
    }
}
