import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Format ngày theo VNPay (YYYYMMDDHHmmss)
function formatDate(date) {
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
}

// Encode params theo chuẩn VNPay (space = +)
function encodeParams(obj) {
  return Object.keys(obj)
    .map((key) => `${key}=${encodeURIComponent(obj[key]).replace(/%20/g, "+")}`)
    .join("&");
}

// =======================
// API Tạo URL Thanh toán
// =======================
export const createPaymentUrl = async (req, res) => {
  try {
    const { orderId, amount, bankCode, language } = req.body;
    if (!orderId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "orderId và amount là bắt buộc" });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: process.env.VNP_TMN_CODE,
      vnp_Amount: amount * 100, // VNPay yêu cầu nhân 100
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_Locale: language || "vn",
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_CreateDate: formatDate(now),
      vnp_ExpireDate: formatDate(tomorrow),
    };

    // Thêm bankCode nếu có
    if (bankCode) {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    // Sắp xếp key
    vnp_Params = Object.entries(vnp_Params)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {});

    // Encode params
    const signData = encodeParams(vnp_Params);

    // Ký SHA512
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // URL thanh toán
    const paymentUrl = `${process.env.VNP_URL}?${signData}&vnp_SecureHash=${signed}`;

    return res
      .status(201)
      .json({ success: true, data: { orderId, amount, paymentUrl } });
  } catch (err) {
    console.error("VNPay createPaymentUrl error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =======================
// API Callback VNPay
// =======================
export const vnpayReturn = (req, res) => {
  try {
    let vnpData = { ...req.query };
    const secureHash = vnpData.vnp_SecureHash;

    delete vnpData.vnp_SecureHash;
    delete vnpData.vnp_SecureHashType;

    // Sắp xếp key theo alphabet
    vnpData = Object.entries(vnpData)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {});

    // Ghép chuỗi dữ liệu theo đúng chuẩn VNPay
    const signData = encodeParams(vnpData);

    const signed = crypto
      .createHmac("sha512", process.env.VNP_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    let success = false;
    let message = "";

    if (secureHash.toLowerCase() !== signed.toLowerCase()) {
      success = false;
      message = "Sai chữ ký VNPay";
    } else if (vnpData.vnp_ResponseCode === "00") {
      success = true;
      message = "Thanh toán thành công";
    } else {
      success = false;
      message = "Thanh toán thất bại hoặc bị hủy";
    }
    const orderId = vnpData.vnp_TxnRef || "";
    // 🔹 Redirect về checkout trên frontend
    return res.redirect(
      `http://localhost:5173/checkout?success=${success}&message=${encodeURIComponent(
        message
      )}&orderId=${orderId}`
    );
  } catch (err) {
    console.error("VNPay return error:", err);
    return res.redirect(
      `http://localhost:5173/checkout?success=false&message=${encodeURIComponent(
        err.message
      )}`
    );
  }
};
