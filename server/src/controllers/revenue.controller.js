import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

// helpers
const parseDate = (v, fallback) => {
  if (!v) return fallback;
  const d = new Date(v);
  return isNaN(d) ? fallback : d;
};

const revenueFieldExpr = () =>
  // prefer total_amount, fall back to total
  ({ $toDouble: { $ifNull: ["$total_amount", "$total"] } });

// SHIFT to Vietnam local (UTC+7)
const SHIFT_HOURS = 7;
const SHIFT_MS = SHIFT_HOURS * 60 * 60 * 1000;

/**
 * GET /api/revenue?period=day|week|month&start=ISO&end=ISO&status=completed
 * returns array of { period: string, revenue: number, orders: number }
 */
export const getRevenue = async (req, res) => {
  try {
    const { period = "day", start, end, status } = req.query;
    const startDate = parseDate(start, new Date(0));
    const endDate = parseDate(end, new Date());

    // We'll shift created_at by +7 hours inside aggregation to compute local periods
    // Build a match that compares the shifted field (localCreatedAt) to the provided start/end (which are local)
    const matchLocal = {
      localCreatedAt: { $gte: startDate, $lte: endDate },
    };
    if (status) matchLocal.status = status;

    let groupStage;
    let projectStage;

    if (period === "month") {
      groupStage = {
        _id: { $dateToString: { format: "%Y-%m", date: "$localCreatedAt" } },
        revenue: { $sum: revenueFieldExpr() },
        orders: { $sum: 1 },
      };
      projectStage = {
        _id: 0,
        period: "$_id",
        revenue: 1,
        orders: 1,
      };
    } else if (period === "week") {
      groupStage = {
        _id: {
          year: { $isoWeekYear: "$localCreatedAt" },
          week: { $isoWeek: "$localCreatedAt" },
        },
        revenue: { $sum: revenueFieldExpr() },
        orders: { $sum: 1 },
      };
      projectStage = {
        _id: 0,
        period: {
          $concat: [
            { $toString: "$_id.year" },
            "-W",
            { $toString: "$_id.week" },
          ],
        },
        revenue: 1,
        orders: 1,
      };
    } else {
      groupStage = {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$localCreatedAt" } },
        revenue: { $sum: revenueFieldExpr() },
        orders: { $sum: 1 },
      };
      projectStage = {
        _id: 0,
        period: "$_id",
        revenue: 1,
        orders: 1,
      };
    }

    // sort from old -> new
    let sortStage;
    if (period === "week") {
      sortStage = { $sort: { "_id.year": 1, "_id.week": 1 } };
    } else {
      sortStage = { $sort: { _id: 1 } };
    }

    const pipeline = [
      // create localCreatedAt = created_at + 7 hours (Vietnam time)
      {
        $addFields: {
          localCreatedAt: {
            $dateAdd: {
              startDate: "$created_at",
              unit: "hour",
              amount: SHIFT_HOURS,
            },
          },
        },
      },
      { $match: matchLocal },
      { $group: groupStage },
      sortStage,
      { $project: projectStage },
    ];

    const agg = await Order.aggregate(pipeline).allowDiskUse(true);
    // build map from aggregation
    const map = new Map();
    (agg || []).forEach((r) => {
      const key = String(r.period);
      map.set(key, {
        revenue: Number(r.revenue || 0),
        orders: Number(r.orders || 0),
      });
    });

    // helpers to generate period list between startDate..endDate (inclusive)
    const pad = (n) => (n < 10 ? "0" + n : String(n));
    const formatDay = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const formatMonth = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

    // ISO week year/week helper (use local time, no UTC adjustments)
    const getISOWeekYearAndWeek = (d) => {
      const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      // Move to Thursday in current week — ISO week date rule
      const day = date.getDay() || 7; // 1..7 (Mon..Sun)
      date.setDate(date.getDate() + 4 - day);
      const yearStart = new Date(date.getFullYear(), 0, 1);
      const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
      return { year: date.getFullYear(), week: weekNo };
    };

    const periods = [];
    if (period === "month") {
      const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      while (cur <= last) {
        periods.push(formatMonth(cur));
        cur.setMonth(cur.getMonth() + 1);
      }
    } else if (period === "week") {
      // move to Monday of the ISO week that contains startDate (local)
      const copy = new Date(startDate);
      const day = copy.getDay(); // 0 Sun .. 6
      const diffToMon = (day + 6) % 7; // days since Monday
      copy.setDate(copy.getDate() - diffToMon);
      copy.setHours(0, 0, 0, 0);
      const last = new Date(endDate);
      last.setHours(23, 59, 59, 999);
      while (copy <= last) {
        const { year, week } = getISOWeekYearAndWeek(copy);
        periods.push(`${year}-W${week}`);
        copy.setDate(copy.getDate() + 7);
      }
    } else {
      const cur = new Date(startDate);
      cur.setHours(0, 0, 0, 0);
      const last = new Date(endDate);
      last.setHours(23, 59, 59, 999);
      while (cur <= last) {
        periods.push(formatDay(cur));
        cur.setDate(cur.getDate() + 1);
      }
    }

    // assemble result with revenue default 0
    const result = periods.map((p) => {
      const found = map.get(p);
      return {
        period: p,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0,
      };
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("getRevenue error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * GET /api/revenue/new-orders?since=ISO
 * Returns count of new orders since 'since' (default last 24h)
 */
export const getNewOrdersCount = async (req, res) => {
  try {
    const { since } = req.query;
    const sinceDate = parseDate(
      since,
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    // convert provided (local) sinceDate to UTC query value by subtracting SHIFT
    const sinceDateUTC = new Date(sinceDate.getTime() - SHIFT_MS);
    const count = await Order.countDocuments({
      created_at: { $gte: sinceDateUTC },
    });
    return res.json({
      success: true,
      data: { since: sinceDate.toISOString(), count },
    });
  } catch (err) {
    console.error("getNewOrdersCount error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * GET /api/revenue/summary
 * Returns small dashboard summary: revenueToday, revenueWeek, revenueMonth, newOrders
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date(); // current instant (UTC-based)
    // convert to Vietnam local time first
    const nowLocal = new Date(now.getTime() + SHIFT_MS);

    // start of local day (VN)
    const startOfDayLocal = new Date(
      nowLocal.getFullYear(),
      nowLocal.getMonth(),
      nowLocal.getDate()
    );

    // start of local week (Monday)
    const dayLocal = startOfDayLocal.getDay(); // 0 (Sun) .. 6
    const diffToMon = (dayLocal + 6) % 7;
    const startOfWeekLocal = new Date(startOfDayLocal);
    startOfWeekLocal.setDate(startOfWeekLocal.getDate() - diffToMon);

    // start of local month
    const startOfMonthLocal = new Date(
      nowLocal.getFullYear(),
      nowLocal.getMonth(),
      1
    );

    const baseMatch = {
      /* optionally filter by status: completed */
    };

    // helper aggregator that expects LOCAL datetimes, converts to UTC inside
    const rangeAgg = async (fromLocal, toLocal) => {
      const fromUTC = new Date(fromLocal.getTime() - SHIFT_MS);
      const toUTC = new Date(toLocal.getTime() - SHIFT_MS);
      const pipeline = [
        {
          $match: { created_at: { $gte: fromUTC, $lte: toUTC }, ...baseMatch },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: revenueFieldExpr() },
            orders: { $sum: 1 },
          },
        },
        { $project: { _id: 0, revenue: 1, orders: 1 } },
      ];
      const r = await Order.aggregate(pipeline).allowDiskUse(true);
      return r[0] || { revenue: 0, orders: 0 };
    };

    // compute new orders last 24h based on VN local time
    const sinceLocal = new Date(nowLocal.getTime() - 24 * 60 * 60 * 1000);
    const sinceUTC = new Date(sinceLocal.getTime() - SHIFT_MS);
    const newOrdersCount = await Order.countDocuments({
      created_at: { $gte: sinceUTC },
    });

    const [today, week, month] = await Promise.all([
      rangeAgg(startOfDayLocal, nowLocal),
      rangeAgg(startOfWeekLocal, nowLocal),
      rangeAgg(startOfMonthLocal, nowLocal),
    ]);

    return res.json({
      success: true,
      data: {
        revenueToday: today.revenue || 0,
        ordersToday: today.orders || 0,
        revenueWeek: week.revenue || 0,
        ordersWeek: week.orders || 0,
        revenueMonth: month.revenue || 0,
        ordersMonth: month.orders || 0,
        newOrdersLast24h: newOrdersCount,
      },
    });
  } catch (err) {
    console.error("getDashboardSummary error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const {
      period = "week",
      start,
      end,
      limit = 10,
      sort = "max",
      status,
    } = req.query;

    const now = new Date();
    const nowLocal = new Date(now.getTime() + SHIFT_MS);
    let defaultStartLocal;
    if (period === "month") {
      defaultStartLocal = new Date(
        nowLocal.getTime() - 30 * 24 * 60 * 60 * 1000
      );
    } else {
      defaultStartLocal = new Date(
        nowLocal.getTime() - 7 * 24 * 60 * 60 * 1000
      );
    }

    const startDate = parseDate(start, defaultStartLocal);
    const endDate = parseDate(end, nowLocal);

    const matchLocal = {
      localCreatedAt: { $gte: startDate, $lte: endDate },
    };
    if (status) matchLocal.status = status;

    const productIdExpr = {
      $ifNull: [
        "$items.product",
        {
          $ifNull: [
            "$items.productId",
            { $ifNull: ["$items.product_id", null] },
          ],
        },
      ],
    };

    const itemSlugExpr = { $ifNull: ["$items.slug", "$items.productSlug"] };
    const itemImageExpr = {
      $ifNull: ["$items.image", { $arrayElemAt: ["$items.images", 0] }],
    };
    const itemNameExpr = {
      $ifNull: [
        "$items.name",
        { $ifNull: ["$items.title", "$items.product_name"] },
      ],
    };

    const qtyExpr = {
      $toDouble: { $ifNull: ["$items.quantity", "$items.qty", 1] },
    };
    const priceExpr = {
      $toDouble: {
        $ifNull: ["$items.price", "$items.unit_price", "$items.total_price", 0],
      },
    };
    const itemRevenueExpr = { $multiply: [qtyExpr, priceExpr] };

    // base pipeline that aggregates sold quantities/revenue from orders (uses localCreatedAt)
    const basePipeline = [
      {
        $addFields: {
          localCreatedAt: {
            $dateAdd: {
              startDate: "$created_at",
              unit: "hour",
              amount: SHIFT_HOURS,
            },
          },
        },
      },
      { $match: matchLocal },
      { $unwind: "$items" },
      {
        $project: {
          productId: productIdExpr,
          itemSlug: itemSlugExpr,
          itemImage: itemImageExpr,
          itemName: itemNameExpr,
          quantity: qtyExpr,
          itemRevenue: itemRevenueExpr,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "pdoc",
        },
      },
      { $unwind: { path: "$pdoc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          productSlug: {
            $ifNull: ["$itemSlug", { $ifNull: ["$pdoc.slug", "$pdoc.handle"] }],
          },
          productImage: {
            $ifNull: ["$itemImage", { $arrayElemAt: ["$pdoc.images", 0] }],
          },
          productName: {
            $ifNull: ["$itemName", { $ifNull: ["$pdoc.name", "$pdoc.title"] }],
          },
        },
      },
      {
        $addFields: {
          productKey: {
            $ifNull: [
              "$productSlug",
              {
                $cond: [
                  { $ifNull: ["$productId", false] },
                  { $toString: "$productId" },
                  null,
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$productKey",
          slug: { $first: "$productSlug" },
          name: { $first: "$productName" },
          image: { $first: "$productImage" },
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: "$itemRevenue" },
        },
      },
      { $match: { _id: { $ne: null } } },
      {
        $project: {
          _id: 0,
          key: "$_id",
          slug: "$slug",
          name: { $ifNull: ["$name", "Unknown"] },
          image: { $ifNull: ["$image", null] },
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ];

    // get aggregated sold rows (no sort/limit)
    const soldRows = await Order.aggregate(basePipeline).allowDiskUse(true);

    // If user requested a merged list (include products with zero sales), build merged array
    if (sort === "min" || sort === "max") {
      // map sold rows by key
      const soldMap = new Map();
      soldRows.forEach((r) => {
        const k = String(r.key);
        soldMap.set(k, {
          totalQuantity: Number(r.totalQuantity || 0),
          totalRevenue: Number(r.totalRevenue || 0),
          slug: r.slug,
          name: r.name,
          image: r.image,
        });
      });

      // fetch all products to include zero-sales items
      const products = await Product.find(
        {},
        { slug: 1, name: 1, images: 1 }
      ).lean();

      const productMap = new Map();
      const merged = [];

      products.forEach((p) => {
        const key = p.slug || (p._id ? String(p._id) : null);
        productMap.set(String(key), true);
        const sold = soldMap.get(String(key)) || {
          totalQuantity: 0,
          totalRevenue: 0,
        };
        merged.push({
          key,
          slug: p.slug || null,
          name: p.name || "Unknown",
          image: (p.images && p.images[0]) || null,
          totalQuantity: sold.totalQuantity,
          totalRevenue: sold.totalRevenue,
        });
      });

      // include soldRows entries that are not present in products list (uncatalogued items)
      soldRows.forEach((r) => {
        const k = String(r.key);
        if (!productMap.has(k)) {
          merged.push({
            key: k,
            slug: r.slug || null,
            name: r.name || "Unknown",
            image: r.image || null,
            totalQuantity: Number(r.totalQuantity || 0),
            totalRevenue: Number(r.totalRevenue || 0),
          });
        }
      });

      // sort merged array
      if (sort === "min") {
        merged.sort((a, b) => {
          if (a.totalQuantity !== b.totalQuantity)
            return a.totalQuantity - b.totalQuantity;
          return a.totalRevenue - b.totalRevenue;
        });
      } else {
        merged.sort((a, b) => {
          if (b.totalQuantity !== a.totalQuantity)
            return b.totalQuantity - a.totalQuantity;
          return b.totalRevenue - a.totalRevenue;
        });
      }

      const limited = merged.slice(0, Number(limit));
      return res.json({ success: true, data: limited });
    }

    // default behavior (sort max) — use order aggregation pipeline + sort & limit
    let sortStage = { $sort: { totalQuantity: -1 } };
    pipeline = [...basePipeline, sortStage, { $limit: Number(limit) }];
    const rows = await Order.aggregate(pipeline).allowDiskUse(true);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getTopProducts error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
