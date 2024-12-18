import { Schema, Types, model, models } from "mongoose";


const orderSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    partner: { type: Schema.Types.ObjectId, ref: 'User' },
    products: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        service: { type: Schema.Types.ObjectId, ref: 'Service', required: true }
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
    pickuplocation: { type: Schema.Types.ObjectId, ref: 'Location' },
     deliverylocation: { type: Schema.Types.ObjectId, ref: 'Location' },
    deliveryTime: { type: Date },
    pickupTime: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});


const Order = models.Order || model("Order", orderSchema)
export default Order