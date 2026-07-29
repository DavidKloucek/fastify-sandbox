import { Cradle } from "../../shared/container.js";
import { z } from 'zod'

export type AllStockUpdaterKeys = {
    [K in keyof Cradle]: Cradle[K] extends { process: (...args: never[]) => Promise<unknown>; resultSchema: z.ZodType } ? K : never
}[keyof Cradle];

export function defineStockUpdaterKeys<
    const T extends readonly AllStockUpdaterKeys[]
>(keys: T) {
    return keys;
}

const allowedStockUpdaterServiceKeys = defineStockUpdaterKeys([
    'pumaStockUpdater',
    'adidasStockUpdater',
])

export const stockUpdaterKeysRuntime = allowedStockUpdaterServiceKeys satisfies readonly AllStockUpdaterKeys[]

export type StockUpdaterKeys = typeof stockUpdaterKeysRuntime[number];

export const BaseResult = z.object({
    updatedCount: z.number(),
})
export type BaseResult = z.infer<typeof BaseResult>

export interface IStockUpdater<TInput, TResult extends BaseResult> {
    readonly resultSchema: z.ZodType<TResult>
    process(input: TInput): Promise<TResult>
}

export abstract class BaseStockUpdater implements IStockUpdater<void, BaseResult> {
    readonly resultSchema = BaseResult
    abstract process(): Promise<BaseResult>;
}
