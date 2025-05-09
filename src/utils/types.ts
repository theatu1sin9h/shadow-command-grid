
export enum UnitType {
  INFANTRY = "INFANTRY",
  ARMOR = "ARMOR",
  AIR = "AIR",
  COMMAND = "COMMAND",
  SUPPORT = "SUPPORT"
}

export enum ConnectionStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  MESH_ONLY = "MESH_ONLY",
  DEGRADED = "DEGRADED"
}

export enum MessagePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL"
}

export enum CommandType {
  MOVE = "MOVE",
  ENGAGE = "ENGAGE",
  WITHDRAW = "WITHDRAW",
  HOLD = "HOLD",
  RECONNECT = "RECONNECT"
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Unit {
  id: string;
  callsign: string;
  type: UnitType;
  position: Coordinates;
  status: {
    personnel: number;
    condition: number; // 0-100
    ammo: number; // 0-100
    fuel: number; // 0-100
  };
  lastUpdate: Date;
  connectionStatus: ConnectionStatus;
}

export interface Message {
  id: string;
  senderId: string;
  senderCallsign: string;
  content: string;
  timestamp: Date;
  priority: MessagePriority;
  acknowledged: boolean;
  deliveredTo: string[];
}

export interface Command {
  id: string;
  type: CommandType;
  issuerId: string;
  issuerCallsign: string;
  targetUnitIds: string[];
  description: string;
  coordinates?: Coordinates;
  timestamp: Date;
  expiresAt?: Date;
  acknowledged: boolean;
}

export interface MeshNode {
  unitId: string;
  callsign: string;
  position: Coordinates;
  isActive: boolean;
  connections: string[];  // IDs of connected units
  lastSeen: Date;
  signalStrength: number; // 0-100
}
