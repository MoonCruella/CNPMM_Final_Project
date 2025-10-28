import React from "react";

const opts = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
];

const PeriodSwitcher = ({
  value,
  onChange,
  start,
  end,
  onStartChange,
  onEndChange,
  onEditRange,
  onReset,
  notify, // optional
}) => {
  const notifyFn = (msg) => {
    try {
      if (typeof notify === "function") notify(msg);
      else window.alert(msg);
    } catch {}
  };

  const isInvalidRange = (s, e) => {
    if (!s || !e) return false;
    const ds = new Date(s);
    const de = new Date(e);
    if (isNaN(ds.getTime()) || isNaN(de.getTime())) return false;
    return ds > de;
  };

  const handleStartChange = (v) => {
    if (isInvalidRange(v, end)) {
      notifyFn("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
      return;
    }

    if (onEditRange) {
      onEditRange({ start: v });
    } else {
      onStartChange(v);
      if (value !== "day") onChange("day");
    }
  };

  const handleEndChange = (v) => {
    if (isInvalidRange(start, v)) {
      notifyFn("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
      return;
    }

    if (onEditRange) {
      onEditRange({ end: v });
    } else {
      onEndChange(v);
      if (value !== "day") onChange("day");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="inline-flex rounded-md shadow-sm"
        role="tablist"
        aria-label="Period"
      >
        {opts.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            // hand cursor + hover/scale/transition effects
            className={`px-3 py-1 text-sm transform transition duration-150 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-l last:rounded-r ${
              value === o.key
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* date range inputs */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Từ</label>
        <input
          type="date"
          value={start}
          onChange={(e) => handleStartChange(e.target.value)}
          className="px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-200"
        />
        <label className="text-xs text-gray-500">Đến</label>
        <input
          type="date"
          value={end}
          onChange={(e) => handleEndChange(e.target.value)}
          className="px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-200"
        />

        {/* Reset luôn hiển thị; có hover, cursor pointer và hiệu ứng */}
        <button
          type="button"
          onClick={() => {
            try {
              onChange?.("day");
              onReset?.();
            } catch {}
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 active:bg-blue-800 cursor-pointer transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default PeriodSwitcher;
