
import { Unit, UnitType } from "@/utils/types";
import { Progress } from "@/components/ui/progress";

interface UnitStatusProps {
  units: Unit[];
}

const UnitStatus = ({ units }: UnitStatusProps) => {
  const getUnitTypeIcon = (type: UnitType) => {
    switch (type) {
      case UnitType.INFANTRY:
        return "👤";
      case UnitType.ARMOR:
        return "🔶";
      case UnitType.AIR:
        return "✈️";
      case UnitType.COMMAND:
        return "⭐";
      case UnitType.SUPPORT:
        return "🔧";
      default:
        return "❓";
    }
  };
  
  const formatTimeSince = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    
    if (diffMinutes < 1) return "< 1m ago";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  return (
    <div className="bg-tactical-dark p-4 rounded-lg border border-tactical-primary">
      <h3 className="text-sm font-semibold mb-3">UNIT STATUS</h3>
      
      <div className="space-y-3">
        {units.map(unit => (
          <div
            key={unit.id}
            className="p-2 rounded bg-black bg-opacity-20 border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className={`text-sm ${
                    unit.connectionStatus === 'ONLINE' ? 'text-tactical-success' :
                    unit.connectionStatus === 'MESH_ONLY' ? 'text-tactical-warning' :
                    unit.connectionStatus === 'DEGRADED' ? 'text-amber-500' : 'text-tactical-danger'
                  }`}
                >
                  •
                </span>
                <span className="font-medium">{unit.callsign}</span>
                <span className="text-xs bg-tactical-primary px-2 py-0.5 rounded">
                  {getUnitTypeIcon(unit.type)} {unit.type}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {formatTimeSince(unit.lastUpdate)}
              </div>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <div className="flex justify-between">
                  <span>Personnel</span>
                  <span>{unit.status.personnel}</span>
                </div>
                <Progress value={unit.status.personnel} className="h-1" />
              </div>
              
              <div>
                <div className="flex justify-between">
                  <span>Condition</span>
                  <span>{unit.status.condition}%</span>
                </div>
                <Progress 
                  value={unit.status.condition} 
                  className="h-1" 
                  indicatorClassName={
                    unit.status.condition > 70 ? "bg-tactical-success" :
                    unit.status.condition > 30 ? "bg-tactical-warning" : 
                    "bg-tactical-danger"
                  }
                />
              </div>
              
              <div>
                <div className="flex justify-between">
                  <span>Ammo</span>
                  <span>{unit.status.ammo}%</span>
                </div>
                <Progress 
                  value={unit.status.ammo} 
                  className="h-1"
                  indicatorClassName={
                    unit.status.ammo > 60 ? "bg-tactical-success" :
                    unit.status.ammo > 30 ? "bg-tactical-warning" : 
                    "bg-tactical-danger"
                  }
                />
              </div>
              
              <div>
                <div className="flex justify-between">
                  <span>Fuel</span>
                  <span>{unit.status.fuel}%</span>
                </div>
                <Progress 
                  value={unit.status.fuel} 
                  className="h-1"
                  indicatorClassName={
                    unit.status.fuel > 60 ? "bg-tactical-success" :
                    unit.status.fuel > 30 ? "bg-tactical-warning" : 
                    "bg-tactical-danger"
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnitStatus;
