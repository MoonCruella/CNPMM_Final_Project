![Logo](https://res.cloudinary.com/dnddgulz8/image/upload/w_100,q_auto,f_auto/v1762097689/general/shiew2ugywhdwuglynyh.png)
# Pyspecials 

## Mục đích dự án
Trong kỷ nguyên chuyển đổi số đang diễn ra mạnh mẽ, việc quảng bá và tiêu thụ sản phẩm địa phương thông qua các nền tảng trực tuyến đã trở thành xu hướng tất yếu, góp phần thúc đẩy phát triển kinh tế và nâng cao giá trị thương hiệu vùng miền. Nhận thấy tiềm năng to lớn của đặc sản Phú Yên – vùng đất mang đậm bản sắc văn hóa cùng nền ẩm thực phong phú và độc đáo – nhóm sinh viên chúng em đã lựa chọn thực hiện đề tài “Website giới thiệu, quảng bá và bán đặc sản quê hương tỉnh Phú Yên”.

Dự án hướng đến mục tiêu xây dựng một nền tảng thương mại điện tử hiện đại, nơi người dùng có thể dễ dàng khám phá, đặt mua và trải nghiệm những sản phẩm đặc sản đặc trưng của Phú Yên. Thông qua đó, website không chỉ giúp quảng bá hình ảnh địa phương đến đông đảo khách hàng trong và ngoài nước, mà còn hỗ trợ các cơ sở sản xuất, hộ kinh doanh mở rộng thị trường tiêu thụ, góp phần phát triển kinh tế số bền vững và giữ gìn giá trị văn hóa ẩm thực truyền thống của quê hương Phú Yên.


## Công nghệ sử dụng
- Node.js: Nền tảng JavaScript phía máy chủ, giúp xây dựng hệ thống backend linh hoạt, hiệu năng cao và dễ mở rộng.
- Express.js: Framework backend chạy trên Node.js, được sử dụng để xây dựng các RESTful API, xử lý logic nghiệp vụ và giao tiếp giữa client và cơ sở dữ liệu.
- React.js: Thư viện JavaScript mạnh mẽ dùng để phát triển giao diện người dùng (UI), mang đến trải nghiệm tương tác mượt mà và hiện đại cho người dùng.
- Mongoose: Thư viện giúp kết nối và thao tác với MongoDB, đóng vai trò quản lý dữ liệu sản phẩm, người dùng, đơn hàng và các thông tin khác của hệ thống.
- Tailwind CSS: Framework CSS tiện lợi, hỗ trợ thiết kế giao diện website đẹp mắt, linh hoạt và tối ưu cho mọi thiết bị.
- WebSocket: Giao thức truyền thông hai chiều giữa máy chủ (server) và trình duyệt (client), cho phép cập nhật dữ liệu theo thời gian thực mà không cần tải lại trang.


## Vai trò và các chức năng
1. Guest:
- Đăng nhập, đăng ký tài khoản, quên mật khẩu.
2. Khách hàng: 
- Xem sản phẩm.
- Quản lý giỏ hàng: thêm/xóa sản phẩm, cập nhật số lượng.
- Thanh toán: thanh toán đơn hàng bằng tiền mặt, VNPAY hoặc ZALOPAY.
- Xem sản phẩm.
- Mua Hàng.
- Chat với người bán, chat với Chatbot.
- Thêm/xóa sản phẩm khỏi Danh sách yêu thích.
- Xem lịch sử mua hàng, hủy đơn hàng. 
- Xem các bài viết về tỉnh Phú Yên. 
- Đánh giá sản phẩm.
- Cập nhật thông tin cá nhân.
- Đăng xuất
3. Người bán: 
- Quản lý người dùng.
- Quản lý đơn hàng. 
- Xem thống kê doanh thu.
- Quản lý Blog.
- Quản lý phân loại.
- Quản lý sản phẩm.
- Quản lý đánh giá từ khách hàng.
- Quản lý Voucher.
- Hỗ trợ khách hàng.
- Xem thông báo.
- Chỉnh sửa thông tin cá nhân. 
- Đăng xuất. 
## Cấu trúc dự án
- server/ — API (controllers, routes, models, middleware,utils, services, method, helpers, config)
- client/ — React app (pages, components, services, utils, redux, context, assets, hooks, lib)

## Cài đặt nhanh (dev)
1. **Clone repo tại:**  [@Pyspecials](https://www.github.com/MoonCruella/CNPMM_Final_Project)     
2. **Backend:**

```bash
cd server
cp .env.example .env và cấu hình biến
npm install
npm run dev
```

3. **Frontend:**
```bash
cd client
cp .env.example .env và cấu hình API_BASE_URL
npm install
npm start
```
4. **Cài đặt Redis:**
- Cài đặt **Redis** bằng **Docker**: 

```bash
docker pull redis
docker run --name redis-server -d -p 6379:6379 redis 
```

## Biến môi trường chính

- **Biến môi trường phía Frontend:**

``` bash 
VITE_API_BASE_URL
```

- **Biến môi trường phía Server:**
```bash
PORT
MONGODB_CONN
ACCESS_TOKEN_KEY
ACCESS_TOKEN_LIFE
REFRESH_TOKEN_KEY
REFRESH_TOKEN_LIFE
EMAIL_USER
EMAIL_PASS
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
VNP_TMN_CODE
VNP_HASH_SECRET
VNP_RETURN_URL
VNP_URL
ZP_APP_ID
ZP_KEY1
ZP_KEY2
AI_PROVIDER
GROQ_MODEL
GROQ_API_KEY
```

## Tổng quan API 
- /api/auth — Xác thực người dùng
- /api/users — Quản lý người dùng
- /api/upload — Upload ảnh (Cloudinary)
- /api/categories — Quản lý danh mục
- /api/products — Quản lý sản phẩm
- /api/cart — Giỏ hàng
- /api/orders — Quản lý đơn hàng
- /api/addresses — Quản lý địa chỉ
- /api/vnpay — Tích hợp VNPay (thanh toán)
- /api/zalopay — Tích hợp ZaloPay (thanh toán)
- /api/vouchers — Quản lý voucher
- /api/ratings — Đánh giá sản phẩm
- /api/revenue — Báo cáo/thống kê doanh thu
- /api/notifications — Thông báo người dùng
- /api/chatbot — Chatbot / trả lời tự động
- /api/support — Hỗ trợ trò chuyện (support chat)
- /api/hometown-posts — Bài viết cộng đồng (hometown posts)



## Tác giả
Nhóm 12 - Lớp Các Công Cụ Phần Mềm Mới - Trường Đại Học Sư Phạm Kỹ Thuật TP Hồ Chí Minh
| Họ và tên              | Mã số sinh viên | GitHub                                                |
|-------------------------|-----------------|--------------------------------------------------------|
| Lê Huỳnh Như Nguyệt     | 22110385        | [@MoonCruella](https://www.github.com/MoonCruella)     |
| Phạm Ngọc Hòa           | 22110330        | [@HoaPham236](https://github.com/hoapham236)           |
| Trần Trọng Nghĩa        | 22110380        | [@TranTrongNghia1609](https://www.github.com/TranTrongNghia1609) |



## Góp ý/Thắc mắc

Nếu có thắc mắc nào về dự án, vui lòng liên hệ cho chúng tôi theo địa chỉ email: nhunguyetpy206@gmail.com, pnhpy2306@gmail.com hoặc ttnghia204@gmail.com



# Pyspecials

## Project purpose
In the digital transformation era, promoting and selling local specialties online helps boost local economy and preserve culinary heritage. This project builds an e‑commerce platform to showcase, promote and sell specialty products from Phú Yên — allowing users to discover, order and experience local products while supporting local producers to reach wider markets.

## Technologies
- Node.js, Express
- React.js, Tailwind CSS
- MongoDB (Mongoose)
- WebSocket for real‑time updates
- Cloudinary for media (upload)
- Payment integrations (VNPay, ZaloPay)

## Roles & main features
1. Guest
- Register, login, forgot password.

2. Customer
- Browse products.
- Cart management (add/remove/update).
- Checkout & payment (cash, VNPay, ZaloPay).
- Chat with sellers and chatbot.
- Wishlist (favorite) management.
- Order history and cancel orders.
- Read community posts about Phú Yên.
- Rate products.
- Update personal profile and logout.

3. Seller / Admin
- Manage users.
- Manage orders.
- View revenue statistics.
- Manage blog posts.
- Manage categories and products.
- Manage product reviews.
- Manage vouchers.
- Support customers (support chat).
- View notifications.
- Edit own profile and logout.

## Project structure
- server/ — API (controllers, routes, models, middleware, utils, services, config)
- client/ — React app (pages, components, services, utils, redux, context, assets, hooks)

## Quick start (development)
1. Clone repo: https://www.github.com/MoonCruella/CNPMM_Final_Project

2. Backend
```bash
cd server
cp .env.example .env  # configure environment variables
npm install
npm run dev
```

3. Frontend
```bash
cd client
cp .env.example .env  # configure VITE_API_BASE_URL
npm install
npm start
```

4. Redis (optional)
```bash
docker pull redis
docker run --name redis-server -d -p 6379:6379 redis
```

## Important environment variables

Frontend:
```
VITE_API_BASE_URL
```

Server:
```
PORT
MONGODB_CONN
ACCESS_TOKEN_KEY
ACCESS_TOKEN_LIFE
REFRESH_TOKEN_KEY
REFRESH_TOKEN_LIFE
EMAIL_USER
EMAIL_PASS
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
VNP_TMN_CODE
VNP_HASH_SECRET
VNP_RETURN_URL
VNP_URL
ZP_APP_ID
ZP_KEY1
ZP_KEY2
AI_PROVIDER
GROQ_MODEL
GROQ_API_KEY
```

## API overview
- /api/auth — Authentication  
- /api/users — User management  
- /api/upload — Image upload (Cloudinary)  
- /api/categories — Category management  
- /api/products — Product management  
- /api/cart — Cart  
- /api/orders — Order management  
- /api/addresses — Address management  
- /api/vnpay — VNPay payment integration  
- /api/zalopay — ZaloPay payment integration  
- /api/vouchers — Voucher management  
- /api/ratings — Product ratings  
- /api/revenue — Revenue reports / statistics  
- /api/notifications — User notifications  
- /api/chatbot — Chatbot (automated replies)  
- /api/support — Support chat  
- /api/hometown-posts — Community posts / blog

## Authors
Team 12 — Software Tools Course, Ho Chi Minh City University of Technology and Education

| Name | Student ID | GitHub |
|---|---:|---|
| Lê Huỳnh Như Nguyệt | 22110385 | [@MoonCruella](https://www.github.com/MoonCruella) |
| Phạm Ngọc Hòa | 22110330 | [@HoaPham236](https://github.com/hoapham236) |
| Trần Trọng Nghĩa | 22110380 | [@TranTrongNghia1609](https://www.github.com/TranTrongNghia1609) |

## Contact / Questions
For questions, contact: nhunguyetpy206@gmail.com, pnhpy2306@gmail.com, ttnghia204@gmail.com
