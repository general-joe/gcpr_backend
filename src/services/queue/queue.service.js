import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import WRITE from "../../utils/logger.js";
import {
  QUEUE_NAMES,
  processEmailJob,
  processMetricsJob,
  processNotificationJob,
} from "./queue.jobs.js";

const DEFAULT_JOB_OPTIONS = {
  removeOnComplete: 1000,
  removeOnFail: 5000,
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
};

let redisConnection = null;
let queues = null;
let workersStarted = false;

function isQueueConfigured() {
  return Boolean(process.env.REDIS_URL);
}

function getRedisConnection() {
  if (!isQueueConfigured()) {
    return null;
  }

  if (!redisConnection) {
    redisConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisConnection.on("error", (error) => {
      WRITE.error("[Queue] Redis connection error", { error: error.message });
    });
  }

  return redisConnection;
}

function getQueues() {
  if (!isQueueConfigured()) {
    return null;
  }

  if (!queues) {
    const connection = getRedisConnection();
    queues = {
      [QUEUE_NAMES.EMAIL]: new Queue(QUEUE_NAMES.EMAIL, {
        connection,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
      [QUEUE_NAMES.NOTIFICATION]: new Queue(QUEUE_NAMES.NOTIFICATION, {
        connection,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
      [QUEUE_NAMES.METRICS]: new Queue(QUEUE_NAMES.METRICS, {
        connection,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
    };
  }

  return queues;
}

export function isQueueEnabled() {
  return isQueueConfigured();
}

export async function enqueueJob(queueName, jobName, data, options = {}) {
  const queueRegistry = getQueues();
  if (!queueRegistry) {
    return { queued: false };
  }

  const queue = queueRegistry[queueName];
  if (!queue) {
    throw new Error(`Unknown queue: ${queueName}`);
  }

  const job = await queue.add(jobName, data, options);
  return {
    queued: true,
    jobId: job.id,
    queueName,
  };
}

function attachWorkerEvents(worker, queueName) {
  worker.on("completed", (job) => {
    WRITE.info("[Queue] Job completed", {
      queueName,
      jobId: job.id,
      jobName: job.name,
    });
  });

  worker.on("failed", (job, error) => {
    WRITE.error("[Queue] Job failed", {
      queueName,
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
    });
  });
}

export async function startQueueWorkers() {
  if (!isQueueConfigured()) {
    WRITE.warn("[Queue] REDIS_URL not configured; falling back to inline execution");
    return;
  }

  if (workersStarted) {
    return;
  }

  const connection = getRedisConnection();
  await connection.connect();

  const workerDefinitions = [
    [QUEUE_NAMES.EMAIL, processEmailJob],
    [QUEUE_NAMES.NOTIFICATION, processNotificationJob],
    [QUEUE_NAMES.METRICS, processMetricsJob],
  ];

  for (const [queueName, processor] of workerDefinitions) {
    const worker = new Worker(queueName, processor, { connection });
    attachWorkerEvents(worker, queueName);
  }

  workersStarted = true;
  WRITE.info("[Queue] Workers started", {
    queues: Object.values(QUEUE_NAMES),
  });
}