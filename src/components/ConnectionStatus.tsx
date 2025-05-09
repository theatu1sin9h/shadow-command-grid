
import { ConnectionStatus as ConnStatus, MeshNode } from "@/utils/types";
import { useEffect, useRef } from "react";

interface ConnectionStatusProps {
  status: ConnStatus;
  meshNetwork: MeshNode[];
}

const ConnectionStatus = ({ status, meshNetwork }: ConnectionStatusProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw mesh network visualization
  useEffect(() => {
    if (!canvasRef.current || meshNetwork.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale factor
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    // Find min and max coordinates to scale properly
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    meshNetwork.forEach(node => {
      minLat = Math.min(minLat, node.position.lat);
      maxLat = Math.max(maxLat, node.position.lat);
      minLng = Math.min(minLng, node.position.lng);
      maxLng = Math.max(maxLng, node.position.lng);
    });
    
    const latRange = maxLat - minLat || 0.1; // Prevent division by zero
    const lngRange = maxLng - minLng || 0.1;
    
    // Draw connections
    meshNetwork.forEach(node => {
      if (!node.isActive) return;
      
      const nodeX = padding + ((node.position.lng - minLng) / lngRange) * width;
      const nodeY = padding + ((node.position.lat - minLat) / latRange) * height;
      
      node.connections.forEach(targetId => {
        const targetNode = meshNetwork.find(n => n.unitId === targetId);
        if (!targetNode || !targetNode.isActive) return;
        
        const targetX = padding + ((targetNode.position.lng - minLng) / lngRange) * width;
        const targetY = padding + ((targetNode.position.lat - minLat) / latRange) * height;
        
        ctx.beginPath();
        ctx.moveTo(nodeX, nodeY);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = `rgba(126, 87, 194, ${node.signalStrength / 100})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });
    
    // Draw nodes
    meshNetwork.forEach(node => {
      const nodeX = padding + ((node.position.lng - minLng) / lngRange) * width;
      const nodeY = padding + ((node.position.lat - minLat) / latRange) * height;
      
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, 6, 0, Math.PI * 2);
      
      if (node.isActive) {
        ctx.fillStyle = node.signalStrength > 70 ? '#7E57C2' : 
                         node.signalStrength > 40 ? '#FFA726' : '#F44336';
        
        // Draw signal ripple for active nodes
        ctx.strokeStyle = `rgba(126, 87, 194, ${(Math.sin(Date.now() / 1000) + 1) / 4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#424242';
      }
      
      ctx.fill();
      
      // Draw callsign label
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(node.callsign, nodeX + 10, nodeY);
    });
    
    // Animation frame for updating ripple effects
    const animationId = requestAnimationFrame(() => {
      if (canvasRef.current) {
        // This will re-run the effect
        canvasRef.current.setAttribute('data-time', Date.now().toString());
      }
    });
    
    return () => cancelAnimationFrame(animationId);
  }, [meshNetwork, canvasRef.current?.getAttribute('data-time')]);
  
  return (
    <div className="bg-tactical-dark p-4 rounded-lg border border-tactical-primary">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">NETWORK STATUS</h3>
        <div className="px-2 py-1 text-xs rounded bg-tactical-primary text-white">
          {status === ConnStatus.ONLINE ? 'CLOUD CONNECTED' : 
           status === ConnStatus.MESH_ONLY ? 'MESH ACTIVE' : 
           status === ConnStatus.DEGRADED ? 'DEGRADED' : 'DISCONNECTED'}
        </div>
      </div>
      
      <div className="bg-black bg-opacity-30 rounded border border-gray-800">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={200} 
          className="w-full"
          data-time={Date.now().toString()}
        />
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-tactical-network"></div>
          <span>Active node</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
          <span>Inactive node</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-tactical-warning"></div>
          <span>Degraded signal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-tactical-danger"></div>
          <span>Critical signal</span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;
