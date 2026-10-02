# HƯỚNG DẪN CHO AI (Claude / Codex): tạo web bài học tương tác mới từ project mẫu này

> Người dùng sẽ ném file này kèm yêu cầu kiểu: "Tạo bài học mới về <chủ đề>, id `<lesson-id>`".
> Hãy đọc hết file, rồi làm theo **mục 6 (Quy trình)**. Không viết lại kiến trúc; chỉ thay nội dung bài.

## 1. Mục đích & bối cảnh
- Web học tập tương tác môn Tin học THPT (người dùng là giáo viên Việt Nam; giao diện, thông báo viết **tiếng Việt**, xưng "em" với học sinh).
- Mỗi ngày giáo viên dạy 1–2 bài → mỗi bài là **một project/repo GitHub Pages riêng**, nhưng **dùng chung một Firebase project / một Firestore database**; mỗi bài khác nhau ở `LESSON.id` (= khác document).
- Công nghệ: **HTML + CSS + JS thuần (ES6+, script thường)**. KHÔNG React/Vue/npm/build/TypeScript/backend riêng. Chạy bằng Live Server và GitHub Pages, Chrome/Edge.

## 2. Cấu trúc project (mẫu: "Bài 7 – HTML cơ bản")
```
index.html            nạp script theo thứ tự (xem mục 4.1)
css/style.css         giao diện sáng, xanh dương/tím nhẹ, card bo góc, responsive
firestore.rules       rules dán vào Firebase Console (dùng chung mọi bài)
js/
  lesson-config.js    ★ ĐỔI MỖI BÀI: LESSON = { id, title, subtitle }
  firebase-config.js  ★ DÙNG CHUNG: FIREBASE_CONFIG (giữ nguyên giữa các bài)
  storage.js          Util (esc, debounce...) + Store (localStorage, khóa gắn LESSON.id)
  validators.js       ★ ĐỔI MỖI BÀI: validator kiểm tra bằng DOM
  editor.js           Editor (textarea + số dòng + Tab), Preview (iframe sandbox), splitter
  api.js              Api.send() -> Firestore (SDK nạp lười từ CDN gstatic)  – KHÔNG ĐỔI
  teacher.js          trang giáo viên (teacher.html): Google Auth + xem realtime – KHÔNG ĐỔI
  activity.js         mountTask(): editor+preview+KIỂM TRA+feedback+autosave+typing stats – KHÔNG ĐỔI
  learning.js         ★ ĐỔI MỖI BÀI: giai đoạn 1 (activities[] + render)
  practice.js         ★ ĐỔI MỖI BÀI: giai đoạn 2
  final.js            ★ ĐỔI MỖI BÀI: giai đoạn 3 (đề + checklist + nộp)
  app.js              state, route theo hash, khóa/mở khóa, stepper, trang thông tin & hoàn thành
```
File `★` là nơi sửa nội dung bài. File còn lại là hạ tầng, **chỉ sửa khi cần** (và chỉ sửa nhỏ).

## 3. Mô hình sư phạm (giữ nguyên)
3 giai đoạn **tuần tự**, chưa đạt hoạt động trước thì khóa hoạt động sau:
1. **Hình thành kiến thức** – mỗi kiến thức 1 màn hình nhỏ: *Giới thiệu + ví dụ + preview thật → học sinh TỰ GÕ LẠI (có xem mẫu, không tự điền, chặn dán) → KIỂM TRA*. Sai: gợi ý, không lộ đáp án; đúng: báo "Chính xác!" rồi 1 giây sau sang bài kế. KHÔNG làm trắc nghiệm.
2. **Luyện tập** – chỉ có đề, **không code mẫu**, học sinh tự nhớ kiến thức; validator báo cụ thể đạt/chưa đạt từng tiêu chí.
3. **Vận dụng** – 1 bài lớn có đề cấu trúc (không có code mẫu đầy đủ), checklist realtime, nút nộp chỉ bật khi đạt đủ yêu cầu tối thiểu; web **không chấm nội dung cá nhân**.
- Giọng phản hồi hướng dẫn: "Chưa đúng rồi. … Gợi ý: …", không dùng "SAI!".
- Ghi lại quá trình gõ (`typingStats`: keyCount, changeCount, charsTyped, pasteBlocked/pasteCount, firstInputAt, lastInputAt) để giáo viên biết học sinh tự làm.

## 4. Các hợp đồng (contract) giữa module — ĐỪNG PHÁ

### 4.1 Thứ tự nạp script trong index.html
`lesson-config.js → firebase-config.js → storage.js → validators.js → editor.js → api.js → activity.js → learning.js → practice.js → final.js → app.js` (tất cả script thường; không dùng `type="module"`; module khác nhau gọi nhau qua biến toàn cục `const X = ...`).

### 4.2 Validator (validators.js)
Mọi validator trả về `{ passed:boolean, errors:string[], checks:[{ok,label,hint}] }`, kiểm tra bằng **DOMParser/DOM**, không so sánh chuỗi thô (code ngắn/gọn/xuống dòng khác nhau vẫn đúng). Có sẵn helper: `parseHTML, countElements, getTextLength, getTableDimensions, getLines`, và `chk()/result()/closeCheck()` nội bộ. Khi bài học ở lĩnh vực khác HTML (CSS, JS, Scratch, Python...), viết validator phù hợp nhưng **giữ nguyên dạng kết quả trên**.

