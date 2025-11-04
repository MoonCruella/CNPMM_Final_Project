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
    draft: 'bg-yellow-100 text-yellow-800',
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-600">Chưa có bài viết nào</h3>
        <p className="mt-2 text-gray-500">Bạn hãy tạo bài viết đầu tiên</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-md border bg-white shadow-sm">
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
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPosts.map((post, index) => (
            <TableRow key={post._id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  {post.featured_image && (
                    <img 
                      src={post.featured_image} 
                      alt={post.title} 
                      className="w-12 h-12 object-cover rounded border"
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
              <TableCell>
                <div className="text-sm">
                  {formatDate(post.created_at || post.createdAt)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{post.views || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(post)}
                    className="h-8"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Sửa
                  </Button>

                  {/*  Nút Đăng/Ẩn với tooltip rõ ràng hơn */}
                  {post.status === 'published' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChangeStatus(post._id, 'draft')}
                      className="h-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      title="Chuyển về bản nháp"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                      Ẩn
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChangeStatus(post._id, 'published')}
                      className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                      title="Đăng bài viết"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Đăng
                    </Button>
                  )}

                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(post._id)}
                    className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                    title="Xóa bài viết"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Xóa
                  </Button>

                  <a 
                    href={`/blog/${post.slug}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center h-8 px-3 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    title="Xem bài viết"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
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