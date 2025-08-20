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

export type VersionGroupType = {
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
  files: MessageFileType[];
  streaming: boolean;
};

export type FileType = {
  id: string;
  createdAt: Date;
  userId: string;
  conversationId: string | null;
  messageId: string;
  fileName: string;
  fileType: string;
  storageUrl: string;
  _tempFile?: File;
};

export type MessageFileType = FileType | File;
