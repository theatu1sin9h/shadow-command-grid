
import { useState, useEffect } from 'react';
import { 
  Unit, 
  MeshNode, 
  Message, 
  Command, 
  ConnectionStatus, 
  UnitType, 
  MessagePriority,
  CommandType,
  Coordinates
} from './types';

// Mock data generators
const generateMockUnits = (): Unit[] => {
  return [
    {
      id: "unit-1",
      callsign: "Alpha-1",
      type: UnitType.COMMAND,
      position: { lat: 28.218, lng: 94.727 },
      status: {
        personnel: 45,
        condition: 92,
        ammo: 78,
        fuel: 85
      },
      lastUpdate: new Date(),
      connectionStatus: ConnectionStatus.ONLINE
    },
    {
      id: "unit-2",
      callsign: "Bravo-2",
      type: UnitType.INFANTRY,
      position: { lat: 28.224, lng: 94.735 },
      status: {
        personnel: 32,
        condition: 65,
        ammo: 42,
        fuel: 50
      },
      lastUpdate: new Date(Date.now() - 1200000), // 20 minutes ago
      connectionStatus: ConnectionStatus.MESH_ONLY
    },
    {
      id: "unit-3",
      callsign: "Charlie-3",
      type: UnitType.ARMOR,
      position: { lat: 28.210, lng: 94.720 },
      status: {
        personnel: 18,
        condition: 88,
        ammo: 75,
        fuel: 30
      },
      lastUpdate: new Date(Date.now() - 300000), // 5 minutes ago
      connectionStatus: ConnectionStatus.MESH_ONLY
    },
    {
      id: "unit-4",
      callsign: "Delta-4",
      type: UnitType.SUPPORT,
      position: { lat: 28.205, lng: 94.738 },
      status: {
        personnel: 24,
        condition: 95,
        ammo: 90,
        fuel: 85
      },
      lastUpdate: new Date(Date.now() - 7200000), // 2 hours ago
      connectionStatus: ConnectionStatus.OFFLINE
    },
    {
      id: "unit-5",
      callsign: "Echo-5",
      type: UnitType.AIR,
      position: { lat: 28.230, lng: 94.710 },
      status: {
        personnel: 8,
        condition: 75,
        ammo: 60,
        fuel: 45
      },
      lastUpdate: new Date(Date.now() - 120000), // 2 minutes ago
      connectionStatus: ConnectionStatus.DEGRADED
    }
  ];
};

const generateMockMessages = (): Message[] => {
  return [
    {
      id: "msg-1",
      senderId: "unit-1",
      senderCallsign: "Alpha-1",
      content: "All units regroup at checkpoint Bravo.",
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      priority: MessagePriority.HIGH,
      acknowledged: true,
      deliveredTo: ["unit-2", "unit-3", "unit-5"]
    },
    {
      id: "msg-2",
      senderId: "unit-3",
      senderCallsign: "Charlie-3",
      content: "Enemy movement detected at north ridge.",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      priority: MessagePriority.CRITICAL,
      acknowledged: false,
      deliveredTo: ["unit-1", "unit-2"]
    },
    {
      id: "msg-3",
      senderId: "unit-2",
      senderCallsign: "Bravo-2",
      content: "Supply drop received. Ammo restocked.",
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      priority: MessagePriority.MEDIUM,
      acknowledged: true,
      deliveredTo: ["unit-1"]
    }
  ];
};

const generateMockCommands = (): Command[] => {
  return [
    {
      id: "cmd-1",
      type: CommandType.MOVE,
      issuerId: "unit-1",
      issuerCallsign: "Alpha-1",
      targetUnitIds: ["unit-2", "unit-3"],
      description: "Proceed to hill 42 and establish defensive position",
      coordinates: { lat: 28.220, lng: 94.740 },
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      acknowledged: true
    },
    {
      id: "cmd-2",
      type: CommandType.ENGAGE,
      issuerId: "unit-1",
      issuerCallsign: "Alpha-1",
      targetUnitIds: ["unit-5"],
      description: "Provide air support at marked location",
      coordinates: { lat: 28.215, lng: 94.722 },
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      acknowledged: false
    },
    {
      id: "cmd-3",
      type: CommandType.RECONNECT,
      issuerId: "unit-1",
      issuerCallsign: "Alpha-1",
      targetUnitIds: ["unit-4"],
      description: "Restore communications with base",
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      acknowledged: false
    }
  ];
};

