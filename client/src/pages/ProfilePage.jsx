import React from "react";
import { Link } from "react-router-dom";

const ProfilePage = () => {
    //   const [user, setUser] = useState(null);

    //   // Giả sử API backend trả về thông tin user sau khi login
    //   useEffect(() => {
    //     const fetchUser = async () => {
    //       try {
    //         const res = await fetch("http://localhost:5000/api/users/me", {
    //           method: "GET",
    //           credentials: "include",
    //         });
    //         const data = await res.json();
    //         setUser(data);
    //       } catch (error) {
    //         console.error("Lỗi lấy thông tin user:", error);
    //       }
    //     };
    //     fetchUser();
    //   }, []);
  const user = {
    name: "Hòa Phạm",
    email: "hoa@example.com",
    phone: "0123456789",
    avatar: "https://i.pravatar.cc/150?img=12"
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
      {/* Background decorative giống login */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-green-400 bg-opacity-30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-300 bg-opacity-20 rounded-full blur-3xl"></div>

      {/* Profile Card */}
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-3xl p-10 relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-500 shadow-md">
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mt-4">{user.name}</h1>
          <p className="text-gray-500">{user.email}</p>
          <p className="text-gray-500">{user.phone}</p>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm text-center">
            <span className="block text-sm text-gray-500">Tên</span>
            <span className="font-semibold text-gray-700">{user.name}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm text-center">
            <span className="block text-sm text-gray-500">Email</span>
            <span className="font-semibold text-gray-700">{user.email}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm text-center">
            <span className="block text-sm text-gray-500">Số điện thoại</span>
            <span className="font-semibold text-gray-700">{user.phone}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm text-center">
            <span className="block text-sm text-gray-500">Trạng thái</span>
            <span className="font-semibold text-green-600">Đang hoạt động</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex justify-between">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold text-gray-700 transition-all"
          >
            ⬅ Trở lại
          </Link>
          <button className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold shadow-md hover:bg-green-700 transition-all">
            ✏️ Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
