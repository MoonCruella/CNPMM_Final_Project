import React, { useState, useEffect } from "react";
import { IconEye, IconEyeOff, IconTrash, IconMessageCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import ratingService from "../../services/rating.service.js";

const Ratings = () => {
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [status, setStatus] = useState("all");
  const [searchUser, setSearchUser] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [page, setPage] = useState(1);

  const loadRatings = async () => {
    try {
      setIsLoading(true);
      const res = await ratingService.getAll({
        page,
        status,
        searchUser,
        searchProduct,
      });
      setRatings(res.ratings || []);
    } catch (err) {
      console.error("Lỗi tải đánh giá:", err);
      toast.error("Không tải được đánh giá");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, [page, status, searchUser, searchProduct]);

  // 🔄 Hàm đổi trạng thái visible/hidden
  const handleToggleStatus = async (r) => {
    const newStatus = r.status === "visible" ? "hidden" : "visible";
    try {
      await ratingService.updateRating(r._id, { status: newStatus });
      toast.success(`Đã ${newStatus === "hidden" ? "ẩn" : "hiện"} bình luận`);
      loadRatings();
    } catch (err) {
      console.error("Lỗi đổi trạng thái:", err);
      toast.error("Không thể thay đổi trạng thái");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc muốn xóa đánh giá này?")) return;
    try {
      await ratingService.deleteRating(id);
      toast.success("Đã xóa đánh giá");
      loadRatings();
    } catch (err) {
      console.error("Lỗi xóa:", err);
      toast.error("Xóa thất bại");
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Bộ lọc */}
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          {/* Trạng thái */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Tất cả</option>
            <option value="visible">Hiện</option>
            <option value="hidden">Ẩn</option>
          </select>

          {/* Tìm kiếm */}
          <input
            type="text"
            placeholder="Tìm theo tên người dùng..."
            value={searchUser}
            onChange={(e) => {
              setSearchUser(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 w-48"
          />

          <input
            type="text"
            placeholder="Tìm theo sản phẩm..."
            value={searchProduct}
            onChange={(e) => {
              setSearchProduct(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 w-48"
          />

          {/* Reset */}
          <button
            onClick={() => {
              setStatus("all");
              setSearchUser("");
              setSearchProduct("");
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>

      {/* Bảng đánh giá */}
      <section className="pb-16 container mx-auto px-4">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Đang tải đánh giá...</p>
          </div>
        ) : ratings.length > 0 ? (
          <div className="overflow-x-auto shadow rounded-xl bg-white">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-gray-700">Người dùng</th>
                  <th className="py-3 px-4 text-gray-700">Sản phẩm</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Nội dung</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Số sao</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((r) => (
                  <tr key={r._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{r.userName}</td>
                    <td className="py-3 px-4">{r.productName}</td>
                    <td className="py-3 px-4 text-center">{r.content}</td>
                    <td className="py-3 px-4 text-center text-yellow-500">
                      {"★".repeat(r.rating || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.status === "visible" ? (
                        <span className="text-green-600 font-medium">Hiện</span>
                      ) : (
                        <span className="text-red-600 font-medium">Ẩn</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(r)}
                          className="w-36 h-9 flex items-center justify-center gap-2 rounded-full bg-blue-50 border border-blue-100 text-blue-800 hover:bg-blue-100"
                        >
                          {r.status === "visible" ? (
                            <>
                              <IconEyeOff size={16} /> Ẩn bình luận
                            </>
                          ) : (
                            <>
                              <IconEye size={16} /> Hiện bình luận
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="w-20 h-9 flex items-center justify-center gap-2 rounded-full bg-white border border-red-100 text-red-600 hover:bg-red-50"
                        >
                          <IconTrash size={16} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <IconMessageCircle size={32} className="text-gray-500" />
              </div>
              <p className="font-medium text-lg text-gray-800">Chưa có đánh giá nào</p>
              <p className="text-sm text-gray-400">
                Chưa có người dùng nào đánh giá sản phẩm
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default Ratings;
