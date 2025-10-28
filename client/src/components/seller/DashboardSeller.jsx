import React, { useEffect, useState, useRef } from "react";
import revenueService from "@/services/revenueService";
import SummaryCards from "./SummaryCards";
import PeriodSwitcher from "./PeriodSwitcher";
import RevenueChart from "./RevenueChart";
import BestSellerTable from "./BestSellerTable";

const toInputDate = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    // format as yyyy-MM-dd for <input type="date">
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const isoStartOf = (dateStr) => {
  return new Date(dateStr + "T00:00:00").toISOString();
};
const isoEndOf = (dateStr) => {
  return new Date(dateStr + "T23:59:59.999").toISOString();
};

const calcRange = (period) => {
  const now = new Date();
  let start = new Date(now);
  if (period === "day") {
    // last 7 days (including today)
    start.setDate(start.getDate() - 6);
  } else if (period === "week") {
    // last 12 weeks
    start.setDate(start.getDate() - 7 * 11);
  } else {
    // last 12 months, from month start
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  }
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

const DashboardSeller = () => {
  const [period, setPeriod] = useState("day");
  const [summary, setSummary] = useState(null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  // date inputs (yyyy-mm-dd)
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [useCustomRange, setUseCustomRange] = useState(false);

  const abortRef = useRef({ summary: null, chart: null });
  const skipPeriodResetRef = useRef(false);

  // init inputs when period changes (reset to period default)
  useEffect(() => {
    if (skipPeriodResetRef.current) {
      skipPeriodResetRef.current = false;
      return;
    }
    // only reset inputs when not using custom range
    if (useCustomRange) return;
    const { start, end } = calcRange(period);
    setStartInput(toInputDate(start));
    setEndInput(toInputDate(end));
    setUseCustomRange(false);
  }, [period]); // keep as-is

  useEffect(() => {
    const c = new AbortController();
    abortRef.current.summary = c;
    revenueService.getDashboardSummary({ signal: c.signal }).then((r) => {
      if (r?.success) setSummary(r.data);
      else setSummary(null);
    });
    return () => c.abort();
  }, []);

  const fetchChart = async (opts = {}) => {
    const { controller } = opts;
    setLoading(true);
    setPoints([]);
    try {
      const { start, end } = useCustomRange
        ? {
            start: startInput ? isoStartOf(startInput) : undefined,
            end: endInput ? isoEndOf(endInput) : undefined,
          }
        : calcRange(period);

      const resp = await revenueService.getRevenue(
        { period, start, end },
        { signal: controller?.signal }
      );
      const data = Array.isArray(resp?.data)
        ? resp.data
        : resp?.data?.data ?? [];
      setPoints(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore abort
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const c = new AbortController();
    abortRef.current.chart = c;

    // debounce so quick typing won't spam requests
    const id = setTimeout(() => {
      fetchChart({ controller: c });
    }, 150);

    return () => {
      clearTimeout(id);
      c.abort();
    };
  }, [period, useCustomRange, startInput, endInput]);

  const onResetRange = () => {
    const { start, end } = calcRange(period);
    setStartInput(toInputDate(start));
    setEndInput(toInputDate(end));
    setUseCustomRange(false);
  };

  // handler for edits coming from PeriodSwitcher
  const handleEditRange = ({ start, end }) => {
    if (start !== undefined) setStartInput(start);
    if (end !== undefined) setEndInput(end);

    // mark custom mode and switch period to 'day' but avoid resetting inputs
    setUseCustomRange(true);
    skipPeriodResetRef.current = true;
    setPeriod("day");
  };

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} />

      <div className="bg-white p-4 mx-3 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <div className="text-sm font-medium">Doanh thu</div>
            <div className="text-xs text-gray-500">
              Tổng:{" "}
              {(points || [])
                .reduce((s, p) => s + Number(p.revenue || 0), 0)
                .toLocaleString("vi-VN")}{" "}
              ₫
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PeriodSwitcher
              value={period}
              onChange={setPeriod}
              start={startInput}
              end={endInput}
              onStartChange={setStartInput}
              onEndChange={setEndInput}
              onEditRange={handleEditRange} // pass new handler
              onReset={onResetRange}
            />
          </div>
        </div>

        <RevenueChart points={points} loading={loading} />
      </div>

      {/* Best seller table */}
      <div className="m-3">
        <BestSellerTable initialPeriod="week" initialSort="max" />
      </div>
    </div>
  );
};

export default DashboardSeller;
