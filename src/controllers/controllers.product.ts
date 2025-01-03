import { Request, Response } from 'express';

import { connectToDatabase } from '../database';
import Product from '../database/models/models.product';
import Order from '../database/models/models.order';
import User from '../database/models/models.customer';

// Create a new product
export const createProduct = async (req: any, res: Response) => {
    const { name, description, price, unit, category, images, nutrition } = req.body;

    try {
        

        const newProduct = new Product({
            name,
            description,
            price,
            unit,
            category,
            images,
            nutrition,
        });

        const savedProduct = await newProduct.save();

        return res.status(201).send({ msg: 'Product created successfully', product: savedProduct });
    } catch (error) {
        return res.status(500).send({ msg: 'Error creating product', error });
    }
};



export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        
        

        // Calculate total revenue
        const revenueData = await Order.aggregate([
            {
                $match: { paymentStatus: "paid" }, 
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                },
            },
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

       
        const totalCustomers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();

       
        return res.status(200).send({
            totalRevenue,
            totalCustomers,
            totalOrders,
            totalProducts,
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).send({
            msg: "Error fetching dashboard stats",
            error: error.message,
        });
    }
};


// Fetch all products
export const getAllProducts = async (req: Request, res: Response) => {
    try {
       

        const products = await Product.find();

        return res.status(200).send(products);
    } catch (error) {
        return res.status(500).send({ msg: 'Error fetching products', error });
    }
};



// Fetch product by ID
export const getProductById = async (req: Request, res: Response) => {
    const { productId } = req.params;

    try {
      

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send({ msg: 'Product not found' });
        }

        return res.status(200).send(product);
    } catch (error) {
        return res.status(500).send({ msg: 'Error fetching product by ID', error });
    }
};


// Update product
export const updateProduct = async (req: Request, res: Response) => {
    const { productId } = req.params;
    const updates = req.body;

    try {
   

        const updatedProduct = await Product.findByIdAndUpdate(productId, updates, { new: true });

        if (!updatedProduct) {
            return res.status(404).send({ msg: 'Product not found' });
        }

        return res.status(200).send({ msg: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        return res.status(500).send({ msg: 'Error updating product', error });
    }
};


// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
    const { productId } = req.params;

    try {
     

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).send({ msg: 'Product not found' });
        }

        return res.status(200).send({ msg: 'Product deleted successfully' });
    } catch (error) {
        return res.status(500).send({ msg: 'Error deleting product', error });
    }
};
