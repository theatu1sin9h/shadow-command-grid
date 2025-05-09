
/**
 * Basic encryption utility for mesh network messages
 * Uses AES-GCM encryption with a key derived from a password
 */

// Helper function to convert string to Uint8Array
const strToUint8Array = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

// Helper function to convert Uint8Array to string
const uint8ArrayToStr = (array: Uint8Array): string => {
  const decoder = new TextDecoder();
  return decoder.decode(array);
};

// Helper function to convert ArrayBuffer to hex string
const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Helper function to convert hex string to Uint8Array
const hexToUint8Array = (hex: string): Uint8Array => {
  const len = hex.length;
  const bytes = new Uint8Array(len / 2);
  
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  
  return bytes;
};

// Generate an encryption key from a password
export const deriveKey = async (password: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Use SHA-256 to hash the password
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Import the hash as a CryptoKey
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt a message
export const encryptMessage = async (message: string, password: string): Promise<string> => {
  try {
    const key = await deriveKey(password);
    
    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the message
    const messageData = strToUint8Array(message);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      messageData
    );
    
    // Combine IV and encrypted data
    const ivHex = bufferToHex(iv);
    const encryptedHex = bufferToHex(encryptedData);
    
    // Format: iv:encryptedData
    return `${ivHex}:${encryptedHex}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt a message
export const decryptMessage = async (encryptedMessage: string, password: string): Promise<string> => {
  try {
    const [ivHex, encryptedHex] = encryptedMessage.split(':');
    
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted message format');
    }
    
    const iv = hexToUint8Array(ivHex);
    const encryptedData = hexToUint8Array(encryptedHex);
    
    const key = await deriveKey(password);
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedData
    );
    
    return uint8ArrayToStr(new Uint8Array(decryptedData));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

// Check if a message is encrypted (has proper format)
export const isEncryptedMessage = (message: string): boolean => {
  // Basic check for encryption format (iv:encryptedData)
  const parts = message.split(':');
  if (parts.length !== 2) return false;
  
  const [ivHex, encryptedHex] = parts;
  
  // IV should be 24 chars (12 bytes in hex)
  if (ivHex.length !== 24) return false;
  
  // Check if both parts are valid hex
  return /^[0-9a-f]+$/i.test(ivHex) && /^[0-9a-f]+$/i.test(encryptedHex);
};

// Generate a random mesh network encryption key
export const generateMeshKey = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return bufferToHex(array);
};
