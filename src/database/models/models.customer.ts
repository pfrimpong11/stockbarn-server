import { Schema, Types, model, models } from "mongoose";



const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true  },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], required: true },
    phone: { type: String, required: true },
    verificationCode: { type: String, required: false },
     isVerified: { type: Boolean, required:false },
    resetPasswordExpires: { type: Date },
    address: {
        type: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// const User = mongoose.model('User', userSchema);
// module.exports = User;


const User = models.User || model("User", userSchema)
export default User