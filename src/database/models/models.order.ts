import { Schema, Types, model, models } from "mongoose";


const orderSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true }  
    }],
    totalAmount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: { 
        type: String, 
        enum: ['unpaid', 'paid', 'failed'],
        default: 'unpaid'
    },
    // payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
   
     deliverylocation: { type:String },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});


const Order = models.Order || model("Orders", orderSchema)
export default Order