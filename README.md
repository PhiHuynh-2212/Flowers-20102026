# 🌸 Một Bó Hoa Dành Tặng Bạn · Ngày Phụ Nữ Việt Nam 20/10

<div align="center">

<img src="./assets/preview.png" alt="Một Bó Hoa Dành Tặng Bạn" width="100%">

**Một món quà công nghệ dịu dàng, lãng mạn dành tặng những người phụ nữ yêu thương.**  
*Bó hoa nở rộ chân thực, hiệu ứng cánh hoa bay, thiệp chúc mừng cá nhân hóa và album kỷ niệm ngọt ngào.*

[🌸 Trải Nghiệm Ngay](#-hướng-dẫn-chạy) • [✨ Tính Năng Nổi Bật](#-tính-năng-nổi-bật) • [☁️ Lưu Trữ & Chia Sẻ](#-tính-năng-lưu-trữ--tạo-link-chia-sẻ) • [🚀 Đưa Lên GitHub Pages](#-cách-đưa-lên-github-pages-miễn-phí)

</div>

---

## ✨ Tính Năng Nổi Bật

### 💐 1. Bó Hoa Nghệ Thuật & Hiệu Ứng Nở Sống Động
- **Đồ họa Canvas 2D tinh xảo**: Từng cánh hoa hồng, hoa mẫu đơn và nhánh baby được tính toán chuyển động tự nhiên với giọt sương, bóng đổ và độ lượn cánh mềm mại.
- **Tương tác chạm**: Chạm hoặc click vào từng bông hoa để nhận một lời thì thầm chúc mừng 20/10 dễ thương.
- **Cánh hoa bay lãng mạn**: Hiệu ứng các cánh hoa nhẹ nhàng bay theo làn gió trên nền pastel thơ mộng.

### 💌 2. Phong Bì & Thiệp Chúc Mừng 20/10
- Phong bì gấp mở mượt mà kèm con dấu sáp trái tim.
- **Font chữ Noto Serif tiếng Việt chuẩn mực**, hiển thị hoàn hảo dấu câu tiếng Việt không lo lỗi font chữ.
- Cho phép người xem bấm **"Viết lời chúc riêng ✎"** để tự sửa người nhận, lời chúc và chữ ký.

### 📸 3. Album Ảnh Kỷ Niệm 3 Khung Ảnh
- Hiệu ứng ảnh giấy vintage xếp chồng nghệ thuật, có thể **"Xòe album"** hoặc **"Gấp album"**.
- Nút **"Thay ảnh ✎"** cho phép chọn ảnh trực tiếp từ máy/điện thoại (tự động nén tối ưu độ nét và kích thước).

### 🔗 4. Tính Năng Tạo Link Chia Sẻ Độc Quyền (Supabase Cloud)
- **Tự động lưu**: Ảnh và lời chúc sau khi tạo sẽ được đồng bộ lên **Supabase Storage** & **Database**.
- **Sinh link tặng quà riêng**: Bấm **"Tạo link gửi tặng 🔗"** để nhận một đường link duy nhất (ví dụ: `https://your-site.github.io/?id=abc12345`). Người nhận chỉ cần mở link là thấy ngay trọn vẹn thiệp và album ảnh bạn đã chuẩn bị!
- Hoàn toàn bảo mật (dùng `Publishable Anon Key` an toàn cho Frontend tĩnh).

### 🌿 5. Trang Phụ: "Cả Một Vườn Thương" (`garden.html`)
- Một khu vườn hoa bát ngát trải dài từ một bông hoa đầu tiên đánh thức cả không gian.

---

## 💻 Cấu Trúc Dự Án

```plaintext
flowers-20-10/
├── 📄 index.html          # Trang chính: Bó hoa, phong bì thiệp, album kỷ niệm
├── 📄 garden.html         # Trang phụ: Vườn hoa nở rộng
├── 🎨 style.css           # Toàn bộ CSS phong cách thiệp giấy cao cấp & Noto fonts
├── 📜 script.js          # Hệ thống vẽ Canvas thực vật học và hiệu ứng hoa nở
├── 📜 card.js            # Điều khiển thiệp, phong bì, tạo link tặng quà
├── 📜 album.js           # Xử lý album ảnh và nén ảnh
├── 📜 share.js           # Module tích hợp Supabase Database & Storage
├── 📜 garden-botany.js   # Logic thực vật cho trang vườn hoa
├── 📜 garden-card.js     # Logic thiệp cho trang vườn hoa
└── 📁 assets/
    ├── preview.jpg       # Ảnh banner xem trước dự án
    ├── 📁 fonts/          # Font Noto Serif & Noto Sans chuẩn tiếng Việt (offline)
    └── portrait-placeholder.webp
```

---

## 🚀 Hướng Dẫn Chạy

### Chạy trực tiếp trên máy (Local)

Không cần cài đặt thư viện nặng hay Node.js, chỉ cần mở trực tiếp file `index.html` hoặc chạy một server tĩnh:

```bash
# Bằng Python (khuyên dùng):
python -m http.server 8080
```
Truy cập: **[http://localhost:8080](http://localhost:8080)**

---

## 🌐 Cách Đưa Lên GitHub Pages (Miễn Phí)

1. Tạo một repository mới trên [GitHub](https://github.com/new) (đặt chế độ **Public**).
2. Đẩy toàn bộ các file trong thư mục này lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Phien ban hoa 20/10 kem tao link chia se"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git
   git push -u origin main
   ```
3. Trên GitHub, vào **Settings** > **Pages** > tại mục **Branch** chọn **`main`** và thư mục **`/(root)`** > nhấn **Save**.
4. Sau 1 - 2 phút, trang web của bạn sẽ hoạt động trực tuyến tại:
   `https://<tai-khoan-cua-ban>.github.io/<ten-repo>/`

---

## 💖 Lời Chúc

> *Chúc tất cả những người phụ nữ Việt Nam luôn rạng rỡ như những đóa hoa, ngập tràn tình yêu thương và hạnh phúc trong ngày 20/10 cũng như mọi ngày trong năm!* 🌸
