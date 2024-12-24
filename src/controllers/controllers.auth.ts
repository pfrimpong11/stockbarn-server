import { Request, Response } from "express"
import { generateVerificationCode, passwordsMatch } from "../utils/validation.utils"

import nodemailer from "nodemailer";
import updateUserByRole, { getUserByRole } from "../utils/services.utils";
import { connectToDatabase } from "../database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // Assuming you're using JWT for authentication
import User from "../database/models/models.customer";
import { sendSMS } from "../utils/sendSms.utils";


export const register = async (request: Request, response: Response) => {
    let { role, name, email, phone, password, repeatPassword } = request.body;

    // Check if passwords match
    if (!passwordsMatch(password, repeatPassword)) {
        return response.status(400).send({
            successful: false,
            msg: "Passwords don't match"
        });
    }

    try {
        // Ensure the database is connected

        // Check if user with the same email or phone number already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: email },
                { phone: phone }
            ]
        });

        if (existingUser) {
            return response.status(400).send({
                successful: false,
                msg: "User with this email or phone number already exists."
            });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode(6);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            role,
            name,
            email,
            phone,
            password: hashedPassword,
            verificationCode
        });

        await newUser.save();

        const message = ` Hello  ${name} your verification code is  ${verificationCode} kindly enter to verify your account`
        const number= '0541902075'

        await sendSMS(message,phone)

        // Send verification email (commented out, assuming you will use it)
        // const transporter = nodemailer.createTransport({
        //     service: 'Gmail',
        //     auth: {
        //         user: process.env.EMAIL_USERNAME,
        //         pass: process.env.EMAIL_PASSWORD,
        //     },
        // });

        // const mailOptions = {
        //     from: process.env.EMAIL_USERNAME,
        //     to: email,
        //     subject: 'Account Verification',
        //     text: `Your verification code is: ${verificationCode}`,
        // };

        // await transporter.sendMail(mailOptions);

        return response.status(201).send({
            successful: true,
            msg: "User created! Verification email sent.",
            newUser
        });

    } catch (error) {
        console.error('Error during registration:', error);
        return response.status(500).send({ 
            successful: false, 
            msg: "Registration failed." 
        });
    }
};



export const verifyAccount = async (request: Request, response: Response) => {
    const { phone, verificationCode } = await  request.body;

    try {
        await connectToDatabase();

        const user = await User.findOne({ phone });

        if (!user) {
            return response.status(404).send({ msg: "User not found" });
        }
       console.log(user.verificationCode);
       
        // Verify code (Assuming you stored the verification code in the DB)
        if (user.verificationCode !== verificationCode) {
            return response.status(400).send({ msg: "Invalid verification code" });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationCode= undefined
        await user.save();

        return response.status(200).send({ msg: "Account verified successfully" ,user });

    } catch (error) {
        console.error('Error during account verification:', error);
        return response.status(500).send({ msg: "Verification failed" });
    }
};


export const login = async (request: Request, response: Response) => {
    const {  email, password } = request.body;
    
    try {
        // Ensure the database is connected
        await connectToDatabase();
        
        // Find the user by email and role
        const user = await User.findOne({ email});
        
        if (!user) {
            return response.status(401).send({ msg: "Invalid email or password" });
        }
        
        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return response.status(401).send({ msg: "Invalid email or password" });
        }
       
        
        // Generate a token (assuming you're using JWT)
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'defaultsecret',
             // Set token expiration as needed
        );
        
        // Send back the token and user data
        return response.status(200).send({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                
            }
        });
        
    } catch (error) {
        console.error('Error during login:', error);
        return response.status(500).send({ msg: "Login failed" });
    }
};

