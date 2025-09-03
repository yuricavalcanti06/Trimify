import { Queue } from "bullmq";

const redisConnection = {
  host: "localhost",
  port: 6379,
};

export const trimQueue = new Queue("video-trimming", {
  connection: redisConnection,
});
