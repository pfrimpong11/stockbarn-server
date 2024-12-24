import express from 'express';
import {
    createProduct,
    getAllProducts,
    
    getProductById,
    updateProduct,
    deleteProduct,
    getDashboardStats
} from '../controllers/controllers.product';

const router = express.Router();
router.post('/create', createProduct);
router.get('/', getAllProducts);
router.get('/stats', getDashboardStats);
router.get('/:productId', getProductById);
router.put('/:productId', updateProduct);
router.delete('/:productId', deleteProduct);

export default router;
