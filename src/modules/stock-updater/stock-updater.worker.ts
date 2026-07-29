import { z } from 'zod';
import { appContainer, Cradle, initAppContainer } from '../../shared/container.js';
import { StockUpdaterKeys, stockUpdaterKeysRuntime } from './types.js';
import { AwilixContainer } from 'awilix';

export const Input = z.object({
    processorKey: z.enum(stockUpdaterKeysRuntime),
    params: z.any().optional(),
})
export type Input = z.infer<typeof Input>

let di: AwilixContainer<Cradle> | null = null
const getDi = async () => {
    if (di !== null) {
        return di;
    }
    await initAppContainer();
    di = appContainer.createScope();
    return di
}

export async function processStock<T extends StockUpdaterKeys>(rawInput: {
    processorKey: T
    params?: Parameters<Cradle[T]["process"]>[0]
}): Promise<Awaited<ReturnType<Cradle[T]["process"]>>> {

    const di = await getDi()
    void Input.parse(rawInput)
    const service = di.resolve(rawInput.processorKey)
    const data = await service.process(rawInput.params as never)
    return data as Awaited<ReturnType<Cradle[T]["process"]>>
}
