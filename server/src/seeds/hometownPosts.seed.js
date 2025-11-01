import mongoose from 'mongoose';
import dotenv from 'dotenv';
import slugify from 'slugify';
import HometownPost from '../models/hometownPost.model.js';
// Xóa import User vì không còn cần tìm seller
// import User from '../models/user.model.js';

dotenv.config();

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGODB_CONN)
  .then(() => console.log('📦 Connected to MongoDB for seeding'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const seedHometownPosts = async () => {
  try {
    // Xóa đoạn tìm seller và sử dụng ID cố định
    const authorId = '68b6b6b1e9df82f19a1c978d'; // ID cố định được cung cấp
    console.log(`🧑‍💼 Using fixed author ID: ${authorId}`);

    // Xóa dữ liệu cũ nếu cần
    await HometownPost.deleteMany({});
    console.log('🗑️ Cleared existing hometown posts');

    // Dữ liệu mẫu - 5 bài viết với Markdown
    const samplePosts = [
      {
        title: 'Khám Phá Gành Đá Đĩa - Kỳ Quan Địa Chất Độc Đáo Của Phú Yên',
        content: `# Gành Đá Đĩa - Kỳ Quan Địa Chất Độc Đáo Của Phú Yên

## Giới thiệu

Gành Đá Đĩa là một trong những thắng cảnh nổi tiếng nhất của tỉnh Phú Yên, nằm ở địa phận xã An Ninh Đông, huyện Tuy An, cách thành phố Tuy Hòa khoảng 30km về phía Bắc. Đây là một kỳ quan địa chất hiếm có không chỉ ở Việt Nam mà còn trên thế giới.

![Gành Đá Đĩa Phú Yên](https://images.vietnamtourism.gov.vn/vn/images/2017/CNMN/25.7.Du_lich_Phu_Yen/ganhdadia.jpg)

## Đặc điểm địa chất

Gành Đá Đĩa được hình thành từ hiện tượng núi lửa phun trào cách đây hàng triệu năm. Khi dung nham núi lửa gặp nước biển lạnh đã đông cứng lại, co ngót và nứt nẻ theo hình lăng trụ đa giác, chủ yếu là hình lục giác.

Các khối đá xếp chồng lên nhau trông như những chồng đĩa khổng lồ, từ đó có tên gọi Gành Đá Đĩa. Điều đặc biệt là các khối đá ở đây có kích thước khá đều đặn, tạo nên một kiến trúc tự nhiên vô cùng kỳ diệu.

## Trải nghiệm du lịch

Đến với Gành Đá Đĩa, du khách không chỉ được chiêm ngưỡng vẻ đẹp độc đáo của thiên nhiên mà còn có thể:

- **Ngắm bình minh và hoàng hôn** tuyệt đẹp trên biển
- **Chụp ảnh** với khung cảnh thiên nhiên hùng vĩ
- **Thưởng thức hải sản tươi ngon** tại các quán ăn gần bờ biển
- **Tắm biển** tại bãi tắm An Ninh gần đó

> "Gành Đá Đĩa như một tác phẩm nghệ thuật hoàn hảo của tự nhiên, là minh chứng cho sức mạnh sáng tạo vô hạn của thiên nhiên." - Nhà địa chất Nguyễn Văn A

## Thời điểm lý tưởng để tham quan

Thời điểm lý tưởng nhất để tham quan Gành Đá Đĩa là vào mùa khô từ tháng 3 đến tháng 8. Đặc biệt, khoảng thời gian từ 5h đến 7h sáng hoặc từ 17h đến 18h chiều là lý tưởng để ngắm bình minh và hoàng hôn tuyệt đẹp.

## Lưu ý khi tham quan

1. Nên mang giày dép có độ bám tốt khi leo trèo trên các phiến đá
2. Cẩn thận với thủy triều khi tham quan vào buổi chiều
3. Mang theo nước uống và kem chống nắng
4. Giữ gìn vệ sinh, không xả rác để bảo vệ cảnh quan

---

Gành Đá Đĩa đã được Bộ Văn hóa Thể thao và Du lịch công nhận là Di tích Danh thắng cấp Quốc gia vào năm 1998, và đang trong quá trình hoàn thiện hồ sơ để trình UNESCO công nhận là Di sản Thiên nhiên Thế giới.`,
        excerpt: 'Khám phá Gành Đá Đĩa - kỳ quan địa chất độc đáo với những khối đá hình lục giác xếp chồng lên nhau như chồng đĩa khổng lồ, tạo nên cảnh quan thiên nhiên tuyệt đẹp tại Phú Yên.',
        category: 'tourism',
        location: {
          district: 'tuy_an',
          specific_place: 'Xã An Ninh Đông, Huyện Tuy An'
        },
        featured_image: 'https://images.vietnamtourism.gov.vn/vn/images/2017/CNMN/25.7.Du_lich_Phu_Yen/ganhdadia.jpg',
        status: 'published',
        author_id: authorId // Sử dụng ID cố định
      },
      {
        title: 'Bánh Xèo Tôm Nhảy - Món Ngon Đặc Trưng Của Phú Yên',
        content: `# Bánh Xèo Tôm Nhảy - Món Ngon Đặc Trưng Của Phú Yên

## Nguồn gốc và đặc điểm

Bánh xèo tôm nhảy là một trong những món ăn đặc sản nổi tiếng của Phú Yên, đặc biệt là ở vùng đầm Ô Loan. Món ăn này khác biệt so với bánh xèo truyền thống ở miền Nam bởi kích thước nhỏ hơn và thành phần chính là loại tôm đầm Ô Loan tươi ngon.

![Bánh xèo tôm nhảy Phú Yên](https://cdn.tgdd.vn/Files/2021/08/09/1373249/cach-lam-banh-xeo-tom-nhay-dac-san-phu-yen-202108091550303642.jpg)

## Tại sao gọi là "tôm nhảy"?

Tên gọi "tôm nhảy" xuất phát từ cách bắt tôm đặc biệt. Người dân địa phương sẽ dùng vó (loại lưới đánh bắt) và khi nhấc vó lên, những con tôm tươi sống sẽ nhảy tanh tách, từ đó có tên gọi tôm nhảy.

> "Bánh xèo tôm nhảy Phú Yên không chỉ là món ăn mà còn là nét văn hóa ẩm thực đặc trưng, là niềm tự hào của người dân nơi đây." - Đầu bếp Lê Thị B

## Nguyên liệu chính

- Bột gạo xay mịn
- Bột nghệ (tạo màu vàng đẹp mắt)
- Tôm đầm Ô Loan tươi sống
- Giá đỗ, hành lá
- Các loại rau ăn kèm: xà lách, diếp cá, húng quế, tía tô...

## Cách chế biến truyền thống

### Bước 1: Chuẩn bị bột
Bột gạo được trộn với nước, bột nghệ và một chút muối để tạo hỗn hợp lỏng vừa phải.

### Bước 2: Chiên bánh
Đổ bột vào chảo nóng có dầu, xoay đều chảo để tạo thành bánh mỏng.

### Bước 3: Thêm nhân
Cho tôm nhảy, giá và hành lá vào, đậy nắp trong khoảng 2-3 phút.

### Bước 4: Gấp đôi bánh
Khi bánh chín vàng giòn, gấp đôi bánh lại và thưởng thức ngay khi còn nóng.

## Cách thưởng thức

Bánh xèo tôm nhảy thường được ăn kèm với rau sống và nước chấm đặc biệt pha từ nước mắm, đường, tỏi ớt và chanh.

Cách ăn truyền thống là dùng tay, lấy một miếng bánh xèo, cuốn với rau sống rồi chấm vào nước mắm.

## Địa chỉ nổi bật để thưởng thức

1. **Quán Bà Năm**  
   Địa chỉ: Đầm Ô Loan, xã An Ninh Đông, huyện Tuy An
   
2. **Bánh Xèo Ô Loan**  
   Địa chỉ: Quốc lộ 1A, đoạn qua đầm Ô Loan
   
3. **Quán Bánh Xèo Bà Sáu**  
   Địa chỉ: Thị trấn Chí Thạnh, huyện Tuy An

---

Bánh xèo tôm nhảy không chỉ là một món ăn ngon mà còn là biểu tượng cho sự kết hợp hài hòa giữa đặc sản địa phương và kỹ thuật chế biến tinh tế của người dân Phú Yên.`,
        excerpt: 'Khám phá bánh xèo tôm nhảy - đặc sản nổi tiếng của Phú Yên với những con tôm tươi từ đầm Ô Loan, vỏ bánh mỏng giòn và hương vị đậm đà khó quên.',
        category: 'food',
        location: {
          district: 'tuy_an',
          specific_place: 'Đầm Ô Loan, huyện Tuy An'
        },
        featured_image: 'https://cdn.tgdd.vn/Files/2021/08/09/1373249/cach-lam-banh-xeo-tom-nhay-dac-san-phu-yen-202108091550303642.jpg',
        status: 'published',
        author_id: authorId // Sử dụng ID cố định
      },
      {
        title: 'Tháp Nhạn - Chứng Tích Văn Hóa Champa Tại Phú Yên',
        content: `# Tháp Nhạn - Chứng Tích Văn Hóa Champa Tại Phú Yên

## Lịch sử và kiến trúc

Tháp Nhạn, còn gọi là Tháp Nhàn, là một trong những di tích lịch sử - văn hóa quan trọng của tỉnh Phú Yên. Tháp được xây dựng vào khoảng thế kỷ XI-XII, thời kỳ vương quốc Champa đang phát triển mạnh mẽ.

![Tháp Nhạn Phú Yên](https://baodautu.vn/Images/chicong/2017/06/09/thap-nhan-1.jpg)

Nằm trên đỉnh núi Nhạn, cách trung tâm thành phố Tuy Hòa khoảng 2km về phía tây nam, Tháp Nhạn là một công trình kiến trúc tôn giáo mang đậm dấu ấn văn hóa Champa.

## Đặc điểm kiến trúc

Tháp Nhạn được xây dựng theo phong cách kiến trúc Hindu giáo điển hình của nền văn hóa Champa. Tháp có hình tứ giác, cao khoảng 20m, với các đặc điểm nổi bật:

1. **Thân tháp** hình tháp vuông, mỗi cạnh đáy dài khoảng 10m
2. **Cửa chính** quay về hướng Đông, tượng trưng cho sự thờ phụng thần Mặt Trời
3. **Các tầng tháp** thu nhỏ dần về phía đỉnh, tạo dáng vẻ cao vút
4. **Họa tiết trang trí** tinh xảo với các motif hoa lá, thần thánh điển hình của nghệ thuật Champa

> "Tháp Nhạn không chỉ là chứng tích kiến trúc mà còn là biểu tượng của sự giao thoa văn hóa lâu đời giữa các dân tộc trên mảnh đất Phú Yên." - GS. Trần Văn C

## Ý nghĩa văn hóa và tôn giáo

Tháp Nhạn được xây dựng để thờ thần Shiva - một trong ba vị thần tối cao của đạo Hindu. Đây là nơi diễn ra các nghi lễ tôn giáo quan trọng của người Champa xưa.

Theo truyền thuyết địa phương, Tháp Nhạn còn gắn liền với câu chuyện về một công chúa Champa xinh đẹp và một vương tử anh hùng, tạo nên một câu chuyện tình đẹp nhưng đầy bi kịch.

## Vai trò lịch sử

Tháp Nhạn đã chứng kiến nhiều biến cố lịch sử quan trọng:

- **Thế kỷ XV**: Khi vương quốc Champa suy tàn
- **Thời Nguyễn**: Được tu bổ nhiều lần
- **Thời Pháp thuộc**: Trở thành địa điểm nghiên cứu của các nhà khoa học phương Tây
- **Năm 2001**: Được công nhận là Di tích lịch sử văn hóa cấp Quốc gia

## Tham quan Tháp Nhạn

### Thời gian thích hợp
- Mùa khô từ tháng 1 đến tháng 8, đặc biệt là lúc bình minh hoặc hoàng hôn
- Ngày rằm hoặc lễ hội để cảm nhận không khí tâm linh

### Hoạt động hấp dẫn
1. Khám phá kiến trúc cổ độc đáo
2. Ngắm toàn cảnh thành phố Tuy Hòa từ trên đỉnh núi Nhạn
3. Tìm hiểu về văn hóa Champa qua các hiện vật
4. Chụp ảnh với khung cảnh tuyệt đẹp

---

Tháp Nhạn không chỉ là một công trình kiến trúc độc đáo mà còn là nhân chứng lịch sử cho sự giao thoa văn hóa giữa các dân tộc Việt Nam. Đây là điểm đến không thể bỏ qua khi khám phá vùng đất Phú Yên giàu truyền thống văn hóa và lịch sử.`,
        excerpt: 'Khám phá Tháp Nhạn - chứng tích văn hóa Champa với kiến trúc Hindu độc đáo, nằm trên đỉnh núi Nhạn và là biểu tượng văn hóa lịch sử của Phú Yên.',
        category: 'history',
        location: {
          district: 'phu_yen_city',
          specific_place: 'Núi Nhạn, Thành phố Tuy Hòa'
        },
        featured_image: 'https://baodautu.vn/Images/chicong/2017/06/09/thap-nhan-1.jpg',
        status: 'published',
        author_id: authorId // Sử dụng ID cố định
      },
      {
        title: 'Lễ Hội Cầu Ngư - Nét Văn Hóa Độc Đáo Của Ngư Dân Phú Yên',
        content: `# Lễ Hội Cầu Ngư - Nét Văn Hóa Độc Đáo Của Ngư Dân Phú Yên

## Nguồn gốc và ý nghĩa

Lễ hội Cầu Ngư là một trong những lễ hội truyền thống lâu đời của cộng đồng ngư dân Phú Yên, thường được tổ chức vào đầu năm mới theo lịch âm. Đây là dịp để ngư dân thể hiện lòng thành kính với thần biển, cầu mong một năm mới với nhiều tài lộc, ngư trường bội thu và bình an trên biển cả.

![Lễ hội Cầu Ngư Phú Yên](https://i-ngoisao.vnecdn.net/2023/02/06/z1-8481-1675670748.jpg)

## Thời gian và địa điểm

Lễ hội thường được tổ chức vào khoảng tháng Giêng đến tháng Hai âm lịch, tùy theo từng địa phương. Các địa điểm tổ chức chính bao gồm:

1. Làng chài Phú Thuận (TP. Tuy Hòa)
2. Xã An Ninh (huyện Tuy An)
3. Thị xã Sông Cầu

## Các nghi lễ chính

### 1. Lễ Thỉnh Thần

Đây là nghi thức quan trọng nhất, diễn ra vào sáng sớm ngày chính hội. Các bô lão trong làng sẽ thực hiện nghi lễ rước tượng Thần Nam Hải (Cá Ông) từ lăng miếu ra bờ biển.

> "Lễ Thỉnh Thần như một lời khấn nguyện thiêng liêng, kết nối con người với biển cả mênh mông, với đấng thần linh bảo hộ cho những chuyến ra khơi." - Cụ Nguyễn Văn D, 85 tuổi

### 2. Lễ Tế Cá Ông

Nghi lễ được thực hiện trang nghiêm với ban tế lễ gồm các bô lão có uy tín trong làng chài. Họ sẽ dâng hương, hoa quả, xôi, thịt và đặc biệt là rượu trắng - thức uống được cho là Cá Ông rất yêu thích.

### 3. Lễ Đua Thuyền

![Đua thuyền trong lễ hội Cầu Ngư](https://media.baodautu.vn/Images/chicong/2017/06/09/le_-hoi_-dua_-thuyen_-tai_-lang_-chai_-phu_-yen.jpg)

Đây là phần hội sôi động nhất với sự tham gia của nhiều đội đua đến từ các làng chài. Mỗi thuyền đua thường được trang trí rực rỡ với cờ, hoa và có từ 20-30 người chèo.

## Các hoạt động văn hóa nghệ thuật

Ngoài các nghi lễ tâm linh, lễ hội còn có nhiều hoạt động văn hóa nghệ thuật đặc sắc:

1. **Hát Bả Trạo**: Loại hình nghệ thuật dân gian đặc trưng của ngư dân, mô tả cảnh ra khơi đánh bắt
2. **Hò Khoan**: Điệu hò truyền thống khi kéo lưới, chèo thuyền
3. **Múa Bả Trạo**: Tái hiện cảnh chèo thuyền vượt sóng ra khơi
4. **Trình diễn nhạc cụ dân gian**: Như trống, chiêng, kèn...

## Ẩm thực trong lễ hội

Lễ hội Cầu Ngư là dịp để thưởng thức những món ăn đặc sản từ biển của Phú Yên:

- **Cháo Cá Ngừ Đại Dương**: Món ăn truyền thống được chế biến từ cá ngừ tươi ngon
- **Gỏi Cá Mai**: Món ăn dân dã nhưng đặc sắc của ngư dân địa phương
- **Mực Một Nắng**: Đặc sản nổi tiếng của vùng biển Phú Yên

## Ý nghĩa văn hóa và xã hội

Lễ hội Cầu Ngư không chỉ là hoạt động tâm linh mà còn mang ý nghĩa xã hội sâu sắc:

- **Gắn kết cộng đồng**: Tăng cường tình đoàn kết giữa các thành viên trong làng chài
- **Giáo dục truyền thống**: Giúp thế hệ trẻ hiểu và trân trọng nghề biển của cha ông
- **Bảo tồn văn hóa**: Gìn giữ các giá trị văn hóa phi vật thể độc đáo của ngư dân
- **Phát triển du lịch**: Thu hút khách du lịch, góp phần phát triển kinh tế địa phương

---

Lễ hội Cầu Ngư là minh chứng sinh động cho đời sống tinh thần phong phú và nét văn hóa độc đáo của ngư dân Phú Yên. Trải qua bao thăng trầm của lịch sử, lễ hội vẫn được bảo tồn và phát huy, trở thành di sản văn hóa quý báu của vùng đất này.`,
        excerpt: 'Khám phá Lễ hội Cầu Ngư - nét văn hóa đặc sắc của ngư dân Phú Yên với các nghi lễ tâm linh và hoạt động văn hóa phong phú thể hiện đời sống tinh thần của cộng đồng ngư dân ven biển.',
        category: 'festival',
        location: {
          district: 'song_cau',
          specific_place: 'Các làng chài ven biển Phú Yên'
        },
        featured_image: 'https://i-ngoisao.vnecdn.net/2023/02/06/z1-8481-1675670748.jpg',
        status: 'published',
        author_id: authorId // Sử dụng ID cố định
      },
      {
        title: 'Sắc Màu Áo Bà Ba Trong Văn Hóa Phú Yên',
        content: `# Sắc Màu Áo Bà Ba Trong Văn Hóa Phú Yên

## Nguồn gốc và lịch sử

Áo bà ba là trang phục truyền thống gắn liền với vùng đất Nam Bộ, nhưng tại Phú Yên, chiếc áo này mang những nét đặc trưng riêng và trở thành một phần không thể thiếu trong đời sống văn hóa của người dân địa phương.

![Áo Bà Ba Phú Yên](https://bizweb.dktcdn.net/100/330/208/products/ao-ba-ba-truyen-thong-mau-tim-than-2.jpg)

Theo các nhà nghiên cứu văn hóa, áo bà ba xuất hiện ở Phú Yên từ thế kỷ 18-19, khi những người miền Tây Nam Bộ di cư đến sinh sống và mang theo nét văn hóa truyền thống của mình.

## Đặc điểm của áo bà ba Phú Yên

Áo bà ba Phú Yên có nhiều điểm tương đồng với áo bà ba Nam Bộ nhưng cũng có những nét riêng biệt:

1. **Kiểu dáng**: Cổ trụ, tay rộng, thân áo suông dài
2. **Màu sắc**: Thường có màu đen, nâu, xanh than hoặc các màu trầm
3. **Chất liệu**: Sử dụng vải cotton, lụa hoặc vải thô tự dệt
4. **Hoa văn**: Thường đơn giản hoặc có các họa tiết thêu tay tinh tế

> "Áo bà ba Phú Yên không chỉ là trang phục mà còn là biểu tượng của sự cần cù, giản dị và tình yêu thiên nhiên của người dân xứ này." - Nhà nghiên cứu văn hóa Lê Thị E

## Vai trò trong đời sống văn hóa

### Trang phục lao động

Áo bà ba là trang phục lý tưởng cho người dân Phú Yên trong các hoạt động lao động hàng ngày:

- **Đồng áng**: Chất liệu thấm hút mồ hôi tốt, thoáng mát
- **Đánh bắt thủy hải sản**: Bền, dễ giặt sạch
- **Buôn bán**: Lịch sự nhưng không kém phần giản dị

### Trang phục lễ hội

Trong các dịp lễ hội truyền thống, áo bà ba được may bằng chất liệu cao cấp hơn như lụa, với màu sắc tươi sáng và thêm các chi tiết thêu tay công phu:

- **Lễ hội Cầu Ngư**: Áo bà ba xanh biển tượng trưng cho biển cả
- **Tết Nguyên Đán**: Áo bà ba đỏ, vàng mang ý nghĩa may mắn
- **Lễ cưới**: Áo bà ba hồng nhạt cho cô dâu vùng nông thôn

## Nghề dệt và may áo bà ba truyền thống

Tại một số làng nghề ở Phú Yên, nghề dệt và may áo bà ba truyền thống vẫn được duy trì:

1. **Làng dệt An Mỹ** (huyện Tuy An): Nổi tiếng với kỹ thuật dệt thủ công
2. **Làng nghề Phú Thứ** (thị xã Sông Cầu): Chuyên may áo bà ba thêu tay
3. **Làng Gò Dài** (huyện Đông Hòa): Khéo léo trong việc nhuộm màu tự nhiên

## Áo bà ba trong văn học nghệ thuật

Hình ảnh chiếc áo bà ba đã xuất hiện trong nhiều tác phẩm văn học, âm nhạc của Phú Yên:

- Thơ dân gian: *"Áo bà ba xanh biếc, Gợi nhớ biển quê nhà"*
- Ca dao: *"Áo bà ba nâu, Đợi anh nơi cầu, Nắng mưa chẳng sờn"*
- Nhạc phẩm: *"Cô gái Phú Yên áo bà ba"* của nhạc sĩ địa phương

## Áo bà ba trong xu thế hiện đại

Trong bối cảnh hiện đại hóa, áo bà ba đã có nhiều biến thể để phù hợp với cuộc sống đương đại:

- **Áo bà ba cách tân**: Giữ nét truyền thống nhưng cải tiến kiểu dáng
- **Áo bà ba cho giới trẻ**: Sử dụng chất liệu và màu sắc hiện đại
- **Áo bà ba trong sự kiện văn hóa**: Trở thành biểu tượng văn hóa địa phương

### Các hoạt động bảo tồn

1. **Festival Áo Bà Ba**: Tổ chức định kỳ 2 năm một lần tại Phú Yên
2. **Lớp dạy may truyền thống**: Dành cho người trẻ muốn học nghề
3. **Triển lãm**: Giới thiệu lịch sử và giá trị của áo bà ba

---

Áo bà ba không chỉ đơn thuần là một loại trang phục mà còn là sợi dây kết nối giữa quá khứ và hiện tại, giữa các thế hệ người dân Phú Yên. Trong dòng chảy phát triển không ngừng của xã hội hiện đại, chiếc áo bà ba vẫn giữ một vị trí đặc biệt trong trái tim người dân và trong bản sắc văn hóa của vùng đất này.`,
        excerpt: 'Khám phá áo bà ba - trang phục truyền thống mang đậm bản sắc văn hóa Phú Yên với những nét đặc trưng về kiểu dáng, màu sắc và vai trò quan trọng trong đời sống văn hóa địa phương.',
        category: 'culture',
        location: {
          district: 'phu_yen_city',
          specific_place: 'Các làng nghề truyền thống Phú Yên'
        },
        featured_image: 'https://bizweb.dktcdn.net/100/330/208/products/ao-ba-ba-truyen-thong-mau-tim-than-2.jpg',
        status: 'published',
        author_id: authorId // Sử dụng ID cố định
      }
    ];

    // Tạo slug cho mỗi bài viết
    for (const post of samplePosts) {
      post.slug = slugify(post.title, { lower: true, locale: 'vi', strict: true });
    }

    // Thêm vào database
    const result = await HometownPost.insertMany(samplePosts);
    
    // In danh sách các bài viết đã thêm
    console.table(result.map(post => ({ 
      title: post.title, 
      slug: post.slug,
      category: post.category,
      status: post.status
    })));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding hometown posts:', error);
    process.exit(1);
  }
};

// Chạy script
seedHometownPosts();