
import React from "react";
import { Unit, ConnectionStatus, UnitType } from "@/utils/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, User, Helicopter, Award, Wrench, Signal } from "lucide-react";

interface UnitStatusProps {
  units: Unit[];
}

const UnitStatus: React.FC<UnitStatusProps> = ({ units }) => {
  const getConnectionStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.ONLINE:
        return "bg-tactical-success";
      case ConnectionStatus.MESH_ONLY:
        return "bg-tactical-warning";
      case ConnectionStatus.DEGRADED:
        return "bg-tactical-warning";
      case ConnectionStatus.OFFLINE:
        return "bg-tactical-danger";
      default:
        return "bg-gray-500";
    }
  };

  const getUnitTypeIcon = (type: UnitType) => {
    switch (type) {
      case UnitType.INFANTRY:
        return <User size={18} className="text-tactical-success" />;
      case UnitType.ARMOR:
        return <Shield size={18} className="text-tactical-warning" />;
      case UnitType.AIR:
        return <Helicopter size={18} className="text-tactical-info" />;
      case UnitType.COMMAND:
        return <Award size={18} className="text-tactical-primary" />;
      case UnitType.SUPPORT:
        return <Wrench size={18} className="text-gray-400" />;
      default:
        return <Signal size={18} className="text-gray-400" />;
    }
  };

  const getStatusColor = (value: number) => {
    if (value > 75) return "bg-tactical-success";
    if (value > 40) return "bg-tactical-warning";
    return "bg-tactical-danger";
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return "Now";
    } else if (diffMins === 1) {
      return "1 min";
    } else if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      if (hours === 1) {
        return "1 hr";
      } else {
        return `${hours} hr`;
      }
    }
  };

  return (
    <div className="bg-tactical-dark p-4 rounded-lg border border-tactical-primary h-full">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Signal size={16} className="text-tactical-primary" />
        UNIT STATUS
      </h3>
      
      <div className="space-y-3 max-h-[calc(100%-2rem)] overflow-y-auto pr-1">
        {units.map(unit => (
          <Card key={unit.id} className="bg-black bg-opacity-30 border-gray-800 hover:border-gray-700 transition-colors">
            <CardContent className="p-3 relative">
              {/* Last update indicator */}
              <div className="absolute top-1 right-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span className={`h-2 w-2 rounded-full ${unit.connectionStatus === ConnectionStatus.ONLINE ? 'bg-tactical-success animate-pulse' : 'bg-tactical-danger'}`} />
                      {formatLastUpdate(unit.lastUpdate)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs">Last updated: {unit.lastUpdate.toLocaleTimeString()}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-tactical-dark" aria-hidden="true">
                    {getUnitTypeIcon(unit.type)}
                  </span>
                  <div>
                    <div className="font-bold text-sm">{unit.callsign}</div>
                    <div className="text-xs text-gray-400">{unit.type}</div>
                  </div>
                </div>
                <Badge 
                  className={`${getConnectionStatusColor(unit.connectionStatus)} text-white text-xs px-2 py-0 h-5 uppercase`}
                >
                  {unit.connectionStatus}
                </Badge>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-mono">PERSONNEL</span>
                  <span className="font-mono font-bold">{unit.status.personnel}%</span>
                </div>
                <Progress 
                  value={unit.status.personnel} 
                  className="h-1.5 bg-gray-800" 
                  indicatorClassName={getStatusColor(unit.status.personnel)}
                />
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-mono">AMMUNITION</span>
                  <span className="font-mono font-bold">{unit.status.ammo}%</span>
                </div>
                <Progress 
                  value={unit.status.ammo} 
                  className="h-1.5 bg-gray-800" 
                  indicatorClassName={getStatusColor(unit.status.ammo)}
                />
              </div>
              
              <div className="mb-1">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-mono">FUEL</span>
                  <span className="font-mono font-bold">{unit.status.fuel}%</span>
                </div>
                <Progress 
                  value={unit.status.fuel} 
                  className="h-1.5 bg-gray-800" 
                  indicatorClassName={getStatusColor(unit.status.fuel)}
                />
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-400 mt-3 font-mono">
                <span>
                  {unit.position.lat.toFixed(1)}°N, {unit.position.lng.toFixed(1)}°E
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UnitStatus;
