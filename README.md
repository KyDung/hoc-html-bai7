# Web học HTML cơ bản – "Gửi tôi của 10 năm sau"

Web học tập tương tác môn Tin học THPT: **HTML + CSS + JavaScript thuần** (không npm, không build), deploy GitHub Pages,
lưu bài học sinh vào **Firebase Firestore**.

Luồng: `Thông tin → Hình thành kiến thức → Luyện tập → Vận dụng → Nộp bài → Firestore`.
Muốn tạo bài học mới dùng lại hệ thống này: xem **[HUONG_DAN_TAO_BAI_MOI.md](HUONG_DAN_TAO_BAI_MOI.md)**.

## Cấu trúc

```
index.html
css/style.css
firestore.rules          Rules dán vào Firebase Console
teacher.html             Trang giáo viên xem bài nộp (css/teacher.css, js/teacher.js)
js/
  lesson-config.js   ★ id + tên bài học (đổi mỗi bài)
  firebase-config.js ★ cấu hình Firebase (dùng chung mọi bài)
  storage.js  validators.js  editor.js  api.js  activity.js
  learning.js  practice.js  final.js    ★ nội dung bài (đổi mỗi bài)
  app.js
```

## Cài đặt Firebase (làm một lần)

1. Firebase Console → dự án của bạn → **Build → Firestore Database → Create database**.
   Chọn vị trí **asia-southeast1 (Singapore)** cho nhanh, chế độ **Production mode**.
2. Tab **Rules** → xóa nội dung cũ → dán toàn bộ file `firestore.rules` → **Publish**.
3. ⚙️ **Project settings → Your apps → </> (Web)** → đăng ký app → copy đoạn `firebaseConfig`
   dán vào `js/firebase-config.js`.
4. Chạy thử bằng Live Server (VS Code) hoặc mở `index.html`, làm thử một lượt bằng tên giả.
5. Firestore Database → **Data** → `lessons` → `html-bai7` → `students` → thấy document `10A1_TenGia`.

## Nộp bài 2 phần
- **Phần 1** = Hình thành kiến thức + Luyện tập: học sinh bấm **NỘP PHẦN 1** ở cuối Luyện tập (có thể dừng ở đây nếu hết giờ).
- **Phần 2** = Vận dụng: nộp riêng. Tiến độ được lưu trên máy nên lần sau mở lại **cùng máy, cùng trình duyệt** là làm tiếp được.
  (Đổi máy/xóa dữ liệu trình duyệt thì phải làm lại từ đầu – vì học sinh không có tài khoản.)
- Nếu học sinh bỏ qua nộp phần 1, nó sẽ được nộp bù cùng lúc với bài Vận dụng.

## Trang giáo viên (`teacher.html`)
Cài đặt một lần:
1. Firebase Console → **Authentication → Get started → Sign-in method → Google → Enable** (chọn email hỗ trợ của bạn).
2. **Authentication → Settings → Authorized domains → Add domain**: thêm `tên-github.github.io` (localhost đã có sẵn).
3. Publish lại `firestore.rules` (rules mới cho phép email giáo viên đọc; đổi email ở hàm `isTeacher()` nếu cần).

Dùng: mở `https://<tên-github>.github.io/<repo>/teacher.html` → đăng nhập Google → chọn bài học, lọc theo lớp / tên / trạng thái.
Bảng cập nhật **realtime** khi học sinh nộp. Bấm một học sinh để xem preview bài vận dụng, code, từng bài Hình thành/Luyện tập,
thống kê gõ (⚠️ = nghi dán code hoặc gõ quá ít ký tự so với độ dài code), tải `.html`, xóa bài (dọn bài test), xuất CSV (mở được bằng Excel).

## Dữ liệu trên Firestore

```
lessons/{id bài}/students/{lớp_họtên}     ví dụ lessons/html-bai7/students/10A1_NguyenVanAn
  student { name, className }
  learning[]  practice[]                  code từng bài, attempts, passed, typingStats...
  progress { learningCompleted, practiceCompleted, part1Submitted, part1SubmittedAt, finalSubmitted, finalSubmittedAt }
  final { code, characters, typingStats, requirements, submittedAt }   code HTML nguyên văn
  updatedAt
```

Học sinh nộp lại → ghi đè đúng document đó (không sinh thêm).
Xem `typingStats`: `charsTyped` thấp so với độ dài code hoặc `pasteCount`/`pasteBlocked` cao → nên xem lại bài.

> Để xem `final.code` dạng trang web, copy giá trị vào file `.html` rồi mở bằng trình duyệt.

## Deploy GitHub Pages
Tạo repo → upload toàn bộ project → Settings → Pages → Deploy from branch → main / root.

## Bảo mật
- Rules: học sinh **chỉ ghi** được (create/update) đúng đường dẫn `lessons/*/students/*` với dữ liệu hợp lệ; **chỉ email giáo viên** mới đọc/xóa được.
- Hạn chế còn lại: không có đăng nhập, nên người biết tên + lớp của bạn khác có thể nộp đè. Chỉ chia sẻ link cho lớp học.
- Preview bài học sinh dùng `<iframe sandbox>`, loại `<script>`.

## Ghi chú
- Chưa điền `firebase-config.js`: web vẫn học được, bài lưu trên máy, bước gửi báo "chưa gửi được".
- `apps-script/` là bản backend Google Apps Script cũ, không còn dùng (có thể xóa).
