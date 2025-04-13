import express from "express"; 
import { Contact } from "../Models/Contact.js";  
import { 
  addContact, 
  getContact, 
  updateContact, 
  deleteContact, 
  getContactById,
  toggleFavorite,
  getContactsByCategory,
  getFavoriteContacts,
  searchContacts,
  importContacts,
  exportContacts
} from "../controllers/contact.js";
import upload from '../middleware/upload.js'; 
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();
 
// Apply authentication middleware to all contact routes
router.use(isAuthenticated);

// Basic CRUD routes
router.post("/addcontact", upload.single('image'), addContact);
router.get("/getcontacts", getContact);
router.put("/:id", upload.single('image'), updateContact);
router.delete("/:id", deleteContact);
router.get("/contact/:id", getContactById);

// Feature routes
router.patch("/:id/favorite", toggleFavorite);
router.get("/category/:category", getContactsByCategory);
router.get("/favorites/all", getFavoriteContacts);
router.get("/search", searchContacts);
router.post("/import", importContacts);
router.get("/export", exportContacts);



// Fix the image serving route
router.get("/contact/:id/image", isAuthenticated, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

     
    if (!contact || !contact.image || !contact.image.data) {
      return res.status(404).send('No image found');
    }
    
    // Verify user has access to this contact
    if (contact.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this image"
      });
    }
    
    res.set('Content-Type', contact.image.contentType);
    res.send(contact.image.data);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).send(error.message);
  }
});


export default router;