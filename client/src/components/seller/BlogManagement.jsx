import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; //
import { Input } from "@/components/ui/input";
import BlogPostList from "./BlogPostList";
import BlogPostModal from "./modal/BlogPostModal";
import blogService from "@/services/blogService";
import { toast } from "sonner";
import { assets } from "@/assets/assets";
import { Button } from "antd";

const BlogManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, filterStatus]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        status: filterStatus !== "all" ? filterStatus : undefined,
        search: searchTerm || undefined,
      };

      const response = await blogService.getSellerPosts(params);

      if (response.success) {
        setPosts(response.data.posts || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        toast.error(response.message || "Không thể tải danh sách bài viết");
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const handleCreatePost = () => {
    setSelectedPost(null);
    setIsModalOpen(true);
  };

  const handleEditPost = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    try {
      const response = await blogService.deletePost(postId);

      if (response.success) {
        toast.success("Xóa bài viết thành công");
        fetchPosts();
      } else {
        toast.error(response.message || "Không thể xóa bài viết");
      }
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast.error("Có lỗi xảy ra khi xóa bài viết");
    }
  };

  const handleChangeStatus = async (postId, newStatus) => {
    try {
      const response = await blogService.changeStatus(postId, newStatus);

      if (response.success) {
        toast.success(
          `Bài viết đã được ${newStatus === "published" ? "đăng" : "ẩn"}`
        );
        fetchPosts();
      } else {
        toast.error(
          response.message || "Không thể thay đổi trạng thái bài viết"
        );
      }
    } catch (error) {
      console.error("Error changing blog post status:", error);
      toast.error("Có lỗi xảy ra khi thay đổi trạng thái bài viết");
    }
  };

  const handleModalSuccess = () => {
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section
        className="bg-cover bg-center py-20 text-center text-white relative"
        style={{ backgroundImage: `url(${assets.page_banner})` }}
      >
        {/* Overlay để text dễ đọc hơn */}
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold drop-shadow-lg">Quản lý Blog</h1>
          <ul className="flex justify-center gap-2 mt-2 text-sm">
            <li>
              <Link to="/seller" className="hover:underline font-medium">
                Dashboard
              </Link>
            </li>
            <li className="font-medium">/ Quản lý Blog</li>
          </ul>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Danh sách bài viết
              </h2>
              <p className="text-muted-foreground">
                Tạo và quản lý các bài viết blog quê hương của bạn
              </p>
            </div>

            <Button onClick={handleCreatePost}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Tạo bài viết mới
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute top-1/2 transform -translate-y-1/2 left-3 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Button type="submit" className="sr-only">
                Tìm kiếm
              </Button>
            </form>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đã đăng</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>

          <BlogPostList
            posts={posts}
            loading={loading}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            onChangeStatus={handleChangeStatus}
          />

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}

          <BlogPostModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            postToEdit={selectedPost}
            onSuccess={handleModalSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;
