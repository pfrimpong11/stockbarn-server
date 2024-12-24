import mongoose, { Schema, Document } from 'mongoose';

interface Product extends Document {
  name: string;
  price: number;
  images: string[];
  unit: string;
  category: string;
  description: string;
  nutrition: string; // Changed to string
}

const ProductSchema = new Schema<Product>({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  images: { type: [String], required: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: false, trim: true },
  nutrition: { type: String, required: false }, 
});

export default mongoose.model<Product>('Products', ProductSchema);
