
import { Request, Response } from 'express';
import { connectToDatabase } from '../database';
import Product from '../database/models/models.product';
import Cart from '../database/models/models.cart';

export const addToCart = async (req: any, res: Response) => {
    const { products } = req.body; // Assuming products is an array of { productId, quantity }
    const user = req.user;

    try {
        await connectToDatabase();

        // Find the user's cart
        let cart = await Cart.findOne({ user: user._id });

        // If cart doesn't exist, create a new one
        if (!cart) {
            cart = new Cart({
                user: user._id,
                items: [],
                totalAmount: 0,
            });
        }

        // Loop through the array of products and handle each one
        for (const productItem of products) {
            const { productId, quantity } = productItem;
            // Find the product
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).send({ msg: `Product with ID ${productId} not found` });
            }

            // Check if the product is already in the cart
            const cartItem = cart.items.find(item => item.product.toString() === productId);
            if (cartItem) {
                // Update quantity and total amount
                cartItem.quantity = quantity;
            } else {
                // Add new product to the cart
                cart.items.push({ product: productId, quantity });
            }

            // Update the total amount
            cart.totalAmount += product.price * quantity;
        }

        // Save the cart
        await cart.save();

        return res.status(200).send(cart);
    } catch (error) {
        return res.status(500).send({ msg: 'Error adding to cart', error });
    }
};



export const getCart = async (req: any, res: Response) => {
    const user = req.user;

    try {
        await connectToDatabase();

        // Find the user's cart
        const cart = await Cart.find({ user: user._id })

        if (!cart) {
            return res.status(404).send({ msg: 'Cart not found' });
        }

        return res.status(200).send(cart);
    } catch (error) {
        return res.status(500).send({ msg: 'Error fetching cart', error });
    }
};



export const updateCartItem = async (req: any, res: Response) => {
    const { productId, quantity } = req.body;
    const user = req.user;

    try {
        await connectToDatabase();

        // Find the user's cart
        const cart = await Cart.findOne({ user: user._id });
        if (!cart) {
            return res.status(404).send({ msg: 'Cart not found' });
        }

        // Find the product in the cart
        const cartItem = cart.items.find(item => item.product.toString() === productId);
        if (!cartItem) {
            return res.status(404).send({ msg: 'Product not found in cart' });
        }

        // Update quantity and total amount
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ msg: 'Product not found' });
        }

        cart.totalAmount -= cartItem.quantity * product.price;
        cartItem.quantity = quantity;
        cart.totalAmount += quantity * product.price;

        // Save the cart
        await cart.save();

        return res.status(200).send(cart);
    } catch (error) {
        return res.status(500).send({ msg: 'Error updating cart item', error });
    }
};



export const removeFromCart = async (req: any, res: Response) => {
    const { productId } = req.body;
    const user = req.user;

    try {
        await connectToDatabase();

        // Find the user's cart
        const cart = await Cart.findOne({ user: user._id });
        if (!cart) {
            return res.status(404).send({ msg: 'Cart not found' });
        }

        // Find the product in the cart
        const cartItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (cartItemIndex === -1) {
            return res.status(404).send({ msg: 'Product not found in cart' });
        }

        // Update total amount and remove the item
        const product = await Product.findById(productId);
        if (product) {
            cart.totalAmount -= cart.items[cartItemIndex].quantity * product.price;
        }
        cart.items.splice(cartItemIndex, 1);

        // Save the cart
        await cart.save();

        return res.status(200).send(cart);
    } catch (error) {
        return res.status(500).send({ msg: 'Error removing from cart', error });
    }
};
