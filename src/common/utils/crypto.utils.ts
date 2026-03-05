import * as crypto from 'crypto';

if (!process.env.AES_SECRET_KEY || !process.env.AES_SECRET_IV) {
    throw new Error("AES_SECRET_KEY and AES_SECRET_IV must be defined in the environment variables.");
  }
  
// const AES_KEY = Buffer.from(process.env.AES_SECRET_KEY, 'hex'); // 32-byte key
// const AES_IV = Buffer.from(process.env.AES_SECRET_IV, 'hex'); // 16-byte IV
const AES_KEY = Buffer.alloc(32, process.env.AES_SECRET_KEY); //Ensures length
const AES_IV = Buffer.alloc(16, process.env.AES_SECRET_IV);

export function decryptPassword(encryptedPassword: string): string {
  try {
    const encryptedBuffer = Buffer.from(encryptedPassword, 'base64'); // Decode from Base64
    const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, AES_IV);
    
    const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    
    return decryptedBuffer.toString('utf-8');
  } catch (error) {
    console.error("Error decrypting password:", error);
    throw new Error("Failed to decrypt password");
  }
}
