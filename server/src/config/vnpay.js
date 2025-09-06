import dotenv from "dotenv";
dotenv.config();

const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMN_CODE,
  vnp_HashSecret: process.env.VNP_HASH_SECRET,
  vnp_Url: process.env.VNP_URL, // sandbox
  vnp_ReturnUrl: process.env.VNP_RETURN_URL,
};

export default vnpayConfig;