import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAddressContext } from "@/context/AddressContext";

const AddressForm = ({ addressToEdit, onCancel }) => {
  const { addAddress, updateAddress } = useAddressContext();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [errors, setErrors] = useState({});

  // load tỉnh/huyện/xã
  useEffect(() => {
    axios.get("https://provinces.open-api.vn/api/?depth=3").then((res) => {
      setProvinces(res.data);
    });
  }, []);

  // Nếu edit thì load dữ liệu cũ
  useEffect(() => {
    if (addressToEdit && provinces.length > 0) {
      setFullName(addressToEdit.full_name || "");
      setPhone(addressToEdit.phone || "");
      setStreet(addressToEdit.street || "");
      setIsDefault(addressToEdit.is_default || false);

      // tìm lại province/district/ward theo code
      const provinceObj = provinces.find(
        (p) => p.code === addressToEdit.province?.code
      );
      if (provinceObj) {
        setProvince(provinceObj.code);
        setDistricts(provinceObj.districts);
        const districtObj = provinceObj.districts.find(
          (d) => d.code === addressToEdit.district?.code
        );
        if (districtObj) {
          setDistrict(districtObj.code);
          setWards(districtObj.wards);
          const wardObj = districtObj.wards.find(
            (w) => w.code === addressToEdit.ward?.code
          );
          if (wardObj) {
            setWard(wardObj.code);
          }
        }
      }
    }
  }, [addressToEdit, provinces]);

  const handleProvinceChange = (e) => {
    const code = parseInt(e.target.value);
    setProvince(code);
    setDistrict("");
    setWard("");
    const selectedProvince = provinces.find((p) => p.code === code);
    setDistricts(selectedProvince ? selectedProvince.districts : []);
    setWards([]);
  };

  const handleDistrictChange = (e) => {
    const code = parseInt(e.target.value);
    setDistrict(code);
    setWard("");
    const selectedDistrict = districts.find((d) => d.code === code);
    setWards(selectedDistrict ? selectedDistrict.wards : []);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
    if (!phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^(0\d{9})$/.test(phone))
      newErrors.phone = "Số điện thoại không hợp lệ";
    if (!province) newErrors.province = "Vui lòng chọn tỉnh/thành phố";
    if (!district) newErrors.district = "Vui lòng chọn quận/huyện";
    if (!ward) newErrors.ward = "Vui lòng chọn xã/phường";
    if (!street.trim()) newErrors.street = "Vui lòng nhập địa chỉ chi tiết";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const provinceObj = provinces.find((p) => p.code === province);
    const districtObj = districts.find((d) => d.code === district);
    const wardObj = wards.find((w) => w.code === ward);

    const fullAddress = `${street}, ${wardObj?.name}, ${districtObj?.name}, ${provinceObj?.name}`;

    const newAddress = {
      full_name: fullName,
      phone,
      street,
      province: { code: provinceObj?.code, name: provinceObj?.name },
      district: { code: districtObj?.code, name: districtObj?.name },
      ward: { code: wardObj?.code, name: wardObj?.name },
      full_address: fullAddress,
      is_default: isDefault,
    };

    if (addressToEdit) {
      await updateAddress(addressToEdit._id, newAddress);
    } else {
      await addAddress(newAddress);
    }

    onCancel(); // đóng form
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl my-5 mx-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
        {addressToEdit ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Họ tên */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Họ và tên *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* SĐT */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Số điện thoại *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Province */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Tỉnh / Thành phố *
          </label>
          <select
            value={province}
            onChange={handleProvinceChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">-- Chọn tỉnh --</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.province && (
            <p className="text-red-500 text-sm mt-1">{errors.province}</p>
          )}
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Quận / Huyện *
          </label>
          <select
            value={district}
            onChange={handleDistrictChange}
            disabled={!districts.length}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">-- Chọn huyện --</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.district && (
            <p className="text-red-500 text-sm mt-1">{errors.district}</p>
          )}
        </div>

        {/* Ward */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Xã / Phường *
          </label>
          <select
            value={ward}
            onChange={(e) => setWard(parseInt(e.target.value))}
            disabled={!wards.length}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">-- Chọn xã --</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.ward && (
            <p className="text-red-500 text-sm mt-1">{errors.ward}</p>
          )}
        </div>

        {/* Street */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Địa chỉ chi tiết *
          </label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
          {errors.street && (
            <p className="text-red-500 text-sm mt-1">{errors.street}</p>
          )}
        </div>
      </div>

      {/* Default + Buttons */}
      <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-700">Đặt làm mặc định</span>
          <button
            type="button"
            onClick={() => setIsDefault(!isDefault)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isDefault ? "bg-teal-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDefault ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddressForm;
