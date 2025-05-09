
import { useState } from "react";
import { 
  Command, 
  Unit, 
  CommandType,
  Coordinates 
} from "@/utils/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface CommandCenterProps {
  commands: Command[];
  units: Unit[];
  issueCommand: (
    commandType: CommandType,
    targetUnitIds: string[],
    description: string,
    coordinates?: Coordinates
  ) => Command;
}

const CommandCenter = ({ commands, units, issueCommand }: CommandCenterProps) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CommandType>(CommandType.MOVE);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  
  const getCommandBadgeColor = (type: CommandType) => {
    switch (type) {
      case CommandType.MOVE:
        return "bg-tactical-warning text-black";
      case CommandType.ENGAGE:
        return "bg-tactical-danger text-white";
      case CommandType.WITHDRAW:
        return "bg-tactical-network text-white";
      case CommandType.HOLD:
        return "bg-tactical-success text-white";
      case CommandType.RECONNECT:
        return "bg-tactical-info text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  const handleCreateCommand = () => {
    if (selectedType && description && selectedUnitIds.length > 0) {
      const coordinates = lat && lng ? {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      } : undefined;
      
      issueCommand(selectedType, selectedUnitIds, description, coordinates);
      
      // Reset form
      setSelectedType(CommandType.MOVE);
      setSelectedUnitIds([]);
      setDescription('');
      setLat('');
      setLng('');
      setOpen(false);
    }
  };
  
  const toggleUnitSelection = (unitId: string) => {
    if (selectedUnitIds.includes(unitId)) {
      setSelectedUnitIds(selectedUnitIds.filter(id => id !== unitId));
    } else {
      setSelectedUnitIds([...selectedUnitIds, unitId]);
    }
  };
  
  return (
    <div className="bg-tactical-dark p-4 rounded-lg border border-tactical-primary">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">COMMAND CENTER</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="bg-tactical-primary border-0">
              Issue Command
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-tactical-dark border border-tactical-primary">
            <DialogHeader>
              <DialogTitle>Issue New Command</DialogTitle>
              <DialogDescription>
                Create a new tactical command for field units
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <label className="text-sm">Command Type</label>
                <Select 
                  value={selectedType} 
                  onValueChange={(value) => setSelectedType(value as CommandType)}
                >
                  <SelectTrigger className="bg-tactical-primary border-0">
                    <SelectValue placeholder="Select command type" />
                  </SelectTrigger>
                  <SelectContent className="bg-tactical-dark border border-tactical-primary">
                    {Object.values(CommandType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Target Units</label>
                <div className="max-h-32 overflow-y-auto space-y-2 border border-tactical-primary rounded p-2">
                  {units.filter(u => u.connectionStatus !== 'OFFLINE').map(unit => (
                    <div 
                      key={unit.id}
                      className={`flex items-center p-1 rounded cursor-pointer ${
                        selectedUnitIds.includes(unit.id) 
                          ? 'bg-tactical-primary bg-opacity-30' 
                          : 'hover:bg-tactical-primary hover:bg-opacity-20'
                      }`}
                      onClick={() => toggleUnitSelection(unit.id)}
                    >
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        unit.connectionStatus === 'ONLINE' ? 'bg-tactical-success' :
                        unit.connectionStatus === 'MESH_ONLY' ? 'bg-tactical-warning' :
                        'bg-tactical-danger'
                      }`}></div>
                      <span className="flex-1 text-sm">{unit.callsign}</span>
                      <span className="text-xs px-1 rounded bg-tactical-primary bg-opacity-50">
                        {unit.type}
                      </span>
                    </div>
                  ))}
                </div>
                {selectedUnitIds.length > 0 && (
                  <div className="text-xs text-tactical-info">
                    {selectedUnitIds.length} unit{selectedUnitIds.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Description</label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter command details"
                  className="bg-tactical-dark border-tactical-primary resize-none"
                />
              </div>
              
              {(selectedType === CommandType.MOVE || selectedType === CommandType.ENGAGE || selectedType === CommandType.HOLD) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm">Latitude</label>
                    <Input 
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="e.g. 28.218"
                      className="bg-tactical-dark border-tactical-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Longitude</label>
                    <Input 
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="e.g. 94.727"
                      className="bg-tactical-dark border-tactical-primary"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleCreateCommand}
                disabled={!selectedType || !description || selectedUnitIds.length === 0}
                className="bg-tactical-primary hover:bg-tactical-primary hover:brightness-110"
              >
                Issue Command
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-3 max-h-72 overflow-y-auto">
        {commands.length === 0 ? (
          <div className="text-center text-gray-400 py-6">
            No active commands
          </div>
        ) : (
          commands.map(command => (
            <div 
              key={command.id}
              className="p-3 rounded bg-black bg-opacity-20 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${getCommandBadgeColor(command.type)}`}>
                    {command.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    From: {command.issuerCallsign}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(command.timestamp)}
                </span>
              </div>
              
              <div className="mb-2 text-sm">
                {command.description}
              </div>
              
              {command.coordinates && (
                <div className="mb-2 text-xs text-gray-400">
                  Coordinates: {command.coordinates.lat.toFixed(3)}, {command.coordinates.lng.toFixed(3)}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  {command.targetUnitIds.map((unitId, index) => {
                    const unit = units.find(u => u.id === unitId);
                    return (
                      <span key={unitId} className="mr-2">
                        {unit?.callsign || unitId}
                        {index < command.targetUnitIds.length - 1 ? ',' : ''}
                      </span>
                    );
                  })}
                </div>
                
                <span className={`text-xs px-2 py-0.5 rounded ${
                  command.acknowledged 
                    ? 'bg-tactical-success bg-opacity-20 text-tactical-success' 
                    : 'bg-tactical-warning bg-opacity-20 text-tactical-warning'
                }`}>
                  {command.acknowledged ? 'Acknowledged' : 'Pending'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommandCenter;
