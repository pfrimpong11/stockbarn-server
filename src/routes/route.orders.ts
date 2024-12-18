import express from 'express';
import {
    createOrder,
    
    getAllOrders,
   
    updateOrder,
    deleteOrder,
    getOrdersByPartner,
    getOrdersByCustomer,
    getOrderByUserId
} from '../controllers/controllers.orders';
import { protectRoute } from '../utils/middleware.utils';

const router = express.Router();

// Route to create a new order
router.post('/create',protectRoute, createOrder);

// Route to verify payment
// router.get('/verify', verifyPayment);

// Route to get all orders
router.get('/', getAllOrders);

// Route to get a single order by ID
// router.get('/:customerId', getOrdersByCustomer);

// Route to update an order by ID
router.put('/:orderId', updateOrder);

// Route to delete an order by ID
router.delete('/:orderId', deleteOrder);

// Route to get orders by partner ID
router.get('/partners/:partnerId', getOrdersByPartner);

// Route to get orders by customer ID
router.get('/customers/:customerId', getOrdersByCustomer);

export default router;

