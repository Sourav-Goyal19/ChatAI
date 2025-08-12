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

export type versionGroup = {
  messages: MessageType[];
  id: string;
  createdAt: Date;
  conversationId: string;
  versions: string[];
};

export type MessageType = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  conversationId: string;
  versionGroupId: string;
  sender: string;
  content: string;
  role: "user" | "assistant";
  files: string[];
  streaming: boolean;
};
