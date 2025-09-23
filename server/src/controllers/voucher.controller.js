import Voucher from "../models/voucher.model.js";

// 📌 Admin: Tạo voucher
export const createVoucher = async (req, res) => {
  try {
    // check trùng code
    const existing = await Voucher.findOne({ code: req.body.code });
    if (existing) {
      return res.status(400).json({ message: "Mã voucher đã tồn tại" });
    }

    const voucher = new Voucher(req.body);
    await voucher.save();
    res.status(201).json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Admin: Lấy danh sách voucher
export const getAllVouchers = async (req, res) => {
  try {
    const {
      active,
      type,
      code,
      startDate,
      endDate,
      page = 1,
      limit = 2,
    } = req.query;

    let filter = {};

    if (active && active != "all") filter.active = active;
    if (type && type !== "all") filter.type = type;
    if (code) filter.code = { $regex: code, $options: "i" };
    if (startDate && endDate) {
      filter.$and = [
        { startDate: { $gte: new Date(startDate) } },
        { endDate: { $lte: new Date(endDate) } },
      ];
    }

    const skip = (page - 1) * limit;

    const [totalItems, vouchers] = await Promise.all([
      Voucher.countDocuments(filter),
      Voucher.find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
      limit,
      vouchers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Admin: Cập nhật voucher
export const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json(voucher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 📌 Admin: Xóa voucher
export const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json({ message: "Voucher deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 User: Áp dụng mã nhập tay
export const applyVoucher = async (req, res) => {
  try {
    const { code, orderValue, shippingFee } = req.body;

    const voucher = await Voucher.findOne({ code, active: true });
    if (!voucher)
      return res.status(404).json({ message: "Voucher không tồn tại" });

    const now = new Date();
    if (voucher.startDate > now || voucher.endDate < now) {
      return res.status(400).json({ message: "Voucher đã hết hạn" });
    }

    if (orderValue < voucher.minOrderValue) {
      return res.status(400).json({ message: "Chưa đạt giá trị tối thiểu" });
    }

    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ message: "Voucher đã hết lượt sử dụng" });
    }

    let discount = 0;

    if (voucher.type === "DISCOUNT") {
      if (voucher.isPercent) {
        discount = (orderValue * voucher.discountValue) / 100;
      } else {
        discount = voucher.discountValue;
      }

      if (voucher.maxDiscount > 0) {
        discount = Math.min(discount, voucher.maxDiscount);
      }
    }
    // Voucher FREESHIP đã được tự động áp dụng, không cần nhập mã

    res.json({
      message: "Áp dụng thành công",
      discount,
      finalPrice: orderValue + shippingFee - discount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 User: Freeship tự động (không cần nhập mã)
export const applyAutoFreeship = async (req, res) => {
  try {
    const { orderValue } = req.body;

    const now = new Date();

    // tìm voucher FREESHIP đang active và hợp lệ
    const voucher = await Voucher.findOne({
      type: "FREESHIP",
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      minOrderValue: { $lte: orderValue },
    });

    let discount = 30000; // mặc định freeship 30k

    res.json({
      message: voucher
        ? "Tự động áp dụng freeship"
        : "Không có freeship tự động",
      discount,
      finalPrice: orderValue + shippingFee - discount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
