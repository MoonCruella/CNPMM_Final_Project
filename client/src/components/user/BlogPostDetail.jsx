import React from 'react';
import ReactMarkdown from 'react-markdown';
import { formatDate } from '@/utils/format';
import { Link } from 'react-router-dom';

const BlogPostDetail = ({ post, loading, error }) => {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-8"></div>
        <div className="h-64 bg-gray-300 rounded mb-8"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Có lỗi xảy ra khi tải bài viết. Vui lòng thử lại sau!</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>Không tìm thấy bài viết!</p>
      </div>
    );
  }

  const categoryColors = {
    tourism: 'bg-blue-100 text-blue-800',
    food: 'bg-orange-100 text-orange-800',
    culture: 'bg-purple-100 text-purple-800',
    history: 'bg-amber-100 text-amber-800',
    festival: 'bg-green-100 text-green-800'
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

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
          <span className={`px-3 py-1 rounded-full ${categoryColors[post.category] || 'bg-gray-100 text-gray-800'}`}>
            <Link to={`/blog/category/${post.category}`} className="hover:underline">
              {categoryNames[post.category] || post.category}
            </Link>
          </span>
          
          {post.location && (
            <span className="flex items-center text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <Link to={`/blog/location/${post.location.district}`} className="hover:underline">
                {districtNames[post.location.district] || post.location.district}, 
                {post.location.specific_place && ` ${post.location.specific_place}`}
              </Link>
            </span>
          )}
          
          <span className="text-gray-600">
            {formatDate(post.created_at || post.createdAt)}
          </span>
          
          <span className="flex items-center text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.views || 0} lượt xem
          </span>
        </div>

        <div className="flex items-center gap-3">
          <img
            src={post.author_id?.avatar || "https://via.placeholder.com/40"}
            alt={post.author_id?.name || "Author"}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-medium text-gray-900">{post.author_id?.name || "Tác giả"}</p>
            <p className="text-sm text-gray-600">Đã đăng vào {formatDate(post.created_at || post.createdAt)}</p>
          </div>
        </div>
      </header>

      {post.featured_image && (
        <div className="mb-8">
          <img 
            src={post.featured_image}
            alt={post.title}
            className="w-full h-auto rounded-lg shadow-md"
          />
        </div>
      )}

      <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-green-700 prose-img:rounded-lg">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Chia sẻ bài viết</h3>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200">
            <i className="fab fa-facebook-f"></i> Facebook
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-800 rounded-lg hover:bg-cyan-200">
            <i className="fab fa-twitter"></i> Twitter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200">
            <i className="fa fa-link"></i> Sao chép link
          </button>
        </div>
      </div>
    </article>
  );
};

export default BlogPostDetail;