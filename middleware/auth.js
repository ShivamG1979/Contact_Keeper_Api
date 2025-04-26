// middleware/auth.js - Fix missing import
import jwt from "jsonwebtoken";
import { User } from "../Models/User.js";  // Added this import
import { Contact } from "../Models/Contact.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid",
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id);
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};