import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately
dotenv.config(); // Load server/.env if present
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Fallback to root .env
