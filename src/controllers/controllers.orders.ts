import { Request, Response } from 'express';
import { connectToDatabase } from '../database';
import axios from 'axios';
import Order from '../database/models/models.order';

import User from '../database/models/models.customer';
import Product from '../database/models/models.product';
import Cart from '../database/models/models.cart';

const PAYSTACK_SECRET_KEY = "sk_live_b656166f9c8b4216425d78a0ef4c49a390d84cbd";


export const createOrder = async (req: any, res: Response) => {
    const { products, email, contactNumber,paymentMethod, deliverylocation } = req.body;
    const customer = req.user;

    try {
        if (!customer || !customer._id) {
            return res.status(400).send({ msg: 'User information is missing or invalid.' });
        }

        if (!products || products.length === 0) {
            return res.status(400).send({ msg: 'Products array cannot be empty.' });
        }

        if (!email || !contactNumber) {
            return res.status(400).send({ msg: 'Email and contact number are required.' });
        }

        await connectToDatabase();

        // Fetch pickup and delivery locations
       

        // Calculate total amount
        let totalAmount = 0;
        const orderProducts = products.map((product: any) => {
            if (!product.product || !product.quantity || product.quantity <= 0) {
                throw new Error('Each product must include a valid product ID and a positive quantity.');
            }
            totalAmount += product.price * product.quantity;
            return {
                product: product.product,
                quantity: product.quantity,
            };
        });

        // Create the order
        const newOrder = new Order({
            customer: customer._id,
            products: orderProducts,
            totalAmount,
            status: 'pending',
            paymentStatus: 'unpaid',
            deliverylocation
            
        });

        await newOrder.save();

        // Handle payment integration with Paystack
        if (paymentMethod === 'card') {
            const parseTotal = parseFloat(totalAmount.toFixed(2));
            const paymentResponse = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email,
                    amount: Math.round(parseTotal * 100),
                    metadata: {
                        orderId: newOrder._id,
                        contactNumber,
                    },
                    channels: ['card', 'mobile_money'],
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            return res.status(201).send({
                order: newOrder,
                paymentUrl: paymentResponse.data.data.authorization_url,
            });
        } else if (paymentMethod === 'payOnDelivery') {
            return res.status(201).send({
                order: newOrder,
                message: 'Order created successfully. Payment will be made on delivery.',
            });
        } else {
            return res.status(400).send({ msg: 'Invalid payment method.' });
        }
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).send({ msg: 'Error creating order.', error: error.message });
    }
};




export const getAllOrders = async (req: Request, res: Response) => {
    try {
        await connectToDatabase();
        const orders = await Order.find().populate("products.product");
        return res.status(200).send(orders);
    } catch (error) {
        return res.status(500).send({ msg: 'Error fetching orders', error });
    }
};


export const getOrdersByUserId = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        await connectToDatabase();
        const order = await Order.find({ userId }).populate("products.product")
        
        if (!order) {
            return res.status(404).send({ msg: 'Order not found' });
        }
        return res.status(200).send(order);
    } catch (error) {
        return res.status(500).send({ msg: 'Error fetching order', error });
    }
};


export const updateOrder = async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const updateData = req.body;

    try {
        await connectToDatabase();
        const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
        if (!updatedOrder) {
            return res.status(404).send({ msg: 'Order not found' });
        }
        return res.status(200).send(updatedOrder);
    } catch (error) {
        return res.status(500).send({ msg: 'Error updating order', error });
    }
};


export const deleteOrder = async (req: Request, res: Response) => {
    const { orderId } = req.params;

    try {
        await connectToDatabase();
        const deletedOrder = await Order.findByIdAndDelete(orderId);
        if (!deletedOrder) {
            return res.status(404).send({ msg: 'Order not found' });
        }
        return res.status(200).send({ msg: 'Order deleted successfully' });
    } catch (error) {
        return res.status(500).send({ msg: 'Error deleting order', error });
    }
};

export const getOrdersByCustomer = async (req: Request, res: Response) => {
    const { customerId } = req.params;

    try {
        await connectToDatabase();
        const orders = await Order.find({ customer: customerId }).populate('deliverylocation')
            .populate('pickuplocation')
            .populate('products.product')
        .populate('products.service')
           

        if (!orders) {
            return res.status(404).send({ msg: 'No orders found for this customer' });
        }

        return res.status(200).send(orders);
    } catch (error) {
        return res.status(500).send({ msg: 'Error fetching orders by customer', error });
    }
};

export const getOrdersByPartner = async (req: Request, res: Response) => {
    const { partnerId } = req.params;

    try {
        await connectToDatabase();
        const orders = await Order.find({ partner: partnerId })
            

        if (!orders.length) {
            return res.status(404).send({ msg: 'No orders found for this partner' });
        }

        return res.status(200).send(orders);
    } catch (error) {
        return res.status(500).send({ msg: 'Error fetching orders by partner', error });
    }
};



