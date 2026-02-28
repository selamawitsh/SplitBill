// import User from '../models/User.model.js';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// const generateToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET, {
//         expiresIn: '7d'
//     });
// };

// // REGISTER
// export const registerUser = async (req, res) => {
//     try {
//         const { FullName, email, password, phoneNumber } = req.body;

//         const existingUser = await User.findOne({ phoneNumber });
//         if (existingUser) {
//             return res.status(400).json({ message: "User already exists" });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const newUser = await User.create({
//             FullName,
//             email,
//             password: hashedPassword,
//             phoneNumber
//         });

//         res.status(201).json({
//             _id: newUser._id,
//             FullName: newUser.FullName,
//             email: newUser.email,
//             phoneNumber: newUser.phoneNumber,
//             token: generateToken(newUser._id)
//         });

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // LOGIN (Phone number + password)
// export const loginUser = async (req, res) => {
//     try {
//         const { phoneNumber, password } = req.body;

//         const user = await User.findOne({ phoneNumber });
//         if (!user) {
//             return res.status(400).json({ message: "Invalid credentials" });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ message: "Invalid credentials" });
//         }

//         res.json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             phoneNumber: user.phoneNumber,
//             token: generateToken(user._id)
//         });

//     } catch (error) {
//         res.status(500).json({ message: "Server error" });
//     }
// };

import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// REGISTER
export const registerUser = async (req, res) => {
    try {
        const { FullName, email, password, phoneNumber } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user - handle email properly
        const userData = {
            FullName,
            phoneNumber,
            password: hashedPassword
        };
        
        // Only add email if it's provided and not empty
        if (email && email.trim() !== '') {
            userData.email = email;
        }

        const newUser = await User.create(userData);

        res.status(201).json({
            _id: newUser._id,
            FullName: newUser.FullName,
            email: newUser.email || '',
            phoneNumber: newUser.phoneNumber,
            token: generateToken(newUser._id)
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};

// LOGIN
export const loginUser = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({
            _id: user._id,
            FullName: user.FullName,  // Fixed: was 'name' now 'FullName'
            email: user.email || '',
            phoneNumber: user.phoneNumber,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Server error" });
    }
};