import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/utils/format';

const BlogPostList = ({ posts, onEdit, onDelete, onChangeStatus, loading }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedPosts = () => {
    if (!posts || posts.length === 0) return [];
    
    const sortableItems = [...posts];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  };

  const sortedPosts = getSortedPosts();

  const categoryNames = {
    tourism: 'Du lịch',
    food: 'Ẩm thực',
    culture: 'Văn hóa',
    history: 'Lịch sử',
    festival: 'Lễ hội'
  };

  const statusClasses = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    archived: 'bg-red-100 text-red-800'
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium text-gray-600">Chưa có bài viết nào</h3>
        <p className="mt-2 text-gray-500">Bạn hãy tạo bài viết đầu tiên</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead 
              className="cursor-pointer w-[300px]"
              onClick={() => handleSort('title')}
            >
              Tiêu đề {renderSortIndicator('title')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('category')}
            >
              Danh mục {renderSortIndicator('category')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Trạng thái {renderSortIndicator('status')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('created_at')}
            >
              Ngày tạo {renderSortIndicator('created_at')}
            </TableHead>
            <TableHead 
              className="cursor-pointer text-right"
              onClick={() => handleSort('views')}
            >
              Lượt xem {renderSortIndicator('views')}
            </TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPosts.map((post, index) => (
            <TableRow key={post._id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  {post.featured_image && (
                    <img 
                      src={post.featured_image} 
                      alt={post.title} 
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="truncate max-w-[220px]">
                    <p className="font-medium truncate">{post.title}</p>
                    <p className="text-gray-500 text-xs truncate">{post.slug}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {categoryNames[post.category] || post.category}
                </span>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[post.status] || 'bg-gray-100'}`}>
                  {{
                    published: 'Đã đăng',
                    draft: 'Bản nháp',
                    archived: 'Đã lưu trữ'
                  }[post.status] || post.status}
                </span>
              </TableCell>
              <TableCell>{formatDate(post.created_at || post.createdAt)}</TableCell>
              <TableCell className="text-right">{post.views || 0}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(post)}
                  >
                    Sửa
                  </Button>

                  {post.status === 'published' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChangeStatus(post._id, 'draft')}
                      className="text-amber-600 hover:bg-amber-50"
                    >
                      Ẩn
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChangeStatus(post._id, 'published')}
                      className="text-green-600 hover:bg-green-50"
                    >
                      Đăng
                    </Button>
                  )}

                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(post._id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Xóa
                  </Button>

                  <a 
                    href={`/blog/${post.slug}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Xem
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BlogPostList;