const generateMeshNetwork = (units: Unit[]): MeshNode[] => {
  const nodes: MeshNode[] = units.map(unit => ({
    unitId: unit.id,
    callsign: unit.callsign,
    position: unit.position,
    isActive: unit.connectionStatus !== ConnectionStatus.OFFLINE,
    connections: [],
    lastSeen: unit.lastUpdate,
    signalStrength: unit.connectionStatus === ConnectionStatus.ONLINE ? 90 : 
                    unit.connectionStatus === ConnectionStatus.MESH_ONLY ? 70 :
                    unit.connectionStatus === ConnectionStatus.DEGRADED ? 40 : 0
  }));

  // Establish connections between nodes
  nodes.forEach(node => {
    if (!node.isActive) return;
    
    nodes.forEach(otherNode => {
      if (otherNode.unitId !== node.unitId && otherNode.isActive) {
        // Calculate distance between nodes
        const distance = Math.sqrt(
          Math.pow(node.position.lat - otherNode.position.lat, 2) +
          Math.pow(node.position.lng - otherNode.position.lng, 2)
        );
        
        // If within range, establish connection
        if (distance < 0.03) { // Arbitrary threshold
          node.connections.push(otherNode.unitId);
        }
      }
    });
  });
  
  return nodes;
};

// Simulate receiving new data
export const useSimulatedNetwork = () => {
  const [units, setUnits] = useState<Unit[]>(generateMockUnits());
  const [messages, setMessages] = useState<Message[]>(generateMockMessages());
  const [commands, setCommands] = useState<Command[]>(generateMockCommands());
  const [meshNetwork, setMeshNetwork] = useState<MeshNode[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.MESH_ONLY);
  
  // Initialize mesh network
  useEffect(() => {
    const network = generateMeshNetwork(units);
    setMeshNetwork(network);
    
    // Simulate network changes
    const interval = setInterval(() => {
      // Update unit positions slightly to simulate movement
      const updatedUnits = units.map(unit => ({
        ...unit,
        position: {
          lat: unit.position.lat + (Math.random() - 0.5) * 0.002,
          lng: unit.position.lng + (Math.random() - 0.5) * 0.002
        },
        // Randomly update unit statuses to simulate real-time changes (if online)
        status: unit.connectionStatus !== ConnectionStatus.OFFLINE ? {
          ...unit.status,
          personnel: Math.max(1, Math.min(100, unit.status.personnel + (Math.random() > 0.7 ? (Math.random() - 0.6) * 5 : 0))),
          ammo: Math.max(1, Math.min(100, unit.status.ammo + (Math.random() > 0.7 ? (Math.random() - 0.6) * 3 : 0))),
          fuel: Math.max(1, Math.min(100, unit.status.fuel + (Math.random() > 0.8 ? (Math.random() - 0.7) * 4 : 0)))
        } : unit.status,
        lastUpdate: unit.connectionStatus !== ConnectionStatus.OFFLINE ? new Date() : unit.lastUpdate
      }));
      
      setUnits(updatedUnits);
      setMeshNetwork(generateMeshNetwork(updatedUnits));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [units]);
  
  // Add new message
  const sendMessage = (content: string, priority: MessagePriority = MessagePriority.MEDIUM) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: "unit-1", // Assume current user is always unit-1
      senderCallsign: "Alpha-1",
      content,
      timestamp: new Date(),
      priority,
      acknowledged: false,
      deliveredTo: []
    };
    
    setMessages(prev => [newMessage, ...prev]);
    return newMessage;
  };
  
  // Issue new command
  const issueCommand = (
    commandType: CommandType,
    targetUnitIds: string[],
    description: string,
    coordinates?: Coordinates
  ) => {
    const newCommand: Command = {
      id: `cmd-${Date.now()}`,
      type: commandType,
      issuerId: "unit-1", // Assume current user is always unit-1
      issuerCallsign: "Alpha-1",
      targetUnitIds,
      description,
      coordinates,
      timestamp: new Date(),
      acknowledged: false
    };
    
    setCommands(prev => [newCommand, ...prev]);
    return newCommand;
  };
  
  // Toggle network status for simulation
  const toggleNetworkMode = () => {
    setConnectionStatus(prev => 
      prev === ConnectionStatus.ONLINE ? ConnectionStatus.MESH_ONLY :
      prev === ConnectionStatus.MESH_ONLY ? ConnectionStatus.DEGRADED :
      prev === ConnectionStatus.DEGRADED ? ConnectionStatus.OFFLINE :
      ConnectionStatus.ONLINE
    );
  };

  // Add new unit
  const addUnit = (newUnit: Unit) => {
    setUnits(prev => [...prev, newUnit]);
  };
  
  return {
    units,
    messages,
    commands,
    meshNetwork,
    connectionStatus,
    sendMessage,
    issueCommand,
    toggleNetworkMode,
    addUnit
  };
};
