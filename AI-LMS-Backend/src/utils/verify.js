import jwt from "jsonwebtoken";
export const VerifyUser = (req, res, next) => {
  // . Kiểm tra user  bằng cách kiểm tra authorization có tồn tại trong header hay không
  const { authorization } = req.headers;
  if (authorization) {
    //console.log(authorization);
    try {
      // Tách chuỗi Bearer để lấy token
      const [, token] = authorization.split(" ");
      // console.log(token);
      const verify = jwt.verify(token, "123456");
      next();
    } catch (error) {
      return res.status(403).send({ message: "Token không hợp lệ" });
    }
  } else {
    res.status(403).send({ message: "Bạn không có quyền truy cập" });
  }
};
