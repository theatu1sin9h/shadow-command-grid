import { useEffect, useRef } from "react";
import { Unit, Command } from "@/utils/types";

interface MapProps {
  units: Unit[];
  commands: Command[];
}

const Map = ({ units, commands }: MapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const getUnitColor = (unit: Unit) => {
    switch (unit.type) {
      case "COMMAND": return "#29B6F6"; // blue
      case "INFANTRY": return "#66BB6A"; // green
      case "ARMOR": return "#FFA726"; // orange
      case "AIR": return "#7E57C2"; // purple
      case "SUPPORT": return "#BDBDBD"; // gray
      default: return "#FFFFFF"; // white
    }
  };
  
  useEffect(() => {
    if (!canvasRef.current || units.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale factor
    const padding = 60;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    // Find min and max coordinates to scale properly
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    units.forEach(unit => {
      minLat = Math.min(minLat, unit.position.lat);
      maxLat = Math.max(maxLat, unit.position.lat);
      minLng = Math.min(minLng, unit.position.lng);
      maxLng = Math.max(maxLng, unit.position.lng);
    });
    
    // Add some margin
    const latMargin = (maxLat - minLat) * 0.2;
    const lngMargin = (maxLng - minLng) * 0.2;
    minLat -= latMargin;
    maxLat += latMargin;
    minLng -= lngMargin;
    maxLng += lngMargin;
    
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    
    // Draw terrain features (simplified)
    // Hills
    for (let i = 0; i < 5; i++) {
      const hillX = padding + Math.random() * width;
      const hillY = padding + Math.random() * height;
      const hillRadius = 20 + Math.random() * 30;
      
      ctx.beginPath();
      ctx.arc(hillX, hillY, hillRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(39, 55, 77, 0.4)';
      ctx.fill();
    }
    
    // Rivers
    ctx.beginPath();
    const riverStartX = padding;
    const riverStartY = padding + Math.random() * height;
    ctx.moveTo(riverStartX, riverStartY);
    
    let x = riverStartX;
    let y = riverStartY;
    for (let i = 0; i < 5; i++) {
      x += width / 5;
      y += (Math.random() - 0.5) * 80;
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = 'rgba(41, 182, 246, 0.4)';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Draw grid lines with coordinates
    ctx.strokeStyle = 'rgba(15, 76, 117, 0.2)';
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * height / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.stroke();
      
      const lat = maxLat - (i * latRange / 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.fillText(lat.toFixed(3), 5, y + 3);
    }
    
    // Draw vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = padding + (i * width / 4);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + height);
      ctx.stroke();
      
      const lng = minLng + (i * lngRange / 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.fillText(lng.toFixed(3), x - 15, canvas.height - 5);
    }
    
    // Draw command targets
    commands.forEach(command => {
      if (!command.coordinates) return;
      
      const cmdX = padding + ((command.coordinates.lng - minLng) / lngRange) * width;
      const cmdY = padding + ((command.coordinates.lat - minLat) / latRange) * height;
      
      // Draw command target marker
      ctx.beginPath();
      switch (command.type) {
        case "MOVE":
          // Draw arrow
          drawArrow(ctx, cmdX, cmdY, 15, 'rgba(255, 152, 0, 0.8)');
          break;
        case "ENGAGE":
          // Draw X mark
          ctx.moveTo(cmdX - 10, cmdY - 10);
          ctx.lineTo(cmdX + 10, cmdY + 10);
          ctx.moveTo(cmdX + 10, cmdY - 10);
          ctx.lineTo(cmdX - 10, cmdY + 10);
          ctx.strokeStyle = 'rgba(244, 67, 54, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
          break;
        case "WITHDRAW":
          // Draw retreat arrow
          drawArrow(ctx, cmdX, cmdY, 15, 'rgba(103, 58, 183, 0.8)', true);
          break;
        case "HOLD":
          // Draw square
          ctx.rect(cmdX - 10, cmdY - 10, 20, 20);
          ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
          break;
        default:
          // Draw circle
          ctx.arc(cmdX, cmdY, 10, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
      }
      
      // Connect command to target units with dotted lines
      command.targetUnitIds.forEach(targetId => {
        const targetUnit = units.find(u => u.id === targetId);
        if (!targetUnit) return;
        
        const unitX = padding + ((targetUnit.position.lng - minLng) / lngRange) * width;
        const unitY = padding + ((targetUnit.position.lat - minLat) / latRange) * height;
        
        ctx.beginPath();
        ctx.moveTo(cmdX, cmdY);
        ctx.lineTo(unitX, unitY);
        ctx.setLineDash([5, 3]);
        
        switch (command.type) {
          case "MOVE":
            ctx.strokeStyle = 'rgba(255, 152, 0, 0.6)';
            break;
          case "ENGAGE":
            ctx.strokeStyle = 'rgba(244, 67, 54, 0.6)';
            break;
          case "WITHDRAW":
            ctx.strokeStyle = 'rgba(103, 58, 183, 0.6)';
            break;
          case "HOLD":
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
            break;
          default:
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        }
        
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });
    
    // Draw units
    units.forEach(unit => {
      const unitX = padding + ((unit.position.lng - minLng) / lngRange) * width;
      const unitY = padding + ((unit.position.lat - minLat) / latRange) * height;
      
      // Draw unit position
      ctx.beginPath();
      
      if (unit.type === "AIR") {
        // Triangle for air units
        ctx.moveTo(unitX, unitY - 10);
        ctx.lineTo(unitX + 10, unitY + 10);
        ctx.lineTo(unitX - 10, unitY + 10);
        ctx.closePath();
      } else if (unit.type === "ARMOR") {
        // Rectangle for armor
        ctx.rect(unitX - 8, unitY - 8, 16, 16);
      } else {
        // Circle for others
        ctx.arc(unitX, unitY, 8, 0, Math.PI * 2);
      }
      
      ctx.fillStyle = getUnitColor(unit);
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw unit callsign
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(unit.callsign, unitX + 12, unitY);
      
      // Connection status indicator
      if (unit.connectionStatus !== 'ONLINE') {
        ctx.beginPath();
        ctx.arc(unitX, unitY, 12, 0, Math.PI * 2);
        ctx.strokeStyle = unit.connectionStatus === 'MESH_ONLY' ? 
                           'rgba(255, 167, 38, 0.7)' : 
                           unit.connectionStatus === 'DEGRADED' ?
                           'rgba(255, 87, 34, 0.7)' :
                           'rgba(244, 67, 54, 0.7)';
        ctx.lineWidth = 1.5;
        
        if (unit.connectionStatus === 'OFFLINE') {
          // Solid line for offline
          ctx.stroke();
        } else {
          // Pulsing effect for degraded/mesh
          const opacity = (Math.sin(Date.now() / 500) + 1) / 2 * 0.7 + 0.3;
          ctx.strokeStyle = unit.connectionStatus === 'MESH_ONLY' ? 
                            `rgba(255, 167, 38, ${opacity})` : 
                            `rgba(255, 87, 34, ${opacity})`;
          ctx.stroke();
        }
      }
    });
    
    // Keep animation going
    const animId = requestAnimationFrame(() => {
      if (canvasRef.current) {
        canvasRef.current.setAttribute('data-timestamp', Date.now().toString());
      }
    });
    
    return () => cancelAnimationFrame(animId);
  }, [units, commands, canvasRef.current?.getAttribute('data-timestamp')]);
  
  // Helper function to draw an arrow
  const drawArrow = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    size: number, 
    color: string, 
    reversed = false
  ) => {
    ctx.beginPath();
    
    if (reversed) {
      // Arrow pointing down (retreat)
      ctx.moveTo(x, y + size);
      ctx.lineTo(x - size, y - size);
      ctx.moveTo(x, y + size);
      ctx.lineTo(x + size, y - size);
      ctx.moveTo(x, y + size);
      ctx.lineTo(x, y - size);
    } else {
      // Arrow pointing up (advance)
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size, y + size);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  
  return (
    <div className="bg-tactical-dark p-4 rounded-lg border border-tactical-primary h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">TACTICAL MAP</h3>
        <div className="text-xs text-gray-400">Arunachal Pradesh Region</div>
      </div>
      
      <div className="bg-black bg-opacity-30 rounded border border-gray-800 overflow-hidden map-container relative">
        <div className="terrain-overlay absolute inset-0"></div>
        <canvas 
          ref={canvasRef} 
          width={900} 
          height={600} 
          className="w-full h-full"
          data-timestamp={Date.now().toString()}
        />
      </div>
    </div>
  );
};

export default Map;
