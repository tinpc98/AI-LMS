import bcrypt from 'bcryptjs';
import User from '../models/user.models.js';

export const registerService = async (userData) => {
    const { email, password, fullName, role } = userData;
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedFullName = String(fullName).trim();
    const allowedRoles = ['student', 'teacher'];
    const userRole = allowedRoles.includes(role) ? role : 'student';

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        const error = new Error('Email này đã được đăng ký trong hệ thống!');
        error.status = 409;
        throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
        fullName: normalizedFullName,
        email: normalizedEmail,
        password: hashedPassword,
        role: userRole,
    });

    return newUser;
};