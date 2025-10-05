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

/**
 * GET /api/revenue?period=day|week|month&start=ISO&end=ISO&status=completed
 * returns array of { period: string, revenue: number, orders: number }
 */
export const getRevenue = async (req, res) => {
  try {
    const { period = "day", start, end, status } = req.query;
    const startDate = parseDate(start, new Date(0));
    const endDate = parseDate(end, new Date());

    const match = {
      created_at: { $gte: startDate, $lte: endDate },
    };
    if (status) match.status = status;

    let groupStage;
    let projectStage;

    if (period === "month") {
      groupStage = {
        _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
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
          year: { $isoWeekYear: "$created_at" },
          week: { $isoWeek: "$created_at" },
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
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
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
      { $match: match },
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

    // ISO week year/week helper
    const getISOWeekYearAndWeek = (d) => {
      const date = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
      );
      // Thursday in current week decides the year.
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
      return { year: date.getUTCFullYear(), week: weekNo };
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
      // move to Monday of the ISO week that contains startDate
      const copy = new Date(startDate);
      const day = copy.getDay(); // 0 Sun .. 6
      const diffToMon = (day + 6) % 7; // days since Monday
      copy.setDate(copy.getDate() - diffToMon);
      copy.setHours(0, 0, 0, 0, 0);
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
    const count = await Order.countDocuments({
      created_at: { $gte: sinceDate },
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
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfWeek = new Date(startOfDay);
    // set to Monday (ISO) -> adjust depending on your locale preference; here assume week starts Monday
    const day = startOfDay.getDay(); // 0 (Sun) .. 6
    const diffToMon = (day + 6) % 7; // days since Monday
    startOfWeek.setDate(startOfWeek.getDate() - diffToMon);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const baseMatch = {
      /* optionally filter by status: completed */
    };

    // helper aggregator for a date range
    const rangeAgg = async (from, to) => {
      const pipeline = [
        { $match: { created_at: { $gte: from, $lte: to }, ...baseMatch } },
        {
          $group: {
            _id: null,
            revenue: { $sum: revenueFieldExpr() },
            orders: { $sum: 1 },
          },
        },
        {
          $project: { _id: 0, revenue: 1, orders: 1 },
        },
      ];
      const r = await Order.aggregate(pipeline).allowDiskUse(true);
      return r[0] || { revenue: 0, orders: 0 };
    };

    const [today, week, month, newOrders] = await Promise.all([
      rangeAgg(startOfDay, now),
      rangeAgg(startOfWeek, now),
      rangeAgg(startOfMonth, now),
      Order.countDocuments({
        created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
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
        newOrdersLast24h: newOrders,
      },
    });
  } catch (err) {
    console.error("getDashboardSummary error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * GET /api/revenue/top-products?period=week|month&start=ISO&end=ISO&limit=10&sortBy=quantity|revenue&status=completed
 * returns array of { productId, name, totalQuantity, totalRevenue }
 */
export const getTopProducts = async (req, res) => {
  try {
    const {
      period = "week",
      start,
      end,
      limit = 10,
      // sort: "max" => highest totalRevenue, "min" => products with smallest sold qty (include zero-sales)
      sort,
      status,
    } = req.query;

    const now = new Date();
    let defaultStart;
    if (period === "month") {
      defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      defaultStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const startDate = parseDate(start, defaultStart);
    const endDate = parseDate(end, now);

    const match = {
      created_at: { $gte: startDate, $lte: endDate },
    };
    if (status) match.status = status;

    // if sort === "min" we must include products with zero sales -> aggregate from products collection with LEFT lookup into orders
    if (sort === "min") {
      const prodPipeline = [
        // optionally filter active products here, e.g. { $match: { active: true } }
        // normalize fields
        {
          $project: {
            name: { $ifNull: ["$name", "$title"] },
            slug: 1,
            images: 1,
          },
        },
        {
          $lookup: {
            from: "orders",
            let: { pid: "$_id", pslug: "$slug" },
            pipeline: [
              {
                $match: {
                  created_at: { $gte: startDate, $lte: endDate },
                  ...(status ? { status } : {}),
                },
              },
              { $unwind: "$items" },
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$items.product", "$$pid"] },
                      { $eq: ["$items.productId", "$$pid"] },
                      {
                        $and: [
                          { $ifNull: ["$items.slug", null] },
                          { $eq: ["$items.slug", "$$pslug"] },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  qty: {
                    $toDouble: {
                      $ifNull: ["$items.quantity", "$items.qty", 1],
                    },
                  },
                  price: {
                    $toDouble: {
                      $ifNull: [
                        "$items.price",
                        "$items.unit_price",
                        "$items.total_price",
                        0,
                      ],
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$qty" },
                  totalRevenue: { $sum: { $multiply: ["$qty", "$price"] } },
                },
              },
            ],
            as: "sales",
          },
        },
        {
          $addFields: {
            totalQuantity: {
              $ifNull: [{ $arrayElemAt: ["$sales.totalQuantity", 0] }, 0],
            },
            totalRevenue: {
              $ifNull: [{ $arrayElemAt: ["$sales.totalRevenue", 0] }, 0],
            },
          },
        },
        {
          $project: {
            _id: 0,
            key: { $ifNull: ["$slug", { $toString: "$$ROOT._id" }] },
            slug: "$slug",
            name: { $ifNull: ["$name", "Unknown"] },
            image: { $ifNull: [{ $arrayElemAt: ["$images", 0] }, null] },
            totalQuantity: 1,
            totalRevenue: 1,
          },
        },
        // sort by totalQuantity ascending (don't sort by revenue)
        { $sort: { totalQuantity: 1 } },
        { $limit: Number(limit) },
      ];

      const rows = await Product.aggregate(prodPipeline).allowDiskUse(true);
      return res.json({ success: true, data: rows });
    }

    // otherwise aggregate from orders (existing behavior)
    // defensive expressions for item fields
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

    const itemSlugExpr = {
      $ifNull: ["$items.slug", "$items.productSlug"],
    };

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

    const pipeline = [
      { $match: match },
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

    // attach sort stage based on 'sort' query param
    let sortStage;
    if (sort === "min") {
      // least sold first
      sortStage = { $sort: { totalQuantity: 1 } };
    } else {
      // default / "max": most sold first (by quantity)
      sortStage = { $sort: { totalQuantity: -1 } };
    }

    pipeline.push(sortStage, { $limit: Number(limit) });

    const rows = await Order.aggregate(pipeline).allowDiskUse(true);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getTopProducts error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
