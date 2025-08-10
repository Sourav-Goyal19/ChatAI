"use client";
import { MessageSquare, Lightbulb, Code, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import axios from "axios";

const suggestions = [
  {
    icon: MessageSquare,
    title: "Start a conversation",
    description: "Ask me anything you'd like to know",
  },
  {
    icon: Code,
    title: "Help with coding",
    description: "Get assistance with programming problems",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm ideas",
    description: "Generate creative solutions together",
  },
  {
    icon: BookOpen,
    title: "Learn something new",
    description: "Explore topics that interest you",
  },
];

export default function ChatHomePage() {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      axios.post("/api/users/save-user", {});
    }
  }, [isSignedIn]);
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            How can I help you today?
          </h1>
          <p className="text-lg text-muted-foreground">
            Start a new conversation or continue where you left off
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <CardContent className="p-6 text-center space-y-3">
                <suggestion.icon className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-semibold">{suggestion.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {suggestion.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
