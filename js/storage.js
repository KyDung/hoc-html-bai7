/* ==========================================================
 * storage.js – Tiện ích chung (Util) + lưu/khôi phục dữ liệu (Store)
 * Toàn bộ dữ liệu nằm trong localStorage của trình duyệt.
 * ========================================================== */

/** Các hàm tiện ích nhỏ dùng ở nhiều file. */
const Util = {
  /** Escape HTML để chèn text an toàn vào innerHTML. */
  esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  },
  /** "Nguyễn Văn An" -> "Nguyen Van An" */
  removeDiacritics(s) {
    return String(s)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  },
  nowISO() {
    return new Date().toISOString();
  },
  debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  },
  formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN");
  },
};

const Store = {
  // Gắn id bài học vào khóa để nhiều bài học cùng domain GitHub Pages không đè dữ liệu nhau.
  PREFIX: `html-learning-${LESSON.id}::`,
  STATE_KEY: `html-learning-${LESSON.id}::state`,

  /** localStorage có thể bị chặn (chế độ riêng tư) -> luôn bọc try/catch. */
  safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  },
  safeRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* bỏ qua */ }
  },

  /** State mặc định của một phiên làm bài. */
  defaultState() {
    return {
      student: null,          // { name, className, studentId }
      learning: {},           // { activityId: record }
      practice: {},           // { activityId: record }
      finalProject: {},       // { studentCode, attempts, submittedAt, typingStats, requirements }
      currentStage: "info",
      part1SubmittedAt: null, // thời điểm nộp phần 1 (Hình thành kiến thức + Luyện tập)
      startedAt: null,
      finalSubmittedAt: null,
    };
  },

  loadState() {
    const raw = this.safeGet(this.STATE_KEY);
    if (!raw) return this.defaultState();
    try {
      return Object.assign(this.defaultState(), JSON.parse(raw));
    } catch (e) {
      return this.defaultState();
    }
  },

  saveState(state) {
    this.safeSet(this.STATE_KEY, JSON.stringify(state));
  },

  /** Khóa autosave của từng editor: html-learning-{studentId}-{activityId} */
  draftKey(studentId, activityId) {
    return `${this.PREFIX}${studentId}-${activityId}`;
  },

  loadDraft(studentId, activityId) {
    const raw = this.safeGet(this.draftKey(studentId, activityId));
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  saveDraft(studentId, activityId, data) {
    this.safeSet(this.draftKey(studentId, activityId), JSON.stringify(data));
  },

  removeDraft(studentId, activityId) {
    this.safeRemove(this.draftKey(studentId, activityId));
  },

  /** Xóa toàn bộ dữ liệu của ứng dụng (khi đổi người làm bài). */
  clearAll() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.PREFIX)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* bỏ qua */ }
  },
};
