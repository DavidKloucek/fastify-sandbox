import { EntityManager } from "@mikro-orm/postgresql"
import { UserRepository } from "../modules/user/user.repository.js"
import { UsefulService } from "./useful-service.js"

export type DashboardResult = {
    userCount: number
    currReqEntityManagerId: number
}

export interface DashboardInterface {
    createStats(): Promise<DashboardResult>
}

export class DashboardFacade implements DashboardInterface {
    private readonly userRepository: UserRepository
    private readonly em: EntityManager
    private readonly usefulService: UsefulService

    constructor({
        userRepository,
        em,
        usefulService,
    }: Dependencies<'userRepository' | 'em' | 'usefulService'>) {
        this.userRepository = userRepository
        this.usefulService = usefulService
        this.em = em
    }

    async createStats(): Promise<DashboardResult> {
        this.usefulService.processInvisibleTask()
        return {
            userCount: await this.userRepository.count(),
            currReqEntityManagerId: this.em.id,
        }
    }
} 
