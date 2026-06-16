// File: src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

export const VerifyUser = (req, res, next) => {
    const { authorization } = req.headers; // Lấy token từ header gửi lên
    
    if (!authorization) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập hệ thống!" });
    }

    try {
        const [_, token] = authorization.split(" "); // Tách chuỗi "Bearer <token>"
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "123456"); // Xác thực chìa khóa bí mật
        
        req.user = decoded; // Đính kèm thông tin user đã giải mã vào req để dùng ở Controller sau này
        next(); // Hợp lệ, cho đi tiếp qua cổng an ninh!
    } catch (error) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};