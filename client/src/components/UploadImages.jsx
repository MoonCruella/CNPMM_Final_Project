import { useState } from "react";
import axios from "axios";

export default function UploadImage() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Vui lòng chọn file trước!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file); // phải khớp với upload.single("image") ở backend

      const res = await axios.post(
        "http://localhost:3000/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setUrl(res.data.url);
    } catch (err) {
      setError("Upload thất bại, thử lại!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2 className="text-5xl">Upload Ảnh</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        style={{ marginBottom: "10px" }}
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          padding: "10px 15px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Đang tải..." : "Upload"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {url && (
        <div style={{ marginTop: "20px" }}>
          <h3>Ảnh đã upload:</h3>
          <img
            src={url}
            alt="uploaded"
            style={{ width: "100%", maxWidth: "300px", borderRadius: "8px" }}
          />
        </div>
      )}
    </div>
  );
}
