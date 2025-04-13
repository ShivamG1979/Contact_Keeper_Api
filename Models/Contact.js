import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: String,
  email: String,
  phone: String,
  type: {
    type: String,
    default: "personal",
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  image: {
    data: Buffer,        // Store image as binary data
    contentType: String, // Store mime type
    filename: String     // Store original filename
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export const Contact = mongoose.model("Contact", contactSchema);