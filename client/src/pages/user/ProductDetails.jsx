import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import { assets } from "@/assets/assets";
import { toast } from "sonner";
import productService from "../../services/productService.js";
import ProductCard from "../../components/user/item/ProductCard.jsx";
import categoryService from "../../services/categoryService.js";
import { useCartContext } from "@/context/CartContext";
import { useAppContext } from "@/context/AppContext";
import ratingService from "@/services/rating.service.js";
import { Rate } from "antd";

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-lg ${
            i < rating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ProductDetails = () => {
  const { user } = useAppContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartContext();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [ratings, setRatings] = useState([]);
  const [newRatingContent, setNewRatingContent] = useState("");
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // số rating mỗi trang
  const [total, setTotal] = useState(0);
  const [rating, setRating] = useState(5);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  const formatCurrency = (value) =>
    value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // Xử lý thêm vào giỏ
  const handleAddToCart = async () => {
    try {
      if (!user) {
        toast.info("Vui lòng đăng nhập!");
      } else {
        await addToCart(product._id, quantity);
        toast.success(`${product.name} đã được thêm vào giỏ hàng!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Thêm vào giỏ hàng thất bại!");
    }
  };

  // Fetch product by id
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch product
        const res = await productService.getById(id);
        if (!res.success) return;
        const prod = res.data;
        setProduct(prod);
        setThumbnail(prod.images[0]);

        // 2️⃣ Fetch category dựa trên category_id
        if (prod.category_id) {
          const categoryRes = await categoryService.getById(prod.category_id);
          if (categoryRes.success) {
            setCategoryName(categoryRes.data.name);
          }
        }

        // 3️⃣ Fetch related products
        const relatedRes = await productService.getAll();
        if (relatedRes.success) {
          const related = relatedRes.data
            .filter((p) => p._id !== prod._id && p.category === prod.category)
            .slice(0, 5);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch ratings
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoadingRatings(true);
        const res = await ratingService.getRatingsByProduct(id, page, limit);
        console.log("Ratings response:", res);
        if (res.success) {
          setRatings(res.ratings);
          setTotal(res.total);
          setAverageRating(res.averageRating || 0);
          setTotalRatings(res.totalRatings || 0);
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
      } finally {
        setLoadingRatings(false);
      }
    };

    fetchRatings();
  }, [id, page, limit]);

  const handleSubmitRating = async () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để đánh giá!");
      return;
    }
    if (!newRatingContent.trim()) {
      toast.warning("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    try {
      const res = await ratingService.createRating({
        product_id: id,
        content: newRatingContent,
        rating,
      });

      // ✅ Nếu thành công
      setRatings((prev) => [res.data.rating, ...prev]);
      setNewRatingContent("");
      setRating(5);
      toast.success("Đã thêm đánh giá!");
      
      // Refresh average rating
      const avgRes = await ratingService.getProductAverageRating(id);
      if (avgRes.success) {
        setAverageRating(avgRes.data.averageRating);
        setTotalRatings(avgRes.data.totalRatings);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(
          err.response.data?.message ||
            "Bạn cần mua sản phẩm này trước khi đánh giá!"
        );
      } else if (err.response?.status === 400) {
        toast.error(
          err.response.data?.message ||
            "Bạn đã đánh giá sản phẩm này rồi!"
        );
      } else {
        toast.error("Có lỗi khi gửi đánh giá!");
      }
      console.error("Error submitting rating:", err);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  if (loading) return <p className="text-center mt-10">Đang tải sản phẩm...</p>;
  if (!product)
    return <p className="text-center mt-10">Không tìm thấy sản phẩm.</p>;

  return (
    <div className="w-full h-auto mb-10">
      {/* Banner */}
      <div className="relative w-full h-[400px]">
        <img
          src={assets.banner_main_1}
          alt="banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
          <h1 className="text-5xl font-bold mb-4">Chi tiết sản phẩm</h1>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full">
            <a href="/" className="hover:underline">
              Home
            </a>
            <span>|</span>
            <span>Product Details</span>
          </div>
        </div>
      </div>

      {/* Product info */}
      <div className="flex flex-col md:flex-row gap-16 m-28">
        {/* Thumbnails */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-3">
            {product.images.map((imageObj, index) => (
              <div
                key={index}
                onClick={() => setThumbnail(imageObj)}
                className={`border rounded overflow-hidden cursor-pointer w-30 h-30 ${
                  thumbnail === imageObj
                    ? "border-green-700"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={imageObj.image_url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          <div className="border border-gray-300 rounded overflow-hidden w-[500px] h-[500px]">
            <img
              src={thumbnail?.image_url || product.images[0].image_url}
              alt="Selected product"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product details */}
        <div className="flex-1">
          <p className="text-xl text-gray-500">{categoryName}</p>
          <h1 className="text-3xl font-bold mt-2">{product.name}</h1>

          {/* Rating summary */}
          <div className="flex items-center gap-4 mt-2">
            <StarRating rating={Math.round(averageRating)} />
            <span className="text-gray-600">
              ({averageRating.toFixed(1)} - {totalRatings} đánh giá)
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <p className="text-2xl font-semibold text-green-700">
              {formatCurrency(product.sale_price)}
            </p>
            <p className="text-gray-500 line-through">
              {formatCurrency(product.price)}
            </p>
            <p className="text-green-500 font-medium">
              Số lượng đã bán: {product.sold_quantity}
            </p>
          </div>

          <p className="text-gray-600 mt-6">{product.description}</p>

          <div className="flex items-center gap-4 mt-10">
            {/* Quantity */}
            <div className="flex items-center border rounded-lg overflow-hidden w-32 justify-between">
              <button
                onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                className="w-10 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-semibold"
              >
                -
              </button>
              <span className="flex-1 text-center text-lg font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-10 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-semibold"
              >
                +
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3.5 font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition rounded-lg shadow-sm"
            >
              Add To Cart
            </button>

            {/* Buy Now */}
            <button
              onClick={() => navigate("/checkout")}
              className="flex-1 py-3.5 font-medium bg-green-700 text-white hover:bg-green-800 transition rounded-lg shadow-sm"
            >
              Buy Now
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p>
              <span className="font-medium">Category:</span> {categoryName}
            </p>
            <p>
              <span className="font-medium">Tags:</span>{" "}
              {product.tags?.join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Ratings & Reviews */}
      <div className="m-16">
        <h2 className="text-3xl font-semibold mb-6">Đánh giá sản phẩm</h2>
        
        {/* Rating stats */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-yellow-500">
              {averageRating.toFixed(1)}
            </div>
            <div>
              <StarRating rating={Math.round(averageRating)} />
              <p className="text-gray-600">{totalRatings} đánh giá</p>
            </div>
          </div>
        </div>

        {/* Form nhập rating */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-3">Viết đánh giá của bạn</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-2">Số sao:</label>
            <Rate value={rating} onChange={(value) => setRating(value)} />
          </div>
          <textarea
            value={newRatingContent}
            onChange={(e) => setNewRatingContent(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
            rows={3}
          />
          <button
            onClick={handleSubmitRating}
            className="mt-3 px-5 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
          >
            Gửi đánh giá
          </button>
        </div>

        {/* Danh sách ratings */}
        {loadingRatings ? (
          <p>Đang tải đánh giá...</p>
        ) : ratings.length === 0 ? (
          <p className="text-gray-500">Chưa có đánh giá nào.</p>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => (
              <div
                key={r._id.toString()}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-800">
                    {r.user_id?.name || "Người dùng ẩn danh"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.created_at || r.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <StarRating rating={r.rating || 5} />
                <p className="text-gray-700 mt-2">{r.content}</p>
              </div>
            ))}

            {/* Nút phân trang */}
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    page === i + 1
                      ? "bg-green-700 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="m-16">
          <h2 className="text-4xl font-semibold mb-4 text-center gap-6">
            Related Products
          </h2>
          <Slider {...sliderSettings}>
            {relatedProducts.map((product) => {
              const primary_image =
                product.images && product.images.length > 0
                  ? product.images.find((img) => img.is_primary)?.image_url ||
                    product.images[0].image_url
                  : "";

              return (
                <ProductCard
                  key={product._id}
                  product={{ ...product, primary_image }}
                />
              );
            })}
          </Slider>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;