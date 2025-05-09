
import { useState, useRef, useEffect } from "react";
import { Message, MessagePriority } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MessagingPanelProps {
  messages: Message[];
  sendMessage: (content: string, priority: MessagePriority) => Message;
}

const MessagingPanel = ({ messages, sendMessage }: MessagingPanelProps) => {
  const [messageInput, setMessageInput] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<MessagePriority>(MessagePriority.MEDIUM);
  const [voiceMode, setVoiceMode] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom on new messages
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput, selectedPriority);
      setMessageInput("");
      
      if (selectedPriority === MessagePriority.HIGH || selectedPriority === MessagePriority.CRITICAL) {
        toast(`Priority message sent`, {
          description: messageInput.length > 30 ? `${messageInput.substring(0, 30)}...` : messageInput
        });
      }
    }
  };
  
  const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
      case MessagePriority.LOW:
        return "text-gray-400";
      case MessagePriority.MEDIUM:
        return "text-tactical-info";
      case MessagePriority.HIGH:
        return "text-tactical-warning";
      case MessagePriority.CRITICAL:
        return "text-tactical-danger";
      default:
        return "";
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const simulateVoiceTransmission = () => {
    toast.success("Voice transmission started", {
      description: "Channel open. Press and hold to speak."
    });
    
    // Simulate a voice transmission in progress
    setTimeout(() => {
      toast.info("Transmitting data", {
        description: "Voice data is being sent through mesh network"
      });
    }, 2000);
    
    // End simulation after 5 seconds
    setTimeout(() => {
      toast("Voice transmission complete", {
        description: "Voice message delivered to all available units"
      });
      setVoiceMode(false);
    }, 5000);
  };

  return (
    <div className="bg-tactical-dark p-4 rounded-lg border border-tactical-primary flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">COMMUNICATIONS</h3>
        <div className="flex items-center">
          <Switch
            id="voice-mode"
            checked={voiceMode}
            onCheckedChange={() => {
              const newMode = !voiceMode;
              setVoiceMode(newMode);
              if (newMode) {
                simulateVoiceTransmission();
              }
            }}
            className="mr-2 data-[state=checked]:bg-tactical-danger"
          />
          <Label htmlFor="voice-mode" className="text-xs">Voice</Label>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="bg-tactical-primary bg-opacity-20">
          <TabsTrigger value="all" className="data-[state=active]:bg-tactical-primary">All</TabsTrigger>
          <TabsTrigger value="priority" className="data-[state=active]:bg-tactical-primary">Priority</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="flex-1 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden">
          <div className="flex-1 overflow-y-auto py-2 space-y-3">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`p-2 rounded ${
                  message.senderId === "unit-1" 
                    ? 'ml-6 bg-tactical-primary bg-opacity-30' 
                    : 'mr-6 bg-black bg-opacity-20'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">{message.senderCallsign}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${getPriorityColor(message.priority)}`}>
                      {message.priority}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="text-sm">{message.content}</div>
                {message.senderId !== "unit-1" && (
                  <div className="mt-1 text-right">
                    <span className="text-xs text-gray-400">
                      {message.acknowledged ? 'Read' : 'Delivered'}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
          
          {!voiceMode && (
            <div className="pt-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs">Priority:</div>
                {Object.values(MessagePriority).map(priority => (
                  <Button
                    key={priority}
                    variant="outline"
                    size="sm"
                    className={`h-6 px-2 py-0 text-xs border-0 ${
                      selectedPriority === priority
                        ? getPriorityColor(priority) + ' bg-tactical-primary bg-opacity-30'
                        : 'text-gray-400'
                    }`}
                    onClick={() => setSelectedPriority(priority)}
                  >
                    {priority}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="bg-tactical-dark border-tactical-primary"
                />
                <Button 
                  onClick={handleSendMessage} 
                  className="bg-tactical-primary hover:bg-tactical-primary hover:brightness-110"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {voiceMode && (
            <div className="pt-3">
              <Button 
                className="w-full h-12 bg-tactical-danger animate-pulse"
                onClick={() => {
                  toast.info("Transmission in progress", {
                    description: "Speak clearly and concisely"
                  });
                }}
              >
                TRANSMITTING
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="priority" className="flex-1 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden">
          <div className="flex-1 overflow-y-auto py-2 space-y-3">
            {messages
              .filter(msg => msg.priority === MessagePriority.HIGH || msg.priority === MessagePriority.CRITICAL)
              .map(message => (
                <div 
                  key={message.id} 
                  className={`p-2 rounded ${
                    message.senderId === "unit-1" 
                      ? 'ml-6 bg-tactical-primary bg-opacity-30' 
                      : 'mr-6 bg-black bg-opacity-20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">{message.senderCallsign}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">{message.content}</div>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagingPanel;
