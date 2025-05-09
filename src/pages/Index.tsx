
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Map from "@/components/Map";
import UnitStatus from "@/components/UnitStatus";
import CommandCenter from "@/components/CommandCenter";
import ConnectionStatus from "@/components/ConnectionStatus";
import MessagingPanel from "@/components/MessagingPanel";
import { useSimulatedNetwork } from "@/utils/meshNetwork";
import { ConnectionStatus as ConnStatus, Unit } from "@/utils/types";
import { Toaster } from "sonner";
import { toast } from "sonner";

const Index = () => {
  const { 
    units, 
    messages, 
    commands, 
    meshNetwork, 
    connectionStatus,
    sendMessage,
    issueCommand,
    toggleNetworkMode,
    addUnit
  } = useSimulatedNetwork();
  
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Simulate periodic sync when online
  useEffect(() => {
    if (connectionStatus === ConnStatus.ONLINE) {
      setLastSyncTime(new Date());
      
      const interval = setInterval(() => {
        setLastSyncTime(new Date());
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  const handleAddUnit = (newUnit: Unit) => {
    addUnit(newUnit);
    toast.success(`Unit ${newUnit.callsign} deployed successfully`, {
      description: `Type: ${newUnit.type}`,
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-tactical-dark text-white flex flex-col">
      <Toaster richColors position="top-right" />
      <Header 
        connectionStatus={connectionStatus}
        toggleNetworkMode={toggleNetworkMode}
        lastSyncTime={lastSyncTime}
      />
      
      <div className="flex-1 p-2 md:p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Main tactical map - Added flexibility for fullscreen mode */}
        <div className="md:col-span-2 lg:col-span-3 h-[400px] md:h-auto relative z-10">
          <Map units={units} commands={commands} />
        </div>
        
        {/* Right sidebar with unit status and network info */}
        <div className="space-y-3 md:space-y-4">
          <UnitStatus units={units} onAddUnit={handleAddUnit} />
          <ConnectionStatus status={connectionStatus} meshNetwork={meshNetwork} />
        </div>
        
        {/* Bottom section with command center and messaging */}
        <div className="md:col-span-2 lg:col-span-2 h-80">
          <CommandCenter 
            commands={commands}
            units={units}
            issueCommand={issueCommand}
          />
        </div>
        
        <div className="md:col-span-1 lg:col-span-2 h-80">
          <MessagingPanel 
            messages={messages}
            sendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
