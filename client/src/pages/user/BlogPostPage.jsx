import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import blogService from '@/services/blogService.js';
import BlogPostDetail from '@/components/user/BlogPostDetail';
import BlogPostCard from '@/components/user/BlogPostCard';
import { assets } from '@/assets/assets';

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    const fetchPostDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await blogService.getBySlug(slug);
        if (response.success) {
          setPost(response.data);
          
          // Fetch related posts by same category
          if (response.data.category) {
            const relatedResponse = await blogService.getByCategory(response.data.category, { limit: 3 });
            if (relatedResponse.success) {
              // Filter out the current post
              const filtered = (relatedResponse.data.posts || []).filter(p => p._id !== response.data._id);
              setRelatedPosts(filtered);
            }
          }
        } else {
          setError(response.message || 'Có lỗi xảy ra');
        }
      } catch (err) {
        console.error("Error fetching post details:", err);
        setError('Không thể tải bài viết. Vui lòng thử lại sau!');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPostDetails();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [slug]);

  return (
    <div className="w-full h-auto mb-10">
      {/* Banner */}
      <div className="relative w-full h-[300px]">
        <img
          src={assets.banner_main_1}
          alt="banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
          <h1 className="text-4xl font-bold mb-4">Chi Tiết Bài Viết</h1>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full">
            <a href="/" className="hover:underline">
              Home
            </a>
            <span>|</span>
            <a href="/blog" className="hover:underline">
              Blog
            </a>
            <span>|</span>
            <span className="truncate max-w-[200px]">
              {loading ? 'Đang tải...' : post?.title || 'Chi tiết'}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="lg:w-2/3">
            <BlogPostDetail post={post} loading={loading} error={error} />
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3 space-y-8">
            {/* Categories */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 pb-2 border-b">Danh mục</h3>
              <ul className="space-y-2">
                {['tourism', 'food', 'culture', 'history', 'festival'].map(cat => (
                  <li key={cat}>
                    <a 
                      href={`/blog?category=${cat}`} 
                      className="flex items-center justify-between py-2 text-gray-700 hover:text-green-700"
                    >
                      <span>
                        {{
                          tourism: 'Du lịch',
                          food: 'Ẩm thực',
                          culture: 'Văn hóa',
                          history: 'Lịch sử',
                          festival: 'Lễ hội'
                        }[cat]}
                      </span>
                      <span className="bg-gray-100 text-sm py-1 px-2 rounded-full">
                        {/* Số lượng bài viết theo category có thể thêm sau */}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 pb-2 border-b">Bài viết liên quan</h3>
                <div className="space-y-4">
                  {relatedPosts.map(post => (
                    <div key={post._id} className="flex gap-3">
                      <a href={`/blog/${post.slug}`} className="block w-24 h-20">
                        <img 
                          src={post.featured_image} 
                          alt={post.title} 
                          className="w-full h-full object-cover rounded"
                        />
                      </a>
                      <div className="flex-1">
                        <a 
                          href={`/blog/${post.slug}`} 
                          className="text-md font-medium text-gray-800 hover:text-green-700 line-clamp-2"
                        >
                          {post.title}
                        </a>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(post.created_at || post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Locations */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 pb-2 border-b">Địa điểm</h3>
              <ul className="space-y-2">
                {[
                  'phu_yen_city', 'dong_hoa', 'tuy_an', 'son_hoa', 
                  'song_hinh', 'tay_hoa', 'phu_hoa', 'dong_xuan', 'song_cau'
                ].map(loc => (
                  <li key={loc}>
                    <a 
                      href={`/blog?location=${loc}`} 
                      className="flex items-center py-2 text-gray-700 hover:text-green-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        {{
                          phu_yen_city: 'TP. Tuy Hòa',
                          dong_hoa: 'Đông Hòa',
                          tuy_an: 'Tuy An',
                          son_hoa: 'Sơn Hòa',
                          song_hinh: 'Sông Hinh',
                          tay_hoa: 'Tây Hòa',
                          phu_hoa: 'Phú Hòa',
                          dong_xuan: 'Đồng Xuân',
                          song_cau: 'Sông Cầu'
                        }[loc]}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;