import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import categoryService from '@/services/categoryService';
import useDebounce from '@/hooks/useDebounce';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconSearch,
  IconCategory,
  IconEye,
  IconEyeOff,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconPhoto,
  IconUpload
} from '@tabler/icons-react';
import { assets } from "@/assets/assets";
import { Link } from "react-router-dom";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    loadCategories();
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoryService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm
      });
      
      if (response.success) {
        setCategories(response.data.categories || response.data);
        
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.total_pages);
          setTotalItems(response.data.pagination.total_items);
          setCurrentPage(response.data.pagination.current_page);
        }
      }
    } catch (error) {
      console.error('Load categories error:', error);
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isSaving || isUploading) return;
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      is_active: true
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    const toastId = toast.loading('Đang upload ảnh...');
    setIsUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('images', file);

      const res = await fetch('http://localhost:3000/api/upload/multiple', {
        method: 'POST',
        body: formDataUpload,
      });

      const response = await res.json();

      if (response.success && response.data) {
        const { successful = [] } = response.data;

        if (Array.isArray(successful) && successful.length > 0) {
          const imageUrl = successful[0].url;

          setFormData(prev => ({
            ...prev,
            image: imageUrl
          }));

          toast.success('Upload ảnh thành công!', { id: toastId });
        } else {
          toast.error('Upload ảnh thất bại!', { id: toastId });
        }
      } else {
        toast.error(response.message || 'Upload ảnh thất bại!', { id: toastId });
      }
    } catch (err) {
      console.error('❌ Upload error:', err);
      toast.error('Có lỗi khi upload ảnh: ' + err.message, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setIsSaving(true);
      let response;

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image,
        is_active: formData.is_active
      };

      console.log('📤 Sending payload:', payload);

      if (editingCategory) {
        response = await categoryService.update(editingCategory._id, payload);
      } else {
        response = await categoryService.create(payload);
      }

      if (response.success) {
        toast.success(response.message || (editingCategory ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công'));
        handleCloseModal();
        loadCategories();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Save category error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      return;
    }

    try {
      const response = await categoryService.delete(categoryId);
      if (response.success) {
        toast.success(response.message || 'Xóa danh mục thành công');
        loadCategories();
      } else {
        toast.error(response.message || 'Không thể xóa danh mục');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa danh mục');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const response = await categoryService.update(category._id, {
        name: category.name,
        description: category.description,
        image: category.image,
        is_active: !category.is_active
      });

      if (response.success) {
        toast.success(response.message || `${category.is_active ? 'Ẩn' : 'Hiện'} danh mục thành công`);
        loadCategories();
      }
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const isSearching = searchTerm !== debouncedSearchTerm;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh mục...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner Section - Full Width */}
      <section
        className="bg-cover bg-center py-20 text-center text-white relative"
        style={{ backgroundImage: `url(${assets.page_banner})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-5xl font-bold drop-shadow-lg">Quản lý danh mục</h1>
          <ul className="flex justify-center gap-2 mt-4 text-sm">
            <li>
              <Link to="/seller" className="hover:underline font-medium">
                Dashboard
              </Link>
            </li>
            <li className="font-medium">/ Quản lý danh mục</li>
          </ul>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition shadow-sm"
            >
              <IconPlus className="w-5 h-5" />
              Thêm danh mục
            </button>
          </div>

          {/* Search and Filter Section */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm danh mục theo tên, slug..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {searchTerm && !isSearching && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  title="Xóa tìm kiếm"
                >
                  <IconX className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="5">5 / trang</option>
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
            </select>
          </div>

          {/* Search Results Info */}
          {debouncedSearchTerm && (
            <div className="mb-4 text-sm text-gray-600">
              Tìm thấy <span className="font-semibold text-green-600">{totalItems}</span> kết quả cho "{debouncedSearchTerm}"
              {totalItems > 0 && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 text-green-600 hover:text-green-700 underline"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hình ảnh</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tên danh mục</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Slug</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Mô tả</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {debouncedSearchTerm ? (
                        <div className="flex flex-col items-center gap-2">
                          <IconSearch className="w-12 h-12 text-gray-300" />
                          <p>Không tìm thấy danh mục nào phù hợp với "{debouncedSearchTerm}"</p>
                          <button
                            onClick={() => setSearchTerm('')}
                            className="mt-2 text-green-600 hover:text-green-700 underline text-sm"
                          >
                            Xóa tìm kiếm
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <IconCategory className="w-12 h-12 text-gray-300" />
                          <p>Chưa có danh mục nào</p>
                          <button
                            onClick={() => handleOpenModal()}
                            className="mt-2 text-green-600 hover:text-green-700 underline text-sm"
                          >
                            Thêm danh mục đầu tiên
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center"
                          style={{ display: category.image ? 'none' : 'flex' }}
                        >
                          <IconCategory className="w-8 h-8 text-gray-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{category.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                          {category.description || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition ${
                            category.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category.is_active ? (
                            <>
                              <IconEye className="w-4 h-4" />
                              Hiển thị
                            </>
                          ) : (
                            <>
                              <IconEyeOff className="w-4 h-4" />
                              Ẩn
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <IconEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Xóa"
                          >
                            <IconTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <IconChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-lg transition ${
                            page === currentPage
                              ? 'bg-green-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <IconChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving && !isUploading) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <IconCategory className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {editingCategory ? 'Cập nhật thông tin danh mục' : 'Điền thông tin để tạo danh mục mới'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSaving || isUploading}
                className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Đóng"
              >
                <IconX className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="px-6 py-6 space-y-5">
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nhập tên danh mục (VD: Thực phẩm tươi sống)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    disabled={isSaving || isUploading}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Slug sẽ được tự động tạo từ tên danh mục ở Backend
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả danh mục
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Nhập mô tả chi tiết về danh mục..."
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none transition"
                    disabled={isSaving || isUploading}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      Mô tả ngắn gọn về danh mục sản phẩm
                    </p>
                    <p className="text-xs text-gray-400">
                      {formData.description.length}/500
                    </p>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hình ảnh danh mục
                  </label>
                  
                  {formData.image ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600">Xem trước:</p>
                      <div className="relative inline-block">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            toast.error('URL hình ảnh không hợp lệ');
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={isSaving || isUploading}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Xóa ảnh"
                        >
                          <IconX className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving || isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IconUpload className="w-5 h-5" />
                        Đổi ảnh khác
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition">
                      <IconPhoto className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">
                        Chưa có ảnh. Click nút bên dưới để upload
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving || isUploading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Đang upload...</span>
                          </>
                        ) : (
                          <>
                            <IconUpload className="w-5 h-5" />
                            <span>Chọn ảnh từ máy tính</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSaving || isUploading}
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    💡 Hỗ trợ: JPG, PNG, GIF. Tối đa 5MB
                  </p>
                </div>

                {/* Active Status */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="is_active_modal"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    disabled={isSaving || isUploading}
                  />
                  <div className="flex-1">
                    <label htmlFor="is_active_modal" className="text-sm font-semibold text-gray-800 cursor-pointer">
                      Hiển thị danh mục
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Danh mục sẽ được hiển thị trên website và có thể được sử dụng cho sản phẩm
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    formData.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {formData.is_active ? 'Hiển thị' : 'Ẩn'}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving || isUploading}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading || !formData.name.trim()}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      {editingCategory ? (
                        <>
                          <IconEdit className="w-5 h-5" />
                          <span>Cập nhật</span>
                        </>
                      ) : (
                        <>
                          <IconPlus className="w-5 h-5" />
                          <span>Tạo danh mục</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CategoryManagement;