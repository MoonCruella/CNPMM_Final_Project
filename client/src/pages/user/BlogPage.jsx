import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import blogService from '@/services/blogService.js';
import BlogGrid from '@/components/user/BlogGrid.jsx';
import { assets } from '@/assets/assets';
import BlogPostCard from '@/components/user/BlogPostCard.jsx'
const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [featuredPosts, setFeaturedPosts] = useState([]);

  const category = searchParams.get('category');
  const location = searchParams.get('location');
  const searchQuery = searchParams.get('q');
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        const params = { page: currentPage, limit: 9 };
        
        if (searchQuery) {
          response = await blogService.search(searchQuery, params);
        } else if (category) {
          response = await blogService.getByCategory(category, params);
        } else if (location) {
          response = await blogService.getByLocation(location, params);
        } else {
          response = await blogService.getAll(params);
        }
        
        if (response.success) {
          setPosts(response.data.posts || []);
          setTotalPages(response.data.pagination?.totalPages || 1);
        } else {
          setError(response.message || 'Có lỗi xảy ra');
        }
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setError('Không thể tải bài viết. Vui lòng thử lại sau!');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, category, location, searchQuery]);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        const response = await blogService.getFeatured(5);
        if (response.success) {
          setFeaturedPosts(response.data || []);
        }
      } catch (err) {
        console.error("Error fetching featured posts:", err);
      }
    };

    fetchFeaturedPosts();
  }, []);

  const handlePageChange = (page) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', page.toString());
      return newParams;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryNames = {
    tourism: 'Du lịch',
    food: 'Ẩm thực',
    culture: 'Văn hóa',
    history: 'Lịch sử',
    festival: 'Lễ hội'
  };

  const districtNames = {
    phu_yen_city: 'TP. Tuy Hòa',
    dong_hoa: 'Đông Hòa',
    tuy_an: 'Tuy An',
    son_hoa: 'Sơn Hòa',
    song_hinh: 'Sông Hinh',
    tay_hoa: 'Tây Hòa',
    phu_hoa: 'Phú Hòa',
    dong_xuan: 'Đồng Xuân',
    song_cau: 'Sông Cầu'
  };

  const getPageTitle = () => {
    if (searchQuery) return `Tìm kiếm: ${searchQuery}`;
    if (category) return `Danh mục: ${categoryNames[category] || category}`;
    if (location) return `Địa điểm: ${districtNames[location] || location}`;
    return 'Blog Quê Hương';
  };

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
          <h1 className="text-5xl font-bold mb-4">Blog Quê Hương</h1>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full">
            <a href="/" className="hover:underline">
              Home
            </a>
            <span>|</span>
            <span>Blog</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Tiêu đề trang */}
        <h2 className="text-3xl font-bold mb-8 text-gray-800">{getPageTitle()}</h2>
        
        {/* Công cụ lọc và tìm kiếm */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="w-full md:w-1/3">
            <input 
              type="text" 
              placeholder="Tìm kiếm bài viết..." 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchQuery || ''}
              onChange={(e) => {
                const newParams = new URLSearchParams();
                if (e.target.value) newParams.set('q', e.target.value);
                newParams.set('page', '1');
                setSearchParams(newParams);
              }}
            />
          </div>

          <div className="w-full md:w-1/4">
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={category || ''}
              onChange={(e) => {
                const newParams = new URLSearchParams();
                if (e.target.value) newParams.set('category', e.target.value);
                newParams.set('page', '1');
                setSearchParams(newParams);
              }}
            >
              <option value="">Tất cả danh mục</option>
              <option value="tourism">Du lịch</option>
              <option value="food">Ẩm thực</option>
              <option value="culture">Văn hóa</option>
              <option value="history">Lịch sử</option>
              <option value="festival">Lễ hội</option>
            </select>
          </div>

          <div className="w-full md:w-1/4">
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={location || ''}
              onChange={(e) => {
                const newParams = new URLSearchParams();
                if (e.target.value) newParams.set('location', e.target.value);
                newParams.set('page', '1');
                setSearchParams(newParams);
              }}
            >
              <option value="">Tất cả địa điểm</option>
              <option value="phu_yen_city">TP. Tuy Hòa</option>
              <option value="dong_hoa">Đông Hòa</option>
              <option value="tuy_an">Tuy An</option>
              <option value="son_hoa">Sơn Hòa</option>
              <option value="song_hinh">Sông Hinh</option>
              <option value="tay_hoa">Tây Hòa</option>
              <option value="phu_hoa">Phú Hòa</option>
              <option value="dong_xuan">Đồng Xuân</option>
              <option value="song_cau">Sông Cầu</option>
            </select>
          </div>
        </div>

        {/* Danh sách bài viết */}
        <BlogGrid posts={posts} loading={loading} error={error} />

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10">
            <div className="flex space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Trước
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === page
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tiếp
              </button>
            </div>
          </div>
        )}

        {/* Bài viết nổi bật */}
        {featuredPosts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Bài viết nổi bật</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.slice(0, 3).map((post) => (
                <BlogPostCard key={post._id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;