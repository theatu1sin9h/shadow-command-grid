
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnitType, ConnectionStatus } from "@/utils/types";
import { Slider } from "@/components/ui/slider";

interface AddUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddUnit: (unitData: any) => void;
}

const AddUnitDialog = ({ open, onOpenChange, onAddUnit }: AddUnitDialogProps) => {
  const [callsign, setCallsign] = useState("");
  const [unitType, setUnitType] = useState<UnitType>(UnitType.INFANTRY);
  const [personnel, setPersonnel] = useState(100);
  const [ammo, setAmmo] = useState(100);
  const [fuel, setFuel] = useState(100);
  const [lat, setLat] = useState(28.218);
  const [lng, setLng] = useState(94.727);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newUnit = {
      id: `unit-${Date.now()}`,
      callsign: callsign,
      type: unitType,
      position: { lat, lng },
      status: {
        personnel,
        condition: 100,
        ammo,
        fuel
      },
      lastUpdate: new Date(),
      connectionStatus: ConnectionStatus.ONLINE
    };
    
    onAddUnit(newUnit);
    resetForm();
    onOpenChange(false);
  };
  
  const resetForm = () => {
    setCallsign("");
    setUnitType(UnitType.INFANTRY);
    setPersonnel(100);
    setAmmo(100);
    setFuel(100);
    setLat(28.218);
    setLng(94.727);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-tactical-dark text-white border-tactical-primary sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-tactical-primary font-mono">ADD NEW UNIT</DialogTitle>
          <DialogDescription className="text-gray-400">
            Deploy a new unit to the tactical map
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="callsign" className="font-mono text-xs">CALLSIGN</Label>
            <Input
              id="callsign"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              className="bg-black/30 border-gray-700 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type" className="font-mono text-xs">UNIT TYPE</Label>
            <Select
              value={unitType}
              onValueChange={(value) => setUnitType(value as UnitType)}
            >
              <SelectTrigger className="bg-black/30 border-gray-700 text-white">
                <SelectValue placeholder="Select unit type" />
              </SelectTrigger>
              <SelectContent className="bg-tactical-dark text-white border-gray-700">
                <SelectItem value={UnitType.INFANTRY}>INFANTRY</SelectItem>
                <SelectItem value={UnitType.ARMOR}>ARMOR</SelectItem>
                <SelectItem value={UnitType.AIR}>AIR</SelectItem>
                <SelectItem value={UnitType.COMMAND}>COMMAND</SelectItem>
                <SelectItem value={UnitType.SUPPORT}>SUPPORT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat" className="font-mono text-xs">LATITUDE</Label>
              <Input
                id="lat"
                type="number"
                step="0.001"
                min="6.5"
                max="37.5"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng" className="font-mono text-xs">LONGITUDE</Label>
              <Input
                id="lng"
                type="number"
                step="0.001"
                min="68"
                max="97.5"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="personnel" className="font-mono text-xs">PERSONNEL: {personnel}%</Label>
            </div>
            <Slider
              id="personnel"
              defaultValue={[100]}
              max={100}
              step={1}
              value={[personnel]}
              onValueChange={(values) => setPersonnel(values[0])}
              className="my-4"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="ammo" className="font-mono text-xs">AMMUNITION: {ammo}%</Label>
            </div>
            <Slider
              id="ammo"
              defaultValue={[100]}
              max={100}
              step={1}
              value={[ammo]}
              onValueChange={(values) => setAmmo(values[0])}
              className="my-4"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="fuel" className="font-mono text-xs">FUEL: {fuel}%</Label>
            </div>
            <Slider
              id="fuel"
              defaultValue={[100]}
              max={100}
              step={1}
              value={[fuel]}
              onValueChange={(values) => setFuel(values[0])}
              className="my-4"
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              CANCEL
            </Button>
            <Button 
              type="submit"
              className="bg-tactical-primary hover:bg-tactical-primary/80 text-white font-mono"
            >
              DEPLOY UNIT
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUnitDialog;
