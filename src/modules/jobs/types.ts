import { Job,  } from "bullmq";

export type JobHandlerList = Record<string, ((job: Job) => unknown) | undefined>
