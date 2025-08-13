import MemoryClient from "mem0ai";

export const memories = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY!,
});
