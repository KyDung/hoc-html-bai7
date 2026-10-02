/* ==========================================================
 * api.js – Lưu bài của học sinh vào Firebase Firestore
 *
 * Cấu trúc dữ liệu (dùng chung 1 database cho mọi bài học):
 *   lessons/{LESSON.id}/students/{lớp_họtên}      <- 1 document / học sinh / bài học
 *     student, lessonId, learning[], practice[], progress{}, final{}, updatedAt
 *   lessons/{LESSON.id}                            <- tên bài (để trang giáo viên liệt kê)
 *
 * Firebase SDK được nạp từ CDN theo kiểu "lười" (chỉ khi cần gửi) nên không làm chậm lúc mở trang.
 * ========================================================== */
const Api = {
  FIREBASE_VERSION: "10.14.1",
  TIMEOUT_MS: 20000,
  _sdk: null,

  isConfigured() {
    return !!FIREBASE_CONFIG.projectId && !/^DIEN_/.test(FIREBASE_CONFIG.projectId) && !/^DIEN_/.test(FIREBASE_CONFIG.apiKey);
  },

  /** Nạp SDK + khởi tạo Firestore (chỉ làm một lần). */
  _load() {
    if (!this._sdk) {
      const base = `https://www.gstatic.com/firebasejs/${this.FIREBASE_VERSION}/`;
      this._sdk = Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js")])
        .then(([appMod, fs]) => {
          const app = appMod.initializeApp(FIREBASE_CONFIG);
          return { fs, db: fs.getFirestore(app) };
        })
        .catch((e) => { this._sdk = null; throw e; });
    }
    return this._sdk;
  },

  /** Gọi sớm (khi học sinh bắt đầu học) để lúc nộp bài không phải chờ tải SDK. */
  warmUp() {
    if (this.isConfigured()) this._load().catch(() => {});
  },

  /** Rút gọn thông tin học sinh gửi đi. */
  studentPayload(student) {
    return { name: student.name, className: student.className, studentId: student.studentId };
  },

  /** Khóa document: 10A1_NguyenVanAn -> nộp lại sẽ ghi đè đúng document này. */
  studentKey(student) {
    const slug = (s, n) => (Util.removeDiacritics(s).replace(/[^A-Za-z0-9]/g, "") || "unknown").slice(0, n);
    return `${slug(student.className, 15)}_${slug(student.name, 40)}`;
  },

  /**
   * Gửi payload:
   *   { type: "part1", student, submittedAt, learning[], practice[] }   – nộp phần 1
   *   { type: "final", student, submittedAt, code, typingStats, requirements, characters } – nộp vận dụng
   * Dùng setDoc(..., {merge:true}) nên hai phần ghi vào cùng một document mà không đè nhau.
   * Đồng thời ghi lessons/{id} (tên bài) để trang giáo viên liệt kê được các bài học.
   */
  async send(payload) {
    if (!this.isConfigured()) throw new Error("Chưa điền cấu hình Firebase trong js/firebase-config.js.");
    if (!["part1", "final"].includes(payload.type)) throw new Error("Loại bài nộp không hợp lệ.");

    const { fs, db } = await this._load();
    const lessonRef = fs.doc(db, "lessons", LESSON.id);
    const studentRef = fs.doc(db, "lessons", LESSON.id, "students", this.studentKey(payload.student));
    const data = {
      lessonId: LESSON.id,
      student: { name: payload.student.name, className: payload.student.className },
      updatedAt: fs.serverTimestamp(),
    };

    if (payload.type === "final") {
      data.final = {
        code: payload.code,                 // nguyên văn, không chỉnh sửa
        characters: payload.characters,
        typingStats: payload.typingStats || {},
        requirements: payload.requirements || {},
        submittedAt: payload.submittedAt,
      };
      data.progress = { finalSubmitted: true, finalSubmittedAt: payload.submittedAt };
    } else {
      const learning = payload.learning || [];
      const practice = payload.practice || [];
      data.learning = learning;
      data.practice = practice;
      data.progress = {
        learningCompleted: learning.length > 0 && learning.every((a) => a.passed),
        practiceCompleted: practice.length > 0 && practice.every((a) => a.passed),
        part1Submitted: true,
        part1SubmittedAt: payload.submittedAt,
      };
    }

    // Ghi 2 document trong 1 batch (nguyên tử). Offline thì Firestore treo -> timeout báo lỗi.
    const batch = fs.writeBatch(db);
    batch.set(lessonRef, { title: LESSON.title, updatedAt: fs.serverTimestamp() }, { merge: true });
    batch.set(studentRef, data, { merge: true });
    await Promise.race([
      batch.commit(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("Quá thời gian chờ, hãy kiểm tra Internet.")), this.TIMEOUT_MS)),
    ]);
    return { ok: true };
  },
};