### 4.3 Định nghĩa hoạt động
```js
// learning.js / practice.js
{ id: "learn-xyz",            // duy nhất, a-z0-9-
  name: "Tên ngắn ở sidebar", title: "Tiêu đề", icon: "🔠",
  lead, explain: [["<thẻ>", "giải thích"]], sample: "code mẫu",   // learning
  task: "<p>đề bài (HTML)</p>",                                   // practice
  validate: (html) => Validators.xxx(html, {...}),
  success: "Câu báo đúng" }
```
- Learning: render intro (xem ví dụ + preview) → type (gõ lại) qua `Activity.mountTask`. Chặn dán (`blockPaste:true`).
- Practice: `showChecks=true` để hiện danh sách tiêu chí.
- Cả hai lưu record: `{activityId, studentCode, attempts, passed, startedAt, completedAt, typingStats}` trong `App.state.learning|practice`.

### 4.4 Final (final.js)
- Đề `TASK_HTML`, checklist = kết quả `validateFinalProject(code)` (mỗi check có `id`), `requirements` = `{id: ok}` được gửi kèm.
- Nút nộp dùng `aria-disabled` (không dùng `disabled`) để bấm khi chưa đạt vẫn hiện "Còn thiếu: …".
- Chống spam: cờ `submitting` + khóa 5 giây sau khi nộp thành công. Thất bại: **không xóa localStorage**, báo "Không thể gửi bài…".
- **Nộp 2 phần riêng**: cuối Luyện tập có nút NỘP PHẦN 1 (`Practice.submitPart1()` → `Api.send({type:'part1', learning, practice})`, lưu `state.part1SubmittedAt`); Vận dụng nộp riêng (`type:'final'`). Nếu chưa nộp phần 1 thì `final.js` nộp bù. Học sinh có thể dừng sau phần 1 và làm tiếp Vận dụng lần sau trên cùng máy (state ở localStorage).

### 4.5 Khóa/mở khóa (app.js)
`App.frontier()` tính giai đoạn hiện tại từ dữ liệu; `canAccess()` + `route()` chặn sửa hash. `verifyState()` chạy lại validator trên code đã lưu khi tải trang (chống sửa localStorage). Nếu đổi số hoạt động/ tên key, cập nhật `Learning.activities`, `Practice.activities` — app.js tự suy ra tiến độ.

### 4.6 localStorage (storage.js)
Khóa: `html-learning-${LESSON.id}::state` (state chung) và `html-learning-${LESSON.id}::{studentId}-{activityId}` (autosave từng editor; `final` cho bài vận dụng). Gắn `LESSON.id` vì các repo GitHub Pages cùng tài khoản **dùng chung origin** `user.github.io` → không gắn id sẽ đè dữ liệu bài khác.

## 5. Firestore dùng chung nhiều bài

### 5.1 Mô hình dữ liệu
```
lessons/{LESSON.id}/students/{lớp_họtên}
```
Ví dụ `lessons/html-bai7/students/10A1_NguyenVanAn`. Một document / học sinh / bài, chứa:
`lessonId, student{name,className}, learning[], practice[], progress{learningCompleted,practiceCompleted,part1Submitted,part1SubmittedAt,finalSubmitted,finalSubmittedAt}, final{code,characters,typingStats,requirements,submittedAt}, updatedAt`.
- Ghi bằng batch `set(..., {merge:true})`: 2 lần nộp (part1/final) cùng vào một document, nộp lại thì ghi đè.
- Bài mới = `LESSON.id` mới = collection con khác → **không cần tạo gì thêm trên Firebase**, document tự sinh khi học sinh nộp.
- Nếu bài mới có **loại dữ liệu khác** (không có learning/practice/final): sửa `Api.send()` để map dữ liệu vào các field; **nhớ cập nhật `hasOnly([...])` trong `firestore.rules`** nếu thêm field mới, rồi Publish lại rules.

### 5.2 Rules (file firestore.rules)
Chỉ cho `create/update` đúng đường dẫn `lessons/{id}/students/{key}` với dữ liệu hợp lệ (id regex `^[a-z0-9-]{1,40}$`, key regex `^[A-Za-z0-9]{1,15}_[A-Za-z0-9]{1,40}$`, `final.code ≤ 100000` ký tự); `get/list/delete = false`. Rules chỉ cần publish **một lần** cho mọi bài. Rules cũng cho **email giáo viên** (hàm `isTeacher()`, đổi email ở đây) đọc/xóa; mỗi lần nộp còn ghi `lessons/{id}` = `{title, updatedAt}` (batch cùng lần ghi học sinh) để trang giáo viên liệt kê các bài. `teacher.html` dùng chung cho mọi bài, không cần sửa. Cài đặt một lần: bật Authentication → Google, thêm domain GitHub Pages vào Authorized domains.

### 5.3 Hiệu năng
SDK Firebase nạp **lười** bằng `import()` từ `www.gstatic.com`, `Api.warmUp()` gọi khi học sinh bắt đầu để lúc nộp không chờ. Có `preconnect` trong `<head>`. Ghi có timeout 20 giây.

### 5.4 Việc chỉ làm lần đầu (nếu người dùng chưa làm)
Tạo Firestore (Production mode, `asia-southeast1`), publish `firestore.rules`, đăng ký Web app, dán `firebaseConfig` vào `js/firebase-config.js`. **Từ bài thứ 2 chỉ copy `firebase-config.js` cũ sang.**

## 6. QUY TRÌNH TẠO BÀI MỚI (cho AI)
Input từ người dùng: chủ đề + kiến thức cần dạy + (tùy) bài luyện tập/vận dụng mong muốn + `lesson-id`.
Nếu thiếu `lesson-id` hoặc nội dung quá mơ hồ: hỏi lại **một lần**, rồi làm.

1. **Copy project mẫu** sang thư mục mới (giữ toàn bộ file). Không tạo kiến trúc mới.
2. **`js/lesson-config.js`**: đặt `id` mới (duy nhất, `a-z0-9-`), `title`, `subtitle`. Giữ nguyên `firebase-config.js` (nếu người dùng đưa config mới thì cập nhật).
3. **`validators.js`**: thêm/sửa validator cho kiến thức mới (theo mục 4.2); validator cho bài luyện tập; `validateFinalProject` trả checklist + `requirements`.
4. **`learning.js`**: viết `activities[]` (mỗi kiến thức một hoạt động: lead nói rõ *"Thẻ/Khái niệm … dùng để …"*, `explain`, `sample`, `validate`, `success`); sửa danh sách "đã học" ở `renderDone`.
5. **`practice.js`**: viết `activities[]` (đề, không có mẫu, validator cụ thể).
6. **`final.js`**: viết `TASK_HTML` (đề chia phần, yêu cầu tối thiểu rõ), nối `validateFinalProject`; đừng đưa code mẫu hoàn chỉnh cho học sinh.
7. **`app.js`**: sửa nhãn trang hoàn thành (danh sách kiến thức, số hoạt động) nếu khác; tiến độ tự tính.
8. **`index.html`/README**: cập nhật tiêu đề, tên bài; README ghi `LESSON.id` của bài.
9. **Kiểm thử** bằng Live Server (xem mục 7). Kiểm tra console không lỗi.
10. Báo người dùng: `LESSON.id`, đường dẫn Firestore dữ liệu sẽ nằm, và việc họ cần làm (đẩy lên GitHub Pages).

## 7. Checklist kiểm thử (làm thật, không chỉ đọc code)
- [ ] Nhập thông tin → vào Hình thành; mở thẳng `#final`/`#practice` khi chưa đủ điều kiện bị đưa về đúng giai đoạn.
- [ ] Mỗi bài learning: gõ sai → có gợi ý không lộ đáp án; gõ đúng (cả bản viết liền không xuống dòng) → "Chính xác!" → sang bài sau, **preview của code mẫu hiển thị ở mọi bài**.
- [ ] Dán code vào editor learning/practice bị chặn; code mẫu không copy được.
- [ ] Practice: thông báo cụ thể từng tiêu chí; Final: checklist đổi realtime, nộp thiếu → liệt kê phần thiếu, đủ → nộp được.
- [ ] F5 giữa chừng: bài còn nguyên, không mở khóa sai.
- [ ] Nút NỘP PHẦN 1: lỗi mạng → báo lỗi, bấm lại được; thành công → hiện lời nhắn và nút sang Vận dụng. Trang `teacher.html` hiện đúng dữ liệu.
- [ ] Console không lỗi đỏ; làm thử với `firebase-config.js` chưa điền: học vẫn chạy, báo "chưa gửi được", không mất dữ liệu.
- [ ] Sau khi điền config thật: nộp thử → thấy document ở `lessons/<id>/students/<lớp_tên>`.

## 8. Quy ước & lưu ý
- Comment ngắn bằng tiếng Việt ở chỗ quan trọng; tên biến tiếng Anh; ES6+; không thêm thư viện.
- Preview học sinh LUÔN trong `<iframe sandbox="">` + loại `<script>`; không `innerHTML` code học sinh vào trang chính; escape bằng `Util.esc`.
- Không nhúng API key bí mật; `firebaseConfig` công khai là bình thường, bảo vệ bằng rules.
- Không dùng AI sinh code hộ học sinh trong web.
- Với bài **không phải HTML** (ví dụ Python/Scratch/Excel): giữ khung 3 giai đoạn + state + Firestore; thay `Preview`/`Editor` và validator cho phù hợp, vẫn trả kết quả theo hợp đồng 4.2.
- Không mở quyền đọc công khai Firestore; chỉ `isTeacher()` được đọc. Preview bài học sinh ở trang giáo viên luôn dùng `<iframe sandbox="">`, tuyệt đối không mở code học sinh bằng blob URL/trang chạy script trên origin của web.
