import { Request, Response } from 'express';
import { connectToDatabase } from '../database';
import axios from 'axios';
import Order from '../database/models/models.order';
import Location from '../database/models/models.location';
import User from '../database/models/models.customer';
import Product from '../database/models/models.product';
import Cart from '../database/models/models.cart';

const PAYSTACK_SECRET_KEY = "sk_live_b656166f9c8b4216425d78a0ef4c49a390d84cbd";


export const createOrder = async (req: any, res: Response) => {
    const { paymentMethod, pickuplocationCategory, deliverylocationCategory, deliveryTime, pickupTime } = req.body;
    const customer = req.user;

    try {
        if (!customer || !customer._id) {
            return res.status(400).send({ msg: "User information is missing or invalid" });
        }

        await connectToDatabase();

        // Find pickup location
        const location1 = await Location.findOne({
            category: pickuplocationCategory,
            user: customer._id,
        });

        if (!location1) {
            return res.status(404).send({ msg: `Pickup location with category '${pickuplocationCategory}' not found` });
        }

        // Find delivery location
        const location2 = await Location.findOne({
            category: deliverylocationCategory,
            user: customer._id,
        });

        if (!location2) {
            return res.status(404).send({ msg: `Delivery location with category '${deliverylocationCategory}' not found` });
        }

        // Fetch cart for the user
        const cart = await Cart.findOne({ user: customer._id }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).send({ msg: "Cart is empty" });
        }

        // Calculate the total amount and prepare populated products
        let totalAmount: number = 0;
        const populatedProducts = cart.items.map(item => {
            const product = item.product;
            if (!product) {
                throw new Error(`Product with ID ${item.product} not found`);
            }
            totalAmount += product.price * item.quantity;
            console.log(product);
            
            return {
                product: product._id,
                service: product.service, // Assuming the service field is populated
                quantity: item.quantity,
            };
        });

        // Create the order object
        const newOrder = new Order({
            customer: customer._id,
            products: populatedProducts,
            totalAmount,
            paymentMethod,
            pickuplocation: location1._id,
            deliverylocation: location2._id,
            deliveryTime,
            pickupTime,
        });

        // Save the order to the database
        await newOrder.save();

        // Clear the cart
        await Cart.findOneAndUpdate(
            { user: customer._id },
            { $set: { items: [], totalAmount: 0 } },
            { new: true }
        );

        // Handle payment
        if (paymentMethod === 'card') {
            const parseTotal = parseFloat(totalAmount.toFixed(2));
            const paymentResponse = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email: customer.email,
                    amount: Math.round(parseTotal * 100),
                    metadata: {
                        orderId: newOrder._id,
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
            return res.status(400).send({ msg: 'Invalid payment method' });
        }
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).send({ msg: 'Error creating order', error: error.message });
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


export const getOrderByUserId = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        await connectToDatabase();
        const order = await Order.findById(userId).populate("products.product")
        .populate("products.service")
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

