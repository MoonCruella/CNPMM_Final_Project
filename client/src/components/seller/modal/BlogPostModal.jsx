import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import blogService from '@/services/blogService';
import TipTapEditor from '@/components/ui/TipTapEditor';

const BlogPostModal = ({ isOpen, onClose, postToEdit = null, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'tourism',
    featured_image: '',
    status: 'published',
    location: {
      district: 'phu_yen_city',
      specific_place: ''
    }
  });

  useEffect(() => {
    if (postToEdit) {
      setFormData({
        title: postToEdit.title || '',
        content: postToEdit.content || '',
        excerpt: postToEdit.excerpt || '',
        category: postToEdit.category || 'tourism',
        featured_image: postToEdit.featured_image || '',
        status: postToEdit.status || 'published',
        location: {
          district: postToEdit.location?.district || 'phu_yen_city',
          specific_place: postToEdit.location?.specific_place || ''
        }
      });

      if (postToEdit.featured_image) {
        setPreviewImage(postToEdit.featured_image);
      }
    } else {
      resetForm();
    }
  }, [postToEdit, isOpen]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'tourism',
      featured_image: '',
      status: 'published',
      location: {
        district: 'phu_yen_city',
        specific_place: ''
      }
    });
    setPreviewImage('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleContentChange = (value) => {
    console.log("Nhận nội dung Markdown từ TipTapEditor:", value.substring(0, 100) + "...");
    setFormData(prev => ({ ...prev, content: value }));
  };

  const handleSwitchChange = (checked) => {
    setFormData(prev => ({ ...prev, status: checked ? 'published' : 'draft' }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast.error('Ảnh phải nhỏ hơn 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Định dạng ảnh không hỗ trợ. Vui lòng chọn JPEG, PNG, GIF hoặc WebP');
      return;
    }

    // Preview image locally
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await blogService.uploadImage(formData);
      if (response.success) {
        setFormData(prev => ({ ...prev, featured_image: response.data.url }));
        toast.success('Tải ảnh lên thành công');
      } else {
        toast.error(response.message || 'Lỗi khi tải ảnh lên');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) errors.push('Vui lòng nhập tiêu đề bài viết');
    if (formData.title.length < 10) errors.push('Tiêu đề phải có ít nhất 10 ký tự');
    if (!formData.content.trim()) errors.push('Vui lòng nhập nội dung bài viết');
    if (formData.content.length < 50) errors.push('Nội dung phải có ít nhất 50 ký tự');
    if (!formData.excerpt.trim()) errors.push('Vui lòng nhập tóm tắt bài viết');
    if (!formData.featured_image) errors.push('Vui lòng chọn ảnh đại diện');

    if (errors.length) {
      errors.forEach(err => toast.error(err));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      let response;

      if (postToEdit) {
        // Update existing post
        response = await blogService.updatePost(postToEdit._id, formData);
        if (response.success) {
          toast.success('Cập nhật bài viết thành công');
          onSuccess(response.data);
          onClose();
        } else {
          toast.error(response.message || 'Lỗi khi cập nhật bài viết');
        }
      } else {
        // Create new post
        response = await blogService.createPost(formData);
        if (response.success) {
          toast.success('Tạo bài viết mới thành công');
          onSuccess(response.data);
          onClose();
        } else {
          toast.error(response.message || 'Lỗi khi tạo bài viết');
        }
      }
    } catch (error) {
      console.error('Error submitting blog post:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {postToEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Main info */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề bài viết</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Nhập tiêu đề bài viết"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Tóm tắt bài viết</Label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  placeholder="Nhập tóm tắt bài viết (hiển thị ở trang danh sách)"
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Nội dung bài viết</Label>
                
                {/* Thay thế textarea bằng TipTap Editor */}
                <TipTapEditor 
                  value={formData.content} 
                  onChange={handleContentChange}
                  placeholder="Viết nội dung bài viết của bạn ở đây..."
                />
              </div>
            </div>

            {/* Right column - Meta info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featured_image">Ảnh đại diện</Label>
                <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                  {previewImage ? (
                    <div className="space-y-2">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="mx-auto h-40 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreviewImage('');
                          setFormData(prev => ({ ...prev, featured_image: '' }));
                        }}
                      >
                        Xóa ảnh
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="h-40 flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">
                        {uploadingImage ? 'Đang tải...' : 'Nhấn để chọn ảnh'}
                      </p>
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Danh mục</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="tourism">Du lịch</option>
                  <option value="food">Ẩm thực</option>
                  <option value="culture">Văn hóa</option>
                  <option value="history">Lịch sử</option>
                  <option value="festival">Lễ hội</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location.district">Địa điểm</Label>
                <select
                  id="location.district"
                  name="location.district"
                  value={formData.location.district}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
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

              <div className="space-y-2">
                <Label htmlFor="location.specific_place">Địa điểm cụ thể</Label>
                <Input
                  id="location.specific_place"
                  name="location.specific_place"
                  value={formData.location.specific_place}
                  onChange={handleChange}
                  placeholder="Ví dụ: Xã An Ninh Đông, Huyện Tuy An"
                />
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="status"
                  checked={formData.status === 'published'}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="status">
                  {formData.status === 'published' ? 'Đăng ngay' : 'Lưu nháp'}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || uploadingImage}
            >
              {isLoading ? 'Đang xử lý...' : postToEdit ? 'Cập nhật' : 'Tạo bài viết'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostModal;