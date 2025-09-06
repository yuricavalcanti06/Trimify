import { Queue, ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

export const trimQueue = new Queue("video-trimming", {
  connection,
});
