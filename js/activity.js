/* ==========================================================
 * activity.js – Một "bài gõ code" dùng chung cho Hình thành kiến thức & Luyện tập:
 * editor + preview + nút KIỂM TRA + feedback + autosave + ghi thống kê gõ.
 * ========================================================== */
const Activity = (() => {
  /** Tạo bản ghi rỗng cho một hoạt động. */
  function newRecord(id) {
    return { activityId: id, studentCode: "", attempts: 0, passed: false, startedAt: null, completedAt: null, typingStats: {} };
  }

  function summarizeStats(s) {
    return {
      keyCount: s.keyCount, changeCount: s.changeCount, charsTyped: s.charsTyped,
      pasteBlocked: s.pasteBlocked, firstInputAt: s.firstInputAt, lastInputAt: s.lastInputAt,
    };
  }

  /** Dựng HTML phản hồi mang tính hướng dẫn (không hiện đáp án). */
  function feedbackHTML(res, def) {
    if (res.passed) {
      return `<div class="fb fb-ok"><div class="fb-title">🎉 Chính xác!</div><p>${Util.esc(def.success)}</p></div>`;
    }
    const hints = res.errors.map((e) => `<li>${Util.esc(e)}</li>`).join("");
    let checks = "";
    if (def.showChecks) {
      checks = '<ul class="check-list">' + res.checks.map((c) =>
        `<li class="${c.ok ? "ok" : "no"}">${c.ok ? "✓" : "✗"} ${Util.esc(c.label)}</li>`).join("") + "</ul>";
    }
    return `<div class="fb fb-warn"><div class="fb-title">Chưa đúng rồi.</div>
      ${checks}<p class="fb-sub">Gợi ý:</p><ul>${hints}</ul></div>`;
  }

  /**
   * Gắn một bài gõ code vào host.
   * opts: { records, def, onPassed(), blockPaste, autoClose }
   *  def: { id, validate(html) -> result, success, showChecks, placeholder }
   */
  function mountTask(host, opts) {
    const { records, def } = opts;
    const sid = App.state.student.studentId;
    const rec = records[def.id] || (records[def.id] = newRecord(def.id));
    const draft = Store.loadDraft(sid, def.id) || {};

    host.innerHTML = `
      <div class="split">
        <div class="pane ed-host"></div>
        <div class="split-handle" title="Kéo để đổi kích thước"></div>
        <div class="pane pv-host"></div>
      </div>
      <div class="task-actions">
        <button type="button" class="btn btn-primary btn-check">KIỂM TRA</button>
        <span class="muted attempts"></span>
      </div>
      <div class="fb-host" aria-live="polite"></div>`;

    const fbHost = host.querySelector(".fb-host");
    const checkBtn = host.querySelector(".btn-check");
    const attemptsEl = host.querySelector(".attempts");
    const showAttempts = () => { attemptsEl.textContent = rec.attempts ? `Đã kiểm tra: ${rec.attempts} lần` : ""; };
    showAttempts();

    const pv = Preview.create(host.querySelector(".pv-host"), { fullscreen: true });
    const updatePreview = Util.debounce((code) => pv.update(code), 120);

    const editor = Editor.create(host.querySelector(".ed-host"), {
      value: draft.code != null ? draft.code : rec.studentCode,
      stats: draft.stats,
      placeholder: def.placeholder || "Gõ code HTML của em vào đây…",
      blockPaste: opts.blockPaste !== false,
      autoClose: !!opts.autoClose,
      onBlockedPaste() {
        fbHost.innerHTML = '<div class="fb fb-info"><div class="fb-title">Hãy tự gõ nhé!</div><p>Phần này cần em tự tay gõ code, không dán từ nơi khác.</p></div>';
      },
      onChange(code, stats) {
        Store.saveDraft(sid, def.id, { code, stats });   // autosave
        if (!rec.startedAt && stats.firstInputAt) { rec.startedAt = stats.firstInputAt; App.save(); }
        updatePreview(code);
      },
    });
    pv.update(editor.getValue());
    Editor.splitter(host.querySelector(".split"), host.querySelector(".split-handle"));

    checkBtn.addEventListener("click", () => {
      const code = editor.getValue();
      if (!code.trim()) {
        fbHost.innerHTML = '<div class="fb fb-warn"><div class="fb-title">Em chưa gõ gì cả.</div><p>Hãy gõ code vào khung bên trái rồi bấm KIỂM TRA.</p></div>';
        return;
      }
      rec.attempts++;
      const res = def.validate(code);
      rec.studentCode = code;
      rec.typingStats = summarizeStats(editor.getStats());
      rec.lastCheckedAt = Util.nowISO();
      if (res.passed && !rec.passed) { rec.passed = true; rec.completedAt = Util.nowISO(); }
      if (!rec.startedAt) rec.startedAt = rec.typingStats.firstInputAt || rec.lastCheckedAt;
      App.save();
      showAttempts();
      fbHost.innerHTML = feedbackHTML(res, def);
      if (res.passed) {
        checkBtn.disabled = true;
        setTimeout(() => { if (host.isConnected) opts.onPassed(); }, 1000);
      }
    });

    return { editor };
  }

  return { mountTask, newRecord, feedbackHTML };
})();
