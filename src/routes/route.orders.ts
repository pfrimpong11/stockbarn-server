import express from 'express';
import {
    createOrder,
    
    getAllOrders,
   
    updateOrder,
    deleteOrder,
    getOrdersByPartner,
    getOrdersByCustomer,
    getOrdersByUserId
} from '../controllers/controllers.orders';
import { protectRoute } from '../utils/middleware.utils';

const router = express.Router();
router.post('/create',protectRoute, createOrder);
router.get('/', getAllOrders);
router.put('/:orderId', updateOrder);
router.delete('/:orderId', deleteOrder);
router.get('/customers/:customerId', getOrdersByCustomer);

export default router;

