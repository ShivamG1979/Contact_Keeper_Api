// controllers/contact.js
import { Contact } from "../Models/Contact.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// update the addContact 
export const addContact = async (req, res) => {
  try {
    const { name, email, phone, type } = req.body;
    let imageData = null;
    
    // Check if contact with email or phone already exists...
    
    // Handle image if uploaded
    if (req.file) {
      imageData = {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
        filename: req.file.originalname
      };
      
      // Optional: Delete the temporary file after reading it
      // fs.unlinkSync(req.file.path);
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      type,
      image: imageData,
      user: req.user._id,
    });

    res.status(201).json({ 
      success: true,
      message: "Contact saved successfully",
      contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all contacts with pagination
export const getContact = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Contact.countDocuments({ user: req.user._id });
    const contacts = await Contact.find({ user: req.user._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Transform contacts to include image information
    const transformedContacts = contacts.map(contact => {
      const contactObj = contact.toObject();
      
      // If contact has image data, indicate it has an image without sending the actual data
      if (contactObj.image && contactObj.image.data) {
        contactObj.image = {
          exists: true,
          contentType: contactObj.image.contentType
        };
      }
      
      return contactObj;
    });

    res.json({ 
      success: true,
      message: "Contacts fetched successfully",
      contacts: transformedContacts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    }); 
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single contact by ID
export const getContactById = async (req, res) => {
  try {
    const id = req.params.id;
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ 
        success: false,
        message: "Contact not found" 
      });
    }

    // Check if user owns this contact
    if (contact.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this contact"
      });
    }

    res.json({ 
      success: true,
      contact 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Update contact
export const updateContact = async (req, res) => {
  try {
    const contactId = req.params.id;
    let contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({ 
        success: false,
        message: "Contact not found" 
      });
    }

    // Check if user owns this contact
    if (contact.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this contact"
      });
    }

    const { name, email, phone, type } = req.body;
    
    // Create update object
    const updateData = { name, email, phone, type };

    // Only handle image if a file was uploaded
    if (req.file) {
      console.log("File uploaded:", req.file);  // Add this for debugging
      
      updateData.image = {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
        filename: req.file.originalname
      };
      
      // Optionally delete the temp file
      fs.unlinkSync(req.file.path);
    }

    // Update the contact
    contact = await Contact.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true }
    );

    // Transform response to not include image binary data
    const responseContact = contact.toObject();
    if (responseContact.image && responseContact.image.data) {
      responseContact.image = {
        exists: true,
        contentType: responseContact.image.contentType,
        filename: responseContact.image.filename
      };
    }

    res.json({
      success: true,
      message: "Contact updated successfully",
      contact: responseContact
    });
  } catch (error) {
    console.error("Update error:", error);  // Add detailed logging
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getContactImage = async (req, res) => {
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
    return res.send(contact.image.data);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).send(error.message);
  }
};
// Delete contact
export const deleteContact = async (req, res) => {
  try {
    const id = req.params.id;
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ 
        success: false,
        message: "Contact not found" 
      });
    }

    // Check if user owns this contact
    if (contact.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this contact"
      });
    }

    // No need to delete image file as it's stored in the database
    
    await contact.deleteOne();

    res.json({ 
      success: true, 
      message: "Contact deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Toggle favorite
export const toggleFavorite = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ 
        success: false,
        message: "Contact not found" 
      });
    }
    
    // Check if user owns this contact
    if (contact.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this contact"
      });
    }

    contact.favorite = !contact.favorite;
    await contact.save();

    res.json({ 
      success: true,
      message: "Favorite status toggled", 
      contact 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get by category
export const getContactsByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Contact.countDocuments({
      user: req.user._id,
      type: req.params.category,
    });
    
    const contacts = await Contact.find({
      user: req.user._id,
      type: req.params.category,
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json({ 
      success: true,
      contacts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all favorites
export const getFavoriteContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Contact.countDocuments({
      user: req.user._id,
      favorite: true,
    });
    
    const contacts = await Contact.find({
      user: req.user._id,
      favorite: true,
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json({ 
      success: true,
      contacts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search contacts
export const searchContacts = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Search term is required"
      });
    }

    const contacts = await Contact.find({
      user: req.user._id,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    });

    res.json({
      success: true,
      message: "Search results",
      contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add bulk contacts import
export const importContacts = async (req, res) => {
  try {
    const { contacts } = req.body;
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of contacts"
      });
    }

    const processedContacts = contacts.map(contact => ({
      ...contact,
      user: req.user._id
    }));

    const result = await Contact.insertMany(processedContacts);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.length} contacts`,
      count: result.length
    });
  } catch (error) {
    // Handle duplicate key errors from MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Some contacts could not be imported due to duplicate email or phone"
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Export contacts
export const exportContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user._id })
      .select('-user -__v');
    
    res.json({
      success: true,
      message: "Contacts exported successfully",
      contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};