import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import { config } from 'dotenv';
import { connectDB } from './config/db.js';
import contactRouter from './routes/contact.js';
import authRouter from './routes/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Load environment variables 
config({
  path: '.env'
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true                
}));

// Make sure uploads directory exists
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure static files middleware for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api', contactRouter);

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to the Contact_Keeper API!');
});

//Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : null
  });
});

// Start server
const port = process.env.PORT || 1000;
app.listen(port, () => console.log(`Server running on port ${port}`));