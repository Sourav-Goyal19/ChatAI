import { ChatInterface } from "../components/chat-interface";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col h-full">
      <ChatInterface chatId={id} />
    </div>
  );
}