export const resendVerificationCode = async (request: any, response: Response) => {
    const user = request.user;
    // Assuming userId is attached to the request

    try {
        // Find user by userId
        // const user = await User.findById(userId)
        if (!user) {
            return response.status(404).send({
                successful: false,
                msg: "User not found."
            });
        }

        // Generate a new verification code
        const newVerificationCode = generateVerificationCode(6);
        user.verificationCode = newVerificationCode;
        await user.save();

        // Optionally send the code via email
        // if (user.email) {
        //     const transporter = nodemailer.createTransport({
        //         service: 'Gmail',
        //         auth: {
        //             user: process.env.EMAIL_USERNAME,
        //             pass: process.env.EMAIL_PASSWORD,
        //         },
        //     });

        //     const mailOptions = {
        //         from: process.env.EMAIL_USERNAME,
        //         to: user.email,
        //         subject: 'Resend Verification Code',
        //         text: `Your new verification code is: ${newVerificationCode}`,
        //     };

        //     await transporter.sendMail(mailOptions);
        // }

        // Optionally send the code via SMS
        // if (user.phone) {
        //     // Code to send SMS via an SMS provider (e.g., Twilio)
        // }

        return response.status(200).send({
            successful: true,
            msg: "Verification code resent successfully.",newVerificationCode
        });

    } catch (error) {
        console.error('Error resending verification code:', error);
        return response.status(500).send({
            successful: false,
            msg: "Failed to resend verification code."
        });
    }
};

export const sendPasswordResetEmail = async (request: Request, response: Response) => {
    const { phone } = request.body;

    try {
        // Ensure the database is connected
        await connectToDatabase();

        // Find the user by email
        const user = await User.findOne({ phone });

        if (!user) {
            return response.status(404).send({ msg: "User not found" });
        }

        // Generate a reset token
       const verificationCode = generateVerificationCode(6);

        // Set the token's expiry time (e.g., 1 hour from now)
        // const tokenExpiry = Date.now() + 3600000; // 1 hour in milliseconds

        // Store the token and expiry in the user's document
        user.verificationCode = verificationCode;
        // user.resetPasswordExpires = tokenExpiry;
        await user.save();

    
        // Send the email with nodemailer
        // const transporter = nodemailer.createTransport({
        //     service: "Gmail",
        //     auth: {
        //         user: process.env.EMAIL_USERNAME,
        //         pass: process.env.EMAIL_PASSWORD,
        //     },
        // });

        // const mailOptions = {
        //     to: email,
        //     from: process.env.EMAIL_USERNAME,
        //     subject: "Password Reset",
        //     text: `You are receiving this because you (or someone else) have requested to reset your password.\n\n
        //     Please click on the following link, or paste it into your browser to complete the process:\n\n
        //     ${verificationCode}\n\n
        //     If you did not request this, please ignore this email and your password will remain unchanged.\n`
        // };

        // await transporter.sendMail(mailOptions);

        const message =   `You are receiving this because you (or someone else) have requested to reset your password.\n\n
           Kindly verify using this code: ${verificationCode}\n\n
            If you did not request this, please ignore this message and your password will remain unchanged.\n`
      await  sendSMS(message,phone)

        return response.status(200).send({ msg: "Password reset sms sent" });

    } catch (error) {
        console.error("Error sending password reset sms:", error);
        return response.status(500).send({ msg: "Failed to send password reset sms" });
    }
};



export const resetPassword = async (request: Request, response: Response) => {
    const { verificationCode, newPassword } = request.body;
   

    try {
        // Ensure the database is connected
        await connectToDatabase();

        // Find the user by email and ensure the token is valid and not expired
        const user = await User.findOne({
            verificationCode,
            // Check that the token is not expired
        });
        console.log(user);
        console.log(verificationCode);
        
        

        if (!user) {
            return response.status(400).send({ msg: "Invalid or expired token" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and clear the reset token and expiry
        user.password = hashedPassword;
        user.verificationCode = undefined;
        
        await user.save();

        return response.status(200).send({ msg: "Password has been reset successfully" });

    } catch (error) {
        console.error("Error resetting password:", error);
        return response.status(500).send({ msg: "Failed to reset password" });
    }
};


export const getProfile = async (req:any, res:Response) => {
   
    try {
        const user  = req.user;  // Assuming you have a middleware that sets req.user and req.role
  
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
};
export const getUsers = async (req: any, res: Response) => {
  try {
    // Log the authenticated user details if middleware sets them
    console.log("Authenticated user:", req.user);
    console.log("User role:", req.role);

    // Fetch all users from the database
    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

  
  export const updateProfile = async (req: any, res: Response) => {
    try {
      const  user  = req.user;  // Assuming you have a middleware that sets req.user and req.role
    
      const updatedData = req.body;
  
      const updatedProfile = await updateUserByRole(user._id, user.role, updatedData);
  
      if (!updatedProfile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
  
      res.status(200).json(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
};
  

  
  
  
  