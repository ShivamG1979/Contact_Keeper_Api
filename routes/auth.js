import express from "express";
import { register, login, logout, getProfile } from "../controllers/auth.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", isAuthenticated, getProfile);
router.put("/update", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    
    await user.save();
    
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    }); 
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    }); 
  }
});

export default router;