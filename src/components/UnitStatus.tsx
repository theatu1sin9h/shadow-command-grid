
import React from "react";
import { Unit, ConnectionStatus } from "@/utils/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const getUnitTypeIcon = (type: string) => {
    switch (type) {
      case "INFANTRY":
        return "👤";
      case "ARMOR":
        return "🛡️";
      case "AIR":
        return "🚁";
      case "COMMAND":
        return "🎖️";
      case "SUPPORT":
        return "🔧";
      default:
        return "⚙️";
    }
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins === 1) {
      return "1 min ago";
    } else if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      if (hours === 1) {
        return "1 hour ago";
      } else {
        return `${hours} hours ago`;
      }
    }
  };

  return (
    <div className="bg-tactical-dark p-4 rounded-lg border border-tactical-primary h-full">
      <h3 className="text-sm font-semibold mb-3">UNIT STATUS</h3>
      
      <div className="space-y-3 max-h-[calc(100%-2rem)] overflow-y-auto pr-1">
        {units.map(unit => (
          <Card key={unit.id} className="bg-black bg-opacity-30 border-gray-800">
            <CardContent className="p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden="true">
                    {getUnitTypeIcon(unit.type)}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{unit.callsign}</div>
                    <div className="text-xs text-gray-400">{unit.type}</div>
                  </div>
                </div>
                <Badge 
                  className={`${getConnectionStatusColor(unit.connectionStatus)} text-white text-xs px-2 py-0 h-5`}
                >
                  {unit.connectionStatus}
                </Badge>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span>Personnel</span>
                  <span>{unit.status.personnel}</span>
                </div>
                <Progress 
                  value={unit.status.personnel} 
                  className="h-1.5 bg-gray-800" 
                />
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span>Ammunition</span>
                  <span>{unit.status.ammo}%</span>
                </div>
                <Progress 
                  value={unit.status.ammo} 
                  className="h-1.5 bg-gray-800" 
                />
              </div>
              
              <div className="mb-1">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span>Fuel</span>
                  <span>{unit.status.fuel}%</span>
                </div>
                <Progress 
                  value={unit.status.fuel} 
                  className="h-1.5 bg-gray-800" 
                />
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                <span>
                  {unit.position.lat.toFixed(1)}°N, {unit.position.lng.toFixed(1)}°E
                </span>
                <span>{formatLastUpdate(unit.lastUpdate)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UnitStatus;
