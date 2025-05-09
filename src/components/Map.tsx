import { useEffect, useRef, useState } from "react";
import { Unit, Command, Coordinates } from "@/utils/types";

interface MapProps {
  units: Unit[];
  commands: Command[];
}

const Map = ({ units, commands }: MapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  
  // India's geographical boundaries (approximate)
  const indiaGeoBounds = {
    minLat: 6.5, // Southern tip
    maxLat: 37.5, // Northern borders
    minLng: 68, // Western borders
    maxLng: 97.5, // Eastern borders
  };
  
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

  const isPointInIndia = (lat: number, lng: number): boolean => {
    return (
      lat >= indiaGeoBounds.minLat && 
      lat <= indiaGeoBounds.maxLat && 
      lng >= indiaGeoBounds.minLng && 
      lng <= indiaGeoBounds.maxLng
    );
  };
  
  // Simple state borders for major regions
  const regions = [
    { name: "Arunachal Pradesh", center: { lat: 28.2, lng: 94.7 }, radius: 1.2 },
    { name: "Ladakh", center: { lat: 34.2, lng: 77.6 }, radius: 1.4 },
    { name: "Kashmir", center: { lat: 33.8, lng: 75.3 }, radius: 1.1 },
    { name: "Punjab", center: { lat: 31.1, lng: 75.3 }, radius: 0.9 },
    { name: "Gujarat", center: { lat: 22.2, lng: 71.5 }, radius: 1.3 },
    { name: "Rajasthan", center: { lat: 26.5, lng: 73.8 }, radius: 1.8 },
    { name: "Maharashtra", center: { lat: 19.7, lng: 76.0 }, radius: 1.6 },
    { name: "Tamil Nadu", center: { lat: 11.1, lng: 78.6 }, radius: 1.2 },
    { name: "West Bengal", center: { lat: 23.0, lng: 87.8 }, radius: 1.0 },
    { name: "Assam", center: { lat: 26.2, lng: 92.9 }, radius: 0.9 },
  ];
  
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    // Convert to lat/lng based on our current view
    const lat = indiaGeoBounds.maxLat - ((y - 60) / (canvas.height - 120)) * (indiaGeoBounds.maxLat - indiaGeoBounds.minLat);
    const lng = indiaGeoBounds.minLng + ((x - 60) / (canvas.width - 120)) * (indiaGeoBounds.maxLng - indiaGeoBounds.minLng);
    
    // Check if a unit was clicked
    const clickedUnit = units.find(unit => {
      const unitX = 60 + ((unit.position.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * (canvas.width - 120);
      const unitY = 60 + ((indiaGeoBounds.maxLat - unit.position.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * (canvas.height - 120);
      
      const dx = x - unitX;
      const dy = y - unitY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      return distance < 15; // 15 pixels radius for click detection
    });
    
    if (clickedUnit) {
      setSelectedRegion(null);
      setHoveredUnit(clickedUnit.id);
    } else {
      setHoveredUnit(null);
      
      // Check if a region was clicked
      const clickedRegion = regions.find(region => {
        const regionX = 60 + ((region.center.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * (canvas.width - 120);
        const regionY = 60 + ((indiaGeoBounds.maxLat - region.center.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * (canvas.height - 120);
        
        const dx = x - regionX;
        const dy = y - regionY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        const radiusInPixels = region.radius * ((canvas.width - 120) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng));
        
        return distance < radiusInPixels;
      });
      
      if (clickedRegion) {
        setSelectedRegion(clickedRegion.name);
      } else {
        setSelectedRegion(null);
      }
    }
  };
  
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    if (isDragging) {
      const movementX = event.movementX;
      const movementY = event.movementY;
      
      setMapOffset(prev => ({
        x: prev.x + movementX,
        y: prev.y + movementY
      }));
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    // Check if mouse is over a unit
    const mouseOverUnit = units.find(unit => {
      const unitX = 60 + ((unit.position.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * (canvas.width - 120);
      const unitY = 60 + ((indiaGeoBounds.maxLat - unit.position.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * (canvas.height - 120);
      
      const dx = x - unitX;
      const dy = y - unitY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      return distance < 10;
    });
    
    if (mouseOverUnit && !isDragging) {
      canvas.style.cursor = 'pointer';
      setHoveredUnit(mouseOverUnit.id);
    } else if (!isDragging) {
      // Check if mouse is over a region
      const mouseOverRegion = regions.find(region => {
        const regionX = 60 + ((region.center.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * (canvas.width - 120);
        const regionY = 60 + ((indiaGeoBounds.maxLat - region.center.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * (canvas.height - 120);
        
        const dx = x - regionX;
        const dy = y - regionY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        const radiusInPixels = region.radius * ((canvas.width - 120) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng));
        
        return distance < radiusInPixels;
      });
      
      if (mouseOverRegion) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
        setHoveredUnit(null);
      }
    }
  };
  
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    const delta = event.deltaY * -0.01;
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 4);
    
    setZoom(newZoom);
  };
  
  useEffect(() => {
    if (!canvasRef.current || units.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan transformations
    ctx.save();
    
    // Center the map
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply zoom
    ctx.scale(zoom, zoom);
    
    // Apply pan offset
    ctx.translate(mapOffset.x / zoom, mapOffset.y / zoom);
    
    // Center back
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Scale factor
    const padding = 60;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    // Draw India outline
    ctx.beginPath();
    ctx.rect(
      padding, 
      padding, 
      width, 
      height
    );
    ctx.strokeStyle = 'rgba(41, 182, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw regions
    regions.forEach(region => {
      const regionX = padding + ((region.center.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * width;
      const regionY = padding + ((indiaGeoBounds.maxLat - region.center.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * height;
      const regionRadius = region.radius * (width / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng));
      
      ctx.beginPath();
      ctx.arc(regionX, regionY, regionRadius, 0, Math.PI * 2);
      
      if (selectedRegion === region.name) {
        ctx.fillStyle = 'rgba(15, 76, 117, 0.3)';
        ctx.fill();
      }
      
      ctx.strokeStyle = 'rgba(15, 76, 117, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw region name
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(region.name, regionX, regionY);
    });
    
    // Draw terrain features (simplified)
    // Hills and mountains along northern border
    for (let i = 0; i < 10; i++) {
      const hillX = padding + (i * width / 10) + (Math.random() * width / 10);
      const hillY = padding + Math.random() * (height / 4);
      const hillRadius = 10 + Math.random() * 20;
      
      ctx.beginPath();
      ctx.arc(hillX, hillY, hillRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(39, 55, 77, 0.3)';
      ctx.fill();
    }
    
    // Rivers
    // Ganges
    ctx.beginPath();
    ctx.moveTo(padding + width * 0.6, padding);
    ctx.quadraticCurveTo(
      padding + width * 0.7, padding + height * 0.5,
      padding + width * 0.85, padding + height * 0.9
    );
    ctx.strokeStyle = 'rgba(41, 182, 246, 0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Brahmaputra
    ctx.beginPath();
    ctx.moveTo(padding + width * 0.9, padding + height * 0.2);
    ctx.quadraticCurveTo(
      padding + width * 0.75, padding + height * 0.3,
      padding + width * 0.85, padding + height * 0.4
    );
    ctx.strokeStyle = 'rgba(41, 182, 246, 0.4)';
    ctx.lineWidth = 3;
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
      
      const lat = indiaGeoBounds.maxLat - (i * (indiaGeoBounds.maxLat - indiaGeoBounds.minLat) / 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(lat.toFixed(1) + '°N', 5, y + 3);
    }
    
    // Draw vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = padding + (i * width / 4);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + height);
      ctx.stroke();
      
      const lng = indiaGeoBounds.minLng + (i * (indiaGeoBounds.maxLng - indiaGeoBounds.minLng) / 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lng.toFixed(1) + '°E', x, canvas.height - 5);
    }
    
    // Draw command targets
    commands.forEach(command => {
      if (!command.coordinates) return;
      
      const cmdX = padding + ((command.coordinates.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * width;
      const cmdY = padding + ((indiaGeoBounds.maxLat - command.coordinates.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * height;
      
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
        
        const unitX = padding + ((targetUnit.position.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * width;
        const unitY = padding + ((indiaGeoBounds.maxLat - targetUnit.position.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * height;
        
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
      if (!isPointInIndia(unit.position.lat, unit.position.lng)) return;
      
      const unitX = padding + ((unit.position.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * width;
      const unitY = padding + ((indiaGeoBounds.maxLat - unit.position.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * height;
      
      // Highlight if hovered or selected
      if (hoveredUnit === unit.id) {
        ctx.beginPath();
        ctx.arc(unitX, unitY, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      }
      
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
      ctx.textAlign = 'left';
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
    
    // Restore the canvas state
    ctx.restore();
    
    // Draw UI overlay for selected unit or region
    if (hoveredUnit || selectedRegion) {
      ctx.fillStyle = 'rgba(10, 25, 41, 0.7)';
      ctx.fillRect(10, canvas.height - 80, 250, 70);
      ctx.strokeStyle = '#0F4C75';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, canvas.height - 80, 250, 70);
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      
      if (hoveredUnit) {
        const unit = units.find(u => u.id === hoveredUnit);
        if (unit) {
          ctx.fillText(`Unit: ${unit.callsign} (${unit.type})`, 20, canvas.height - 60);
          ctx.fillText(`Status: ${unit.connectionStatus}`, 20, canvas.height - 40);
          ctx.fillText(`Position: ${unit.position.lat.toFixed(2)}°N, ${unit.position.lng.toFixed(2)}°E`, 20, canvas.height - 20);
        }
      } else if (selectedRegion) {
        ctx.fillText(`Region: ${selectedRegion}`, 20, canvas.height - 60);
        const region = regions.find(r => r.name === selectedRegion);
        if (region) {
          ctx.fillText(`Center: ${region.center.lat.toFixed(2)}°N, ${region.center.lng.toFixed(2)}°E`, 20, canvas.height - 40);
          ctx.fillText(`Units: ${units.filter(u => 
            Math.abs(u.position.lat - region.center.lat) < region.radius && 
            Math.abs(u.position.lng - region.center.lng) < region.radius
          ).length}`, 20, canvas.height - 20);
        }
      }
    }
    
    // Draw zoom controls
    ctx.fillStyle = 'rgba(10, 25, 41, 0.7)';
    ctx.fillRect(canvas.width - 50, 20, 30, 60);
    ctx.strokeStyle = '#0F4C75';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - 50, 20, 30, 60);
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+', canvas.width - 35, 40);
    
    ctx.beginPath();
    ctx.moveTo(canvas.width - 45, 50);
    ctx.lineTo(canvas.width - 25, 50);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillText('-', canvas.width - 35, 70);
    
    // Keep animation going
    const animId = requestAnimationFrame(() => {
      if (canvasRef.current) {
        canvasRef.current.setAttribute('data-timestamp', Date.now().toString());
      }
    });
    
    return () => cancelAnimationFrame(animId);
  }, [units, commands, canvasRef.current?.getAttribute('data-timestamp'), hoveredUnit, selectedRegion, isDragging, mapOffset, zoom]);
  
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
        <h3 className="text-sm font-semibold">TACTICAL MAP - INDIA</h3>
        <div className="text-xs text-gray-400">{selectedRegion || "Full Territory View"}</div>
      </div>
      
      <div className="bg-black bg-opacity-30 rounded border border-gray-800 overflow-hidden map-container relative">
        <div className="terrain-overlay absolute inset-0"></div>
        <canvas 
          ref={canvasRef} 
          width={900} 
          height={600} 
          className="w-full h-full cursor-grab"
          data-timestamp={Date.now().toString()}
          onClick={handleCanvasClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
};

export default Map;
