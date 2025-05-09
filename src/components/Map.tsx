import { useEffect, useRef, useState } from "react";
import { Unit, Command, Coordinates, CommandType, UnitType } from "@/utils/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MilitarySquare, Navigation, Flag, FlagTriangleRight } from "lucide-react";

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
  const [showGrid, setShowGrid] = useState(true);
  const [showTerrain, setShowTerrain] = useState(true);
  
  // India's geographical boundaries (approximate)
  const indiaGeoBounds = {
    minLat: 6.5, // Southern tip
    maxLat: 37.5, // Northern borders
    minLng: 68, // Western borders
    maxLng: 97.5, // Eastern borders
  };
  
  const getUnitColor = (unit: Unit) => {
    switch (unit.type) {
      case UnitType.COMMAND: return "#29B6F6"; // blue
      case UnitType.INFANTRY: return "#66BB6A"; // green
      case UnitType.ARMOR: return "#FFA726"; // orange
      case UnitType.AIR: return "#7E57C2"; // purple
      case UnitType.SUPPORT: return "#BDBDBD"; // gray
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
  
  // Strategic regions with clear labeling
  const regions = [
    { name: "ARUNACHAL PRADESH", center: { lat: 28.2, lng: 94.7 }, radius: 1.2, strategic: true },
    { name: "LADAKH", center: { lat: 34.2, lng: 77.6 }, radius: 1.4, strategic: true },
    { name: "KASHMIR", center: { lat: 33.8, lng: 75.3 }, radius: 1.1, strategic: true },
    { name: "PUNJAB", center: { lat: 31.1, lng: 75.3 }, radius: 0.9, strategic: false },
    { name: "GUJARAT", center: { lat: 22.2, lng: 71.5 }, radius: 1.3, strategic: false },
    { name: "RAJASTHAN", center: { lat: 26.5, lng: 73.8 }, radius: 1.8, strategic: false },
    { name: "MAHARASHTRA", center: { lat: 19.7, lng: 76.0 }, radius: 1.6, strategic: false },
    { name: "TAMIL NADU", center: { lat: 11.1, lng: 78.6 }, radius: 1.2, strategic: false },
    { name: "WEST BENGAL", center: { lat: 23.0, lng: 87.8 }, radius: 1.0, strategic: false },
    { name: "ASSAM", center: { lat: 26.2, lng: 92.9 }, radius: 0.9, strategic: false },
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
    
    // Draw tactical map background with military-style grid
    ctx.fillStyle = '#1A2130'; // Dark blue background for night vision compatibility
    ctx.fillRect(padding, padding, width, height);
    
    // Draw India outline with highlighted borders
    ctx.beginPath();
    ctx.rect(
      padding, 
      padding, 
      width, 
      height
    );
    ctx.strokeStyle = 'rgba(41, 182, 246, 0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Add subtle border pattern for tactical feel
    ctx.strokeStyle = 'rgba(41, 182, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(padding + 5, padding + 5, width - 10, height - 10);
    ctx.setLineDash([]);
    
    // Draw regions with clearer tactical significance
    regions.forEach(region => {
      const regionX = padding + ((region.center.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * width;
      const regionY = padding + ((indiaGeoBounds.maxLat - region.center.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * height;
      const regionRadius = region.radius * (width / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng));
      
      ctx.beginPath();
      ctx.arc(regionX, regionY, regionRadius, 0, Math.PI * 2);
      
      if (selectedRegion === region.name) {
        // Highlight selected region more prominently
        ctx.fillStyle = region.strategic ? 'rgba(244, 67, 54, 0.2)' : 'rgba(15, 76, 117, 0.3)';
        ctx.fill();
        ctx.strokeStyle = region.strategic ? 'rgba(244, 67, 54, 0.7)' : 'rgba(15, 76, 117, 0.7)';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = region.strategic ? 'rgba(244, 67, 54, 0.05)' : 'rgba(15, 76, 117, 0.05)';
        ctx.fill();
        ctx.strokeStyle = region.strategic ? 'rgba(244, 67, 54, 0.4)' : 'rgba(15, 76, 117, 0.4)';
        ctx.lineWidth = 1;
      }
      
      ctx.stroke();
      
      // Draw region name in military stencil style
      ctx.fillStyle = region.strategic ? 'rgba(255, 200, 200, 0.9)' : 'rgba(200, 200, 255, 0.9)';
      ctx.font = region.strategic ? 'bold 12px monospace' : '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(region.name, regionX, regionY);
    });
    
    if (showTerrain) {
      // Draw terrain features with better tactical representation
      // Northern mountains (Himalayas)
      for (let i = 0; i < 15; i++) {
        const mountainX = padding + (i * width / 15) + (Math.random() * width / 30);
        const mountainY = padding + Math.random() * (height / 5);
        
        // Mountain symbol (triangle)
        ctx.beginPath();
        ctx.moveTo(mountainX, mountainY + 15);
        ctx.lineTo(mountainX - 10, mountainY - 5);
        ctx.lineTo(mountainX + 10, mountainY - 5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(39, 55, 77, 0.5)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 120, 150, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Forests in central regions
      for (let i = 0; i < 20; i++) {
        const forestX = padding + Math.random() * width;
        const forestY = padding + height/3 + Math.random() * (height/3);
        
        if (Math.random() > 0.7) {
          // Forest symbol (circle with dot)
          ctx.beginPath();
          ctx.arc(forestX, forestY, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(forestX, forestY, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(76, 175, 80, 0.6)';
          ctx.fill();
        }
      }
    
      // Rivers with proper tactical coloring
      // Ganges
      ctx.beginPath();
      ctx.moveTo(padding + width * 0.6, padding);
      ctx.quadraticCurveTo(
        padding + width * 0.7, padding + height * 0.5,
        padding + width * 0.85, padding + height * 0.9
      );
      ctx.strokeStyle = 'rgba(41, 182, 246, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Brahmaputra
      ctx.beginPath();
      ctx.moveTo(padding + width * 0.9, padding + height * 0.2);
      ctx.quadraticCurveTo(
        padding + width * 0.75, padding + height * 0.3,
        padding + width * 0.85, padding + height * 0.4
      );
      ctx.strokeStyle = 'rgba(41, 182, 246, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    if (showGrid) {
      // Draw grid lines with military coordinates
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.5;
      
      // Draw horizontal grid lines
      for (let i = 0; i <= 8; i++) {
        const y = padding + (i * height / 8);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + width, y);
        ctx.stroke();
        
        const lat = indiaGeoBounds.maxLat - (i * (indiaGeoBounds.maxLat - indiaGeoBounds.minLat) / 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(lat.toFixed(1) + '°N', 5, y + 3);
      }
      
      // Draw vertical grid lines
      for (let i = 0; i <= 8; i++) {
        const x = padding + (i * width / 8);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + height);
        ctx.stroke();
        
        const lng = indiaGeoBounds.minLng + (i * (indiaGeoBounds.maxLng - indiaGeoBounds.minLng) / 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(lng.toFixed(1) + '°E', x, canvas.height - 5);
      }
      
      // Add sector designations for military reference
      const sectorLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const x = padding + (i * width / 8) + (width / 16);
          const y = padding + (j * height / 8) + (height / 16);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${sectorLetters[i]}${j+1}`, x, y);
        }
      }
    }
    
    // Draw command targets with clearer tactical symbology
    commands.forEach(command => {
      if (!command.coordinates) return;
      
      const cmdX = padding + ((command.coordinates.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * width;
      const cmdY = padding + ((indiaGeoBounds.maxLat - command.coordinates.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * height;
      
      // Draw command target marker
      ctx.beginPath();
      switch (command.type) {
        case CommandType.MOVE:
          // Draw move marker (blue arrow)
          drawTacticalSymbol(ctx, cmdX, cmdY, 'MOVE', 'rgba(30, 144, 255, 0.9)');
          break;
        case CommandType.ENGAGE:
          // Draw engage marker (red X)
          drawTacticalSymbol(ctx, cmdX, cmdY, 'ENGAGE', 'rgba(244, 67, 54, 0.9)');
          break;
        case CommandType.WITHDRAW:
          // Draw withdraw marker (purple retreating arrow)
          drawTacticalSymbol(ctx, cmdX, cmdY, 'WITHDRAW', 'rgba(103, 58, 183, 0.9)');
          break;
        case CommandType.HOLD:
          // Draw hold marker (green square)
          drawTacticalSymbol(ctx, cmdX, cmdY, 'HOLD', 'rgba(76, 175, 80, 0.9)');
          break;
        default:
          // Default marker
          drawTacticalSymbol(ctx, cmdX, cmdY, 'DEFAULT', 'rgba(255, 255, 255, 0.9)');
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
          case CommandType.MOVE:
            ctx.strokeStyle = 'rgba(30, 144, 255, 0.7)';
            break;
          case CommandType.ENGAGE:
            ctx.strokeStyle = 'rgba(244, 67, 54, 0.7)';
            break;
          case CommandType.WITHDRAW:
            ctx.strokeStyle = 'rgba(103, 58, 183, 0.7)';
            break;
          case CommandType.HOLD:
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.7)';
            break;
          default:
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        }
        
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });
    
    // Draw units with clearer military symbols
    units.forEach(unit => {
      if (!isPointInIndia(unit.position.lat, unit.position.lng)) return;
      
      const unitX = padding + ((unit.position.lng - indiaGeoBounds.minLng) / (indiaGeoBounds.maxLng - indiaGeoBounds.minLng)) * width;
      const unitY = padding + ((indiaGeoBounds.maxLat - unit.position.lat) / (indiaGeoBounds.maxLat - indiaGeoBounds.minLat)) * height;
      
      // Highlight if hovered or selected
      if (hoveredUnit === unit.id) {
        ctx.beginPath();
        ctx.arc(unitX, unitY, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        
        // Draw selection ring with pulsing effect
        ctx.beginPath();
        ctx.arc(unitX, unitY, 20, 0, Math.PI * 2);
        const pulseOpacity = (Math.sin(Date.now() / 500) + 1) / 2 * 0.5 + 0.2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Draw unit with NATO-style military symbols
      drawUnitSymbol(ctx, unit, unitX, unitY);
      
      // Draw unit callsign
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(unit.callsign, unitX + 15, unitY);
      
      // Connection status indicator with clearer meaning
      if (unit.connectionStatus !== 'ONLINE') {
        ctx.beginPath();
        ctx.arc(unitX, unitY, 14, 0, Math.PI * 2);
        
        // More intuitive colors for different connection states
        if (unit.connectionStatus === 'MESH_ONLY') {
          const pulseSpeed = Math.sin(Date.now() / 1000) * 0.2 + 0.5;
          ctx.strokeStyle = `rgba(255, 193, 7, ${pulseSpeed})`;
          ctx.setLineDash([2, 2]);
        } else if (unit.connectionStatus === 'DEGRADED') {
          const pulseSpeed = Math.sin(Date.now() / 800) * 0.2 + 0.5;
          ctx.strokeStyle = `rgba(255, 87, 34, ${pulseSpeed})`;
          ctx.setLineDash([3, 1]);
        } else {
          // OFFLINE
          ctx.strokeStyle = 'rgba(244, 67, 54, 0.9)';
          ctx.setLineDash([]);
        }
        
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    
    // Restore the canvas state
    ctx.restore();
    
    // Draw UI overlay for selected unit or region
    if (hoveredUnit || selectedRegion) {
      ctx.fillStyle = 'rgba(10, 25, 41, 0.85)';
      ctx.fillRect(10, canvas.height - 100, 280, 90);
      ctx.strokeStyle = '#0F4C75';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, canvas.height - 100, 280, 90);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      
      if (hoveredUnit) {
        const unit = units.find(u => u.id === hoveredUnit);
        if (unit) {
          ctx.fillText(`UNIT: ${unit.callsign} (${unit.type})`, 20, canvas.height - 75);
          
          // Status with color coding
          let statusColor = '#4CAF50'; // green by default
          if (unit.connectionStatus === 'MESH_ONLY') statusColor = '#FFC107'; // amber
          if (unit.connectionStatus === 'DEGRADED') statusColor = '#FF9800'; // orange
          if (unit.connectionStatus === 'OFFLINE') statusColor = '#F44336'; // red
          
          ctx.fillStyle = statusColor;
          ctx.fillText(`STATUS: ${unit.connectionStatus}`, 20, canvas.height - 55);
          ctx.fillStyle = '#fff';
          
          ctx.font = '12px monospace';
          ctx.fillText(`POSITION: ${unit.position.lat.toFixed(2)}°N, ${unit.position.lng.toFixed(2)}°E`, 20, canvas.height - 35);
          
          // Draw status bars
          const barWidth = 260;
          const startX = 20;
          const startY = canvas.height - 20;
          
          // Ammo bar
          ctx.fillStyle = '#555';
          ctx.fillRect(startX, startY, barWidth, 5);
          ctx.fillStyle = unit.status.ammo > 30 ? '#4CAF50' : '#F44336';
          ctx.fillRect(startX, startY, barWidth * (unit.status.ammo / 100), 5);
          ctx.fillStyle = '#fff';
          ctx.font = '9px monospace';
          ctx.fillText(`A:${unit.status.ammo}%`, startX + barWidth + 5, startY + 5);
        }
      } else if (selectedRegion) {
        ctx.fillText(`REGION: ${selectedRegion}`, 20, canvas.height - 75);
        const region = regions.find(r => r.name === selectedRegion);
        if (region) {
          // Show if it's a strategic region
          if (region.strategic) {
            ctx.fillStyle = '#F44336';
            ctx.fillText('STRATEGIC BORDER AREA', 20, canvas.height - 55);
            ctx.fillStyle = '#fff';
          }
          
          ctx.font = '12px monospace';
          ctx.fillText(`CENTER: ${region.center.lat.toFixed(2)}°N, ${region.center.lng.toFixed(2)}°E`, 20, canvas.height - 35);
          
          // Count units in region
          const unitsInRegion = units.filter(u => 
            Math.abs(u.position.lat - region.center.lat) < region.radius && 
            Math.abs(u.position.lng - region.center.lng) < region.radius
          );
          
          ctx.fillText(`DEPLOYED UNITS: ${unitsInRegion.length}`, 20, canvas.height - 15);
        }
      }
    }
    
    // Draw map controls - improved for better visibility
    // Zoom controls 
    ctx.fillStyle = 'rgba(10, 25, 41, 0.85)';
    ctx.fillRect(canvas.width - 50, 20, 30, 100);
    ctx.strokeStyle = '#0F4C75';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - 50, 20, 30, 100);
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+', canvas.width - 35, 40);
    
    ctx.beginPath();
    ctx.moveTo(canvas.width - 45, 50);
    ctx.lineTo(canvas.width - 25, 50);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillText('-', canvas.width - 35, 70);
    
    ctx.beginPath();
    ctx.moveTo(canvas.width - 45, 80);
    ctx.lineTo(canvas.width - 25, 80);
    ctx.stroke();
    
    // Grid toggle
    ctx.font = '10px monospace';
    ctx.fillText('GRID', canvas.width - 35, 95);
    ctx.beginPath();
    ctx.rect(canvas.width - 43, 100, 16, 10);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    if (showGrid) {
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(canvas.width - 41, 102, 12, 6);
    }
    
    // Legend in bottom left
    drawMapLegend(ctx, canvas.width, canvas.height);
    
    // Keep animation going
    const animId = requestAnimationFrame(() => {
      if (canvasRef.current) {
        canvasRef.current.setAttribute('data-timestamp', Date.now().toString());
      }
    });
    
    return () => cancelAnimationFrame(animId);
  }, [units, commands, canvasRef.current?.getAttribute('data-timestamp'), hoveredUnit, selectedRegion, isDragging, mapOffset, zoom, showGrid, showTerrain]);
  
  // Helper function to draw unit symbols
  const drawUnitSymbol = (
    ctx: CanvasRenderingContext2D,
    unit: Unit,
    x: number, 
    y: number
  ) => {
    const fillColor = getUnitColor(unit);
    const size = 10;
    
    ctx.beginPath();
    
    switch (unit.type) {
      case UnitType.INFANTRY:
        // Infantry (X)
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.moveTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
        
      case UnitType.ARMOR:
        // Armor (oval)
        ctx.ellipse(x, y, size * 1.3, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
        
      case UnitType.AIR:
        // Air (triangle)
        ctx.moveTo(x, y - size * 1.2);
        ctx.lineTo(x + size, y + size * 0.8);
        ctx.lineTo(x - size, y + size * 0.8);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
        
      case UnitType.COMMAND:
        // Command (star)
        drawStar(ctx, x, y, 5, size, size/2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
        
      case UnitType.SUPPORT:
        // Support (cross)
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y); 
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
        
      default:
        // Default (circle)
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke;
    }
  };
  
  // Helper function to draw a star (for command units)
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };
  
  // Helper function to draw tactical symbols for commands
  const drawTacticalSymbol = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: string,
    color: string
  ) => {
    const size = 12;
    
    ctx.beginPath();
    
    switch(type) {
      case 'MOVE':
        // Arrow pointing in direction of movement
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size * 0.7, y + size * 0.5);
        ctx.lineTo(x + size * 0.7, y + size * 0.5);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        break;
        
      case 'ENGAGE':
        // Target symbol
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.moveTo(x, y - size * 1.2);
        ctx.lineTo(x, y + size * 1.2);
        ctx.moveTo(x - size * 1.2, y);
        ctx.lineTo(x + size * 1.2, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'WITHDRAW':
        // Retreating symbol (downward arrow)
        ctx.moveTo(x, y + size);
        ctx.lineTo(x - size * 0.7, y - size * 0.5);
        ctx.lineTo(x + size * 0.7, y - size * 0.5);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        break;
        
      case 'HOLD':
        // Box for defensive position
        ctx.rect(x - size * 0.8, y - size * 0.8, size * 1.6, size * 1.6);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
        
      default:
        // Default command marker
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
  };
  
  // Helper function to draw a legend
  const drawMapLegend = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
  ) => {
    const legendX = 10;
    const legendY = 10;
    const boxWidth = 140;
    const boxHeight = 180;
    const itemSpacing = 20;
    
    // Legend background
    ctx.fillStyle = 'rgba(10, 25, 41, 0.85)';
    ctx.fillRect(legendX, legendY, boxWidth, boxHeight);
    ctx.strokeStyle = '#0F4C75';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, boxWidth, boxHeight);
    
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('MAP LEGEND', legendX + 10, legendY + 20);
    
    // Unit symbols
    ctx.font = '11px monospace';
    
    // Infantry
    ctx.beginPath();
    ctx.moveTo(legendX + 15, legendY + 35);
    ctx.lineTo(legendX + 25, legendY + 45);
    ctx.moveTo(legendX + 25, legendY + 35);
    ctx.lineTo(legendX + 15, legendY + 45);
    ctx.strokeStyle = '#66BB6A';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('INFANTRY', legendX + 35, legendY + 42);
    
    // Armor
    ctx.beginPath();
    ctx.ellipse(legendX + 20, legendY + 35 + itemSpacing, 10, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFA726';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('ARMOR', legendX + 35, legendY + 42 + itemSpacing);
    
    // Air
    ctx.beginPath();
    ctx.moveTo(legendX + 20, legendY + 30 + itemSpacing * 2);
    ctx.lineTo(legendX + 28, legendY + 45 + itemSpacing * 2);
    ctx.lineTo(legendX + 12, legendY + 45 + itemSpacing * 2);
    ctx.closePath();
    ctx.fillStyle = '#7E57C2';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('AIR', legendX + 35, legendY + 42 + itemSpacing * 2);
    
    // Command
    drawStar(ctx, legendX + 20, legendY + 40 + itemSpacing * 3, 5, 8, 4);
    ctx.fillStyle = '#29B6F6';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('COMMAND', legendX + 35, legendY + 42 + itemSpacing * 3);
    
    // Support
    ctx.beginPath();
    ctx.moveTo(legendX + 20, legendY + 35 + itemSpacing * 4);
    ctx.lineTo(legendX + 20, legendY + 45 + itemSpacing * 4);
    ctx.moveTo(legendX + 15, legendY + 40 + itemSpacing * 4);
    ctx.lineTo(legendX + 25, legendY + 40 + itemSpacing * 4);
    ctx.strokeStyle = '#BDBDBD';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('SUPPORT', legendX + 35, legendY + 42 + itemSpacing * 4);
    
    // Region types
    ctx.beginPath();
    ctx.arc(legendX + 20, legendY + 40 + itemSpacing * 5, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(244, 67, 54, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('STRATEGIC', legendX + 35, legendY + 42 + itemSpacing * 5);
    
    // Connection status
    ctx.beginPath();
    ctx.arc(legendX + 20, legendY + 40 + itemSpacing * 6, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(244, 67, 54, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('OFFLINE', legendX + 35, legendY + 42 + itemSpacing * 6);
  };
  
  // Handler for legend controls
  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
  };
  
  const handleToggleTerrain = () => {
    setShowTerrain(!showTerrain);
  };
  
  // Helper function to draw an arrow (simplified version)
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
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Navigation size={16} className="text-tactical-primary" />
          TACTICAL MAP - INDIA
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400">{selectedRegion || "Full Territory View"}</div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleToggleGrid} 
              className={`p-1 text-xs rounded ${showGrid ? 'bg-tactical-primary' : 'bg-gray-700'}`}
              title="Toggle Grid"
            >
              <MilitarySquare size={14} />
            </button>
            <button 
              onClick={handleToggleTerrain} 
              className={`p-1 text-xs rounded ${showTerrain ? 'bg-tactical-primary' : 'bg-gray-700'}`}
              title="Toggle Terrain"
            >
              <FlagTriangleRight size={14} />
            </button>
          </div>
        </div>
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
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="bg-tactical-dark/70 p-1 rounded">
                <Flag size={16} className="text-tactical-warning" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Strategic Border Area</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Map;
