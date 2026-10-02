/* ==========================================================
 * app.js – State trung tâm, điều hướng (hash), khóa/mở khóa, thanh tiến trình
 * ========================================================== */
const App = {
  state: null,
  STAGES: ["info", "learning", "practice", "final", "complete"],
  STAGE_LABELS: { info: "Thông tin", learning: "Hình thành kiến thức", practice: "Luyện tập", final: "Vận dụng", complete: "Hoàn thành" },

  init() {
    document.title = LESSON.title;
    document.getElementById("brand-sub").textContent = LESSON.subtitle;
    this.state = Store.loadState();
    this.verifyState();
    window.addEventListener("hashchange", () => this.route());
    if (this.state.student) Api.warmUp();
    document.getElementById("btn-reset-student").addEventListener("click", () => this.resetStudent());
    this.route();
  },

  save() {
    Store.saveState(this.state);
    this.renderHeader();
  },

  /** Chống sửa localStorage: kiểm tra lại code đã lưu của các bài đánh dấu "đạt". */
  verifyState() {
    const check = (records, list) => list.forEach((def) => {
      const r = records[def.id];
      if (r && r.passed) {
        let ok = false;
        try { ok = def.validate(r.studentCode || "").passed; } catch (e) { ok = false; }
        if (!ok) r.passed = false;
      }
    });
    check(this.state.learning, Learning.activities);
    check(this.state.practice, Practice.activities);
    if (this.state.finalSubmittedAt) {
      const code = (this.state.finalProject && this.state.finalProject.studentCode) || "";
      if (!Validators.validateFinalProject(code).passed) this.state.finalSubmittedAt = null;
    }
    Store.saveState(this.state);
  },

  /* ---------- Quy tắc mở khóa (tính từ dữ liệu, không dựa vào việc ẩn nút) ---------- */
  frontier() {
    if (!this.state.student) return "info";
    if (!Learning.isDone()) return "learning";
    if (!Practice.isDone()) return "practice";
    if (!this.state.finalSubmittedAt) return "final";
    return "complete";
  },

  canAccess(stage) {
    const f = this.STAGES.indexOf(this.frontier());
    const i = this.STAGES.indexOf(stage);
    if (stage === "info") return !this.state.student;
    return i <= f;
  },

  go(stage) {
    if (location.hash === "#" + stage) this.route();
    else location.hash = "#" + stage;
  },

  /** Đọc hash, chặn truy cập trái phép, vẽ màn hình tương ứng. */
  route() {
    let stage = location.hash.replace("#", "");
    if (!this.STAGES.includes(stage) || !this.canAccess(stage)) {
      stage = this.frontier();
      history.replaceState(null, "", "#" + stage);
    }
    this.state.currentStage = stage;
    Store.saveState(this.state);
    const main = document.getElementById("main");
    main.innerHTML = "";
    window.scrollTo(0, 0);
    ({
      info: () => this.renderInfo(main),
      learning: () => Learning.render(main),
      practice: () => Practice.render(main),
      final: () => Final.render(main),
      complete: () => this.renderComplete(main),
    })[stage]();
    this.renderHeader();
  },

  /** Cập nhật header (tiến độ) mà không vẽ lại màn hình hiện tại. */
  refresh() { this.renderHeader(); },

  /* ---------- Thanh tiến trình ---------- */
  progressPercent() {
    const total = Learning.activities.length + Practice.activities.length + 1;
    const done = Learning.passedCount() + Practice.passedCount() + (this.state.finalSubmittedAt ? 1 : 0);
    return Math.round((done / total) * 100);
  },

  renderHeader() {
    const f = this.STAGES.indexOf(this.frontier());
    const cur = this.state.currentStage;
    const sub = {
      learning: `${Learning.passedCount()}/${Learning.activities.length}`,
      practice: `${Practice.passedCount()}/${Practice.activities.length}`,
    };
    document.getElementById("stepper").innerHTML = this.STAGES.map((s, i) => {
      const done = i < f || (s === "complete" && f === i);
      const locked = i > f;
      const icon = done ? "✓" : locked ? "🔒" : i + 1;
      const cls = ["step", done ? "done" : "", locked ? "locked" : "", cur === s ? "current" : ""].join(" ");
      const label = Util.esc(this.STAGE_LABELS[s]) + (sub[s] && !locked ? ` <small>${sub[s]}</small>` : "");
      const inner = `<span class="step-dot">${icon}</span><span class="step-label">${label}</span>`;
      const clickable = !locked && s !== "info" && !(s === "complete" && f < 4);
      return clickable ? `<a class="${cls}" href="#${s}">${inner}</a>` : `<span class="${cls}">${inner}</span>`;
    }).join("");

    const pct = this.progressPercent();
    document.getElementById("progress-text").textContent = `Tiến độ bài học: ${pct}%`;
    document.getElementById("progress-fill").style.width = pct + "%";
    document.getElementById("progress-bar").setAttribute("aria-valuenow", pct);

    const s = this.state.student;
    const who = document.getElementById("who");
    who.textContent = s ? `👤 ${s.name} · ${s.className}` : "";
    document.getElementById("btn-reset-student").hidden = !s;
  },

  /* ---------- Thông tin học sinh ---------- */
  renderInfo(main) {
    main.innerHTML = `
      <div class="card narrow">
        <div class="badge">Bắt đầu</div>
        <h2>👋 Chào mừng em đến với bài học HTML</h2>
        <p>Bài học gồm 3 giai đoạn: <strong>Hình thành kiến thức → Luyện tập → Vận dụng</strong>.
        Em cần hoàn thành lần lượt từng hoạt động. Hãy nhập thông tin để bắt đầu.</p>
        <form id="info-form" novalidate>
          <label for="f-name">Họ và tên</label>
          <input id="f-name" type="text" placeholder="Ví dụ: Nguyễn Văn An" maxlength="60" autocomplete="off">
          <label for="f-class">Lớp</label>
          <input id="f-class" type="text" placeholder="Ví dụ: 10A1" maxlength="15" autocomplete="off">
          <p class="form-error" id="info-error" role="alert"></p>
          <button type="submit" class="btn btn-primary">BẮT ĐẦU HỌC ➜</button>
        </form>
      </div>`;
    document.getElementById("info-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("f-name").value.replace(/\s+/g, " ").trim();
      const className = document.getElementById("f-class").value.replace(/\s+/g, "").trim().toUpperCase();
      const err = document.getElementById("info-error");
      if (name.length < 2) { err.textContent = "Em hãy nhập đầy đủ họ và tên."; return; }
      if (!className) { err.textContent = "Em hãy nhập lớp của mình."; return; }
      const safeName = Util.removeDiacritics(name).replace(/[^A-Za-z0-9]/g, "");
      if (!safeName) { err.textContent = "Họ tên cần có chữ cái."; return; }
      Store.clearAll();   // bắt đầu phiên mới, tránh lẫn dữ liệu cũ
      this.state = Store.defaultState();
      this.state.student = { name, className, studentId: `${className}_${safeName}_${Date.now()}` };
      this.state.startedAt = Util.nowISO();
      Store.saveState(this.state);
      Api.warmUp();   // nạp sẵn Firebase để lúc gửi bài không phải chờ
      this.go("learning");
    });
  },

  resetStudent() {
    if (!confirm("Đổi người làm bài? Toàn bộ bài đang lưu trên máy sẽ bị xóa.")) return;
    Store.clearAll();
    this.state = Store.defaultState();
    history.replaceState(null, "", "#info");
    this.route();
  },

  /* ---------- Trang hoàn thành ---------- */
  renderComplete(main) {
    const s = this.state.student;
    const doneCount = Learning.passedCount() + Practice.passedCount() + 1;
    const total = Learning.activities.length + Practice.activities.length + 1;
    const items = ["Tiêu đề", "Đoạn văn", "Xuống dòng", "Danh sách không thứ tự", "Danh sách có thứ tự", "Bảng HTML"];
    main.innerHTML = `
      <div class="card center narrow">
        <div class="big-emoji">🎉</div>
        <h2>HOÀN THÀNH BÀI HỌC</h2>
        <p>Bạn đã sử dụng được:</p>
        <ul class="tick-list">${items.map((t) => `<li>✓ ${t}</li>`).join("")}</ul>
        <p><strong>Bạn vừa hoàn thành trang web đầu tiên của mình.</strong></p>
        <dl class="summary">
          <dt>Họ và tên</dt><dd>${Util.esc(s.name)}</dd>
          <dt>Lớp</dt><dd>${Util.esc(s.className)}</dd>
          <dt>Thời gian hoàn thành</dt><dd>${Util.esc(Util.formatDateTime(this.state.finalSubmittedAt))}</dd>
          <dt>Số hoạt động đã hoàn thành</dt><dd>${doneCount} / ${total}</dd>
        </dl>
        <a class="btn btn-ghost" href="#final">Xem lại bài vận dụng</a>
      </div>`;
  },
};

/**
 * Chặn sao chép code mẫu (học sinh phải tự gõ): chặn chuột phải, bắt đầu chọn,
 * kéo thả và Ctrl+C khi vùng chọn có chứa đoạn code mẫu (kể cả khi bấm Ctrl+A).
 */
(function blockSampleCopy() {
  const inSample = (t) => t && t.closest && t.closest(".code-sample");
  ["contextmenu", "selectstart", "dragstart"].forEach((ev) =>
    document.addEventListener(ev, (e) => { if (inSample(e.target.nodeType === 1 ? e.target : e.target.parentElement)) e.preventDefault(); }));
  ["copy", "cut"].forEach((ev) =>
    document.addEventListener(ev, (e) => {
      const sel = window.getSelection();
      const hit = Array.from(document.querySelectorAll(".code-sample")).some((el) => sel && sel.containsNode(el, true));
      if (hit) e.preventDefault();
    }));
})();

document.addEventListener("DOMContentLoaded", () => App.init());
