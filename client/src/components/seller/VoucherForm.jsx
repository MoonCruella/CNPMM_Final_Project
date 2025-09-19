import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function VoucherForm({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(
    initialData || {
      code: "",
      type: "DISCOUNT",
      isPercent: true,
      discountValue: 0,
      maxDiscount: 0,
      minOrderValue: 0,
      startDate: "",
      endDate: "",
      usageLimit: 0,
      active: true,
    }
  );

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Cập nhật Voucher" : "Thêm Voucher mới"}
          </DialogTitle>
        </DialogHeader>
        {/* Code */}{" "}
        <div className="grid gap-2">
          {" "}
          <Label>Mã voucher</Label>{" "}
          <Input
            value={form.code}
            onChange={(e) => handleChange("code", e.target.value)}
            placeholder="VD: SALE20"
          />{" "}
        </div>{" "}
        {/* Type */}{" "}
        <div className="grid gap-2 mt-2">
          {" "}
          <Label>Loại</Label>{" "}
          <Select
            value={form.type}
            onValueChange={(val) => handleChange("type", val)}
          >
            {" "}
            <SelectTrigger>
              {" "}
              <SelectValue placeholder="Chọn loại voucher" />{" "}
            </SelectTrigger>{" "}
            <SelectContent>
              {" "}
              <SelectItem value="DISCOUNT">Giảm giá</SelectItem>{" "}
              <SelectItem value="FREESHIP">Free ship</SelectItem>{" "}
            </SelectContent>{" "}
          </Select>{" "}
        </div>{" "}
        {/* Nếu DISCOUNT */}{" "}
        {form.type === "DISCOUNT" && (
          <div className="mt-3 space-y-2">
            {" "}
            <div className="flex items-center gap-2">
              {" "}
              <Switch
                checked={form.isPercent}
                onCheckedChange={(val) => handleChange("isPercent", val)}
              />{" "}
              <Label>Giảm theo %</Label>{" "}
            </div>{" "}
            <div>
              {" "}
              <Label>Giá trị giảm</Label>{" "}
              <Input
                type="number"
                value={form.discountValue}
                onChange={(e) =>
                  handleChange("discountValue", Number(e.target.value))
                }
                placeholder={form.isPercent ? "VD: 20 (%)" : "VD: 50000 (VNĐ)"}
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <Label>Giảm tối đa</Label>{" "}
              <Input
                type="number"
                value={form.maxDiscount}
                onChange={(e) =>
                  handleChange("maxDiscount", Number(e.target.value))
                }
                placeholder="VD: 50000"
              />{" "}
            </div>{" "}
          </div>
        )}{" "}
        {/* Nếu FREESHIP */}{" "}
        {form.type === "FREESHIP" && (
          <div className="mt-3">
            {" "}
            <Label>Hỗ trợ phí ship tối đa</Label>{" "}
            <Input
              type="number"
              value={form.maxDiscount}
              onChange={(e) =>
                handleChange("maxDiscount", Number(e.target.value))
              }
              placeholder="VD: 30000"
            />{" "}
          </div>
        )}{" "}
        {/* Thông tin chung */}{" "}
        <div className="mt-3 space-y-2">
          {" "}
          <div>
            {" "}
            <Label>Đơn hàng tối thiểu</Label>{" "}
            <Input
              type="number"
              value={form.minOrderValue}
              onChange={(e) =>
                handleChange("minOrderValue", Number(e.target.value))
              }
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <Label>Ngày bắt đầu</Label>{" "}
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <Label>Ngày kết thúc</Label>{" "}
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <Label>Giới hạn số lượt</Label>{" "}
            <Input
              type="number"
              value={form.usageLimit}
              onChange={(e) =>
                handleChange("usageLimit", Number(e.target.value))
              }
            />{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <Switch
              checked={form.active}
              onCheckedChange={(val) => handleChange("active", val)}
            />{" "}
            <Label>Đang hoạt động</Label>{" "}
          </div>{" "}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
