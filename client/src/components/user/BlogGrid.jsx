import React from 'react';
import BlogPostCard from './BlogPostCard';

const BlogGrid = ({ posts, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-300"></div>
            <div className="p-5">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        ))}
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

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>Không có bài viết nào được tìm thấy!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogPostCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default BlogGrid;