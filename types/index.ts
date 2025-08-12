export type ConversationType = {
  title: string | null;
  id: string;
  model: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  contextWindowSize: number | null;
  lastActivityAt: Date | null;
};
