import { validationResult } from "express-validator";
import { userModel } from "../model/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export const Register = async (req, res) => {
  const userdata = req.body;

  const error = validationResult(req);
  if (!error.isEmpty()) {
    const message = error.errors.map((item) => item.msg);
    return res.status(400).send({ message });
  }
  try {
    const udata = await userModel.findOne({ email: userdata.email });

    if (udata) {
      return res.status(400).send({ message: "Email đã tồn tại" });
    }
    const { password } = userdata;

    const hashpassword = await bcrypt.hash(password, 10);
    const user = await new userModel({
      ...userdata,
      password: hashpassword,
    }).save();
    user.password = undefined;
    res.status(200).send({ message: "Đăng ký thành công", data: user });
  } catch (error) {
    console.log(error);

    res.status(400).send({ message: "Đăng ký thất bại" });
  }
};
export const Login = async (req, res) => {
  const { email, password } = req.body;

  const error = validationResult(req);
  if (!error.isEmpty()) {
    const message = error.errors.map((item) => item.msg);
    return res.status(400).send({ message });
  }
  try {
    const user = await userModel.findOne({ email: email });
    // console.log(user);

    if (!user) {
      return res.status(400).send({ message: "Email không tồn tại" });
    }
    const check = await bcrypt.compare(password, user.password);
    if (!check) {
      return res.status(400).send({ message: "Mật khẩu không chính xác" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      "123456",
      { expiresIn: 600 },
    );
    user.password = undefined;
    res.status(200).send({ message: "Đăng nhập thành công", user, token });
  } catch (error) {
    res.status(400).send({ message: "Đăng nhập thất bại" });
  }
};
