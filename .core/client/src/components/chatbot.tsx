import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hi! I'm your Air Quality Assistant. Ask me about AQI or weather in any Indian city!" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Call the backend AI API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message || "Sorry, I couldn't process your request."
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again later."
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };



  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 md:right-8 z-50 w-[350px] md:w-[400px] shadow-2xl"
          >
            <Card className="border-0 shadow-lg overflow-hidden flex flex-col h-[500px]">
              <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <CardTitle className="text-lg font-medium">AI Assistant</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-primary-foreground hover:bg-white/20">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 flex flex-col pb-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-white dark:bg-slate-800 border border-border shadow-sm rounded-bl-sm"
                            }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-border shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 bg-white dark:bg-slate-950 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about AQI..."
                      className="flex-1 bg-slate-50 dark:bg-slate-900"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        >
          <MessageSquare className="h-7 w-7" />
        </motion.button>
      )}
    </>
  );
}
