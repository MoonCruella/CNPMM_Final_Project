import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/utils/format';

const BlogPostCard = ({ post }) => {
  if (!post) return null;

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

  return (
    <div className="rounded-lg bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="h-48 overflow-hidden">
          <img 
            src={post.featured_image} 
            alt={post.title} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>
      
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[post.category] || 'bg-gray-100 text-gray-800'}`}>
            {categoryNames[post.category] || post.category}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(post.created_at || post.createdAt)}
          </span>
        </div>

        <Link to={`/blog/${post.slug}`} className="block">
          <h3 className="text-xl font-semibold mb-2 text-gray-800 hover:text-green-700 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={post.author_id?.avatar || "https://via.placeholder.com/40"} 
              alt={post.author_id?.name || "Author"} 
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-700">
              {post.author_id?.name || "Tác giả"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center">
              <i className="far fa-eye mr-1"></i> {post.views || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard;