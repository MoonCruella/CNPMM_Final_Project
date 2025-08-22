import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
export const Register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //check if user registered
    const checkRegistrationStatus = await User.findOne({ email });
    if (checkRegistrationStatus) {
      return res.status(409).json({
        status: false,
        message: "User already register",
      });
    }

    // hash password
    const hashPassword = bcryptjs.hashSync(password);

    const newRegistration = new User({
      name,
      email,
      password: hashPassword,
    });

    await newRegistration.save();

    res.status(200).json({
      status: true,
      message: "Registration success.",
    });
  } catch (error) {
    res.status(500),
      json({
        status: false,
        error,
      });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //check if user not registered
    const user = await User.findOne({ email }).lean().exec();
    if (!user) {
      return res.status(403).json({
        status: false,
        message: "Invalid login credentials.",
      });
    }

    // check password
    const isVerifyPassword = await bcryptjs.compare(password, user.password);
    if (!isVerifyPassword) {
      return res.status(403).json({
        status: false,
        message: "Invalid login credentials.",
      });
    }

    delete user.password;

    const token = jwt.sign(user, process.env.JWT_SECRET);
    res.cookie("access_token", token, {
      httpOnly: true,
    });
    res.status(200).json({
      status: true,
      message: "Login success.",
    });
  } catch (error) {
    res.status(500),
      json({
        status: false,
        error,
      });
  }
};
