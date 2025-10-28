import privateApi from "@/services/privateApi";

const getRevenue = async (
  { period = "day", start, end, status, page, limit } = {},
  { signal } = {}
) => {
  try {
    const resp = await privateApi.get("/api/revenue", {
      params: { period, start, end, status, page, limit },
      signal,
    });
    return resp.data ?? { success: true, data: null };
  } catch (err) {
    if (err?.name === "CanceledError" || err?.name === "AbortError")
      return { success: false, aborted: true };
    return { success: false, error: err?.response?.data ?? err.message ?? err };
  }
};

const getNewOrdersCount = async (since, { signal } = {}) => {
  try {
    const resp = await privateApi.get("/api/revenue/new-orders", {
      params: { since },
      signal,
    });
    return resp.data ?? { success: true, data: null };
  } catch (err) {
    if (err?.name === "CanceledError" || err?.name === "AbortError")
      return { success: false, aborted: true };
    return { success: false, error: err?.response?.data ?? err.message ?? err };
  }
};

const getDashboardSummary = async ({ signal } = {}) => {
  try {
    const resp = await privateApi.get("/api/revenue/summary", { signal });
    return resp.data ?? { success: true, data: null };
  } catch (err) {
    if (err?.name === "CanceledError" || err?.name === "AbortError")
      return { success: false, aborted: true };
    return { success: false, error: err?.response?.data ?? err.message ?? err };
  }
};

const getTopProducts = async (
  { period = "week", start, end, limit = 10, sort = "max", status } = {},
  { signal } = {}
) => {
  try {
    const resp = await privateApi.get("/api/revenue/top-products", {
      params: { period, start, end, limit, sort, status },
      signal,
    });
    return resp.data ?? { success: true, data: null };
  } catch (err) {
    if (err?.name === "CanceledError" || err?.name === "AbortError")
      return { success: false, aborted: true };
    return { success: false, error: err?.response?.data ?? err.message ?? err };
  }
};

export default {
  getRevenue,
  getNewOrdersCount,
  getDashboardSummary,
  getTopProducts,
};
