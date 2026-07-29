import { Piscina } from 'piscina';
import * as worker from './stock-updater.worker.js';
import { appContainer, Cradle } from '../../shared/container.js';
import { StockUpdaterKeys } from './types.js';
import { resolveRelative } from '../../shared/utils.js';

export class StockUpdater {

    private piscina: Piscina | null = null

    private getPiscina(): Piscina {
        if (!this.piscina) {
            this.piscina = new Piscina({
                filename: resolveRelative(import.meta.url, "stock-updater.worker.js"),
                idleTimeout: 60,
                closeTimeout: 60,
                minThreads: 0,
                maxThreads: 2,
            })
        }
        return this.piscina;
    }

    async process<T extends StockUpdaterKeys>(
        processorKey: T,
        params: Parameters<Cradle[T]["process"]>
    ): Promise<Awaited<ReturnType<Cradle[T]["process"]>>> {

        const input = {
            processorKey,
            params,
        } satisfies worker.Input
        const result: unknown = await this.getPiscina().run(input, {
            name: "processStock"
        })
        const service = appContainer.resolve(processorKey)
        return service.resultSchema.parse(result) as Awaited<ReturnType<Cradle[T]["process"]>>
    }
}
