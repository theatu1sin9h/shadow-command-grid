
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/utils/types";
import { Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  toggleNetworkMode: () => void;
  lastSyncTime: Date | null;
}

const Header = ({ connectionStatus, toggleNetworkMode, lastSyncTime }: HeaderProps) => {
  const getConnectionStatusUI = () => {
    switch (connectionStatus) {
      case ConnectionStatus.ONLINE:
        return (
          <div className="flex items-center gap-2 text-tactical-success">
            <Wifi className="w-4 h-4" />
            <span>Online</span>
          </div>
        );
      case ConnectionStatus.MESH_ONLY:
        return (
          <div className="flex items-center gap-2 text-tactical-warning">
            <Wifi className="w-4 h-4 animate-pulse-slow" />
            <span>Mesh Network</span>
          </div>
        );
      case ConnectionStatus.DEGRADED:
        return (
          <div className="flex items-center gap-2 text-amber-500">
            <WifiOff className="w-4 h-4" />
            <span>Degraded</span>
          </div>
        );
      case ConnectionStatus.OFFLINE:
        return (
          <div className="flex items-center gap-2 text-tactical-danger">
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
          </div>
        );
    }
  };

  return (
    <header className="bg-tactical-primary p-3 border-b border-tactical-primary shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">SHADOW COMMAND</h1>
          <div className="hidden md:flex bg-tactical-dark px-3 py-1 rounded text-xs">
            SECURE MESH v1.0
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm">
            {lastSyncTime ? (
              <span>Last Sync: {lastSyncTime.toLocaleTimeString()}</span>
            ) : (
              <span>No Sync</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {getConnectionStatusUI()}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleNetworkMode}
              className="bg-transparent border-tactical-network text-tactical-network hover:bg-tactical-network hover:text-white"
            >
              Toggle Network
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
