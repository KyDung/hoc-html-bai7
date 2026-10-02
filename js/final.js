/* ==========================================================
 * final.js – Giai đoạn 3: VẬN DỤNG – "Gửi tôi của 10 năm sau"
 * Web chỉ kiểm tra yêu cầu kỹ thuật tối thiểu, không tự chấm nội dung.
 * ========================================================== */
const Final = (() => {
  const DRAFT_ID = "final";
  const COOLDOWN_SECONDS = 5;
  let submitting = false;

  const TASK_HTML = `
    <h3>NHIỆM VỤ</h3>
    <p>Hãy xây dựng một trang web có chủ đề: <strong>“Gửi tôi của 10 năm sau”</strong>.
    Trang web là một bức thư nhỏ gửi tới chính bản thân em trong tương lai. Bài làm phải có đầy đủ những nội dung sau.</p>

    <h4>PHẦN 1 – TIÊU ĐỀ TRANG</h4>
    <p>Dùng thẻ <code>&lt;h1&gt;</code> tạo tiêu đề: <code>Gửi tôi của 10 năm sau</code></p>

    <h4>PHẦN 2 – ĐÔI LỜI NHẮN GỬI</h4>
    <p>Tạo tiêu đề <code>Đôi lời nhắn gửi tới bản thân</code>, sau đó dùng <code>&lt;p&gt;</code> viết một đoạn văn gửi tới bản thân trong tương lai.</p>
    <ul><li>ít nhất 1 <code>&lt;h2&gt;</code>, ít nhất 1 <code>&lt;p&gt;</code>;</li>
    <li>đoạn văn tối thiểu 50 ký tự;</li><li>dùng ít nhất 2 thẻ <code>&lt;br&gt;</code> để xuống dòng.</li></ul>
    <p class="muted">Nội dung do em tự viết.</p>

    <h4>PHẦN 3 – SỞ THÍCH HIỆN TẠI</h4>
    <p>Tạo tiêu đề <code>Sở thích của mình hiện tại</code>, rồi dùng danh sách không có thứ tự <code>&lt;ul&gt;</code>
    với ít nhất 4 thẻ <code>&lt;li&gt;</code>, mỗi thẻ ghi một sở thích (em tự chọn nội dung).</p>

    <h4>PHẦN 4 – NHỮNG VIỆC MUỐN LÀM</h4>
    <p>Tạo tiêu đề <code>Danh sách những việc muốn làm trong 10 năm tới</code>, rồi dùng danh sách có thứ tự
    <code>&lt;ol&gt;</code> với ít nhất 4 thẻ <code>&lt;li&gt;</code>, mỗi mục là một việc em mong muốn làm trong 10 năm tới.</p>

    <h4>PHẦN 5 – BẢNG MỤC TIÊU 10 NĂM</h4>
    <p>Tạo tiêu đề <code>Mục tiêu của tôi trong 10 năm tới</code>, sau đó tạo bảng có ít nhất 3 cột:
    <code>Mốc thời gian</code>, <code>Mục tiêu</code>, <code>Điều tôi cần làm</code>.</p>
    <ul><li>1 hàng tiêu đề dùng <code>&lt;th&gt;</code> (tối thiểu 3 thẻ <code>&lt;th&gt;</code>);</li>
    <li>ít nhất 3 hàng dữ liệu dùng <code>&lt;td&gt;</code> (tối thiểu 9 thẻ <code>&lt;td&gt;</code>);</li>
    <li>mốc thời gian gợi ý: 1 - 3 năm tới, 4 - 6 năm tới, 7 - 10 năm tới (em có thể đổi nội dung).</li></ul>`;

  function render(root) {
    const sid = App.state.student.studentId;
    const draft = Store.loadDraft(sid, DRAFT_ID) || {};
    const fp = App.state.finalProject;

    root.innerHTML = `
      <div class="card"><div class="badge">Vận dụng</div>
        <h2>🚀 GỬI TÔI CỦA 10 NĂM SAU</h2>
        <details class="task-details" open><summary>Xem / ẩn đề bài</summary><div class="task-text">${TASK_HTML}</div></details>
      </div>
      <div class="card final-card">
        <div class="split final-split">
          <div class="pane ed-host"></div>
          <div class="split-handle" title="Kéo để đổi kích thước"></div>
          <div class="pane pv-host"></div>
        </div>
        <div class="task-actions"><button type="button" class="btn btn-ghost btn-reset">↺ Làm lại từ đầu</button>
          <span class="muted saved-note">Bài được tự động lưu trên máy.</span></div>
      </div>
      <div class="card">
        <h3>YÊU CẦU BÀI LÀM</h3>
        <ul class="checklist"></ul>
        <div class="submit-row">
          <button type="button" class="btn btn-primary btn-submit is-disabled" aria-disabled="true">NỘP BÀI VẬN DỤNG</button>
          <span class="muted submit-count"></span>
        </div>
        <div class="fb-host" aria-live="polite"></div>
      </div>`;

    const checklistEl = root.querySelector(".checklist");
    const fbHost = root.querySelector(".fb-host");
    const submitBtn = root.querySelector(".btn-submit");
    const countEl = root.querySelector(".submit-count");
    let lastResult = null;
    let cooling = false;

    const pv = Preview.create(root.querySelector(".pv-host"), { fullscreen: true });

    /** Cập nhật checklist realtime. */
    function refreshChecklist(code) {
      lastResult = Validators.validateFinalProject(code);
      checklistEl.innerHTML = lastResult.checks.map((c) =>
        `<li class="${c.ok ? "ok" : ""}"><span class="tick">${c.ok ? "✓" : "○"}</span> ${Util.esc(c.label)}</li>`).join("");
      const okCount = lastResult.checks.filter((c) => c.ok).length;
      countEl.textContent = `Đã đạt ${okCount} / ${lastResult.checks.length} yêu cầu`;
      // Nút nộp chỉ bật khi đạt đủ (và không đang gửi / đang chờ 5 giây).
      setEnabled(lastResult.passed && !submitting && !cooling);
    }
    /** Dùng aria-disabled (thay vì disabled) để vẫn bắt được cú bấm và báo phần còn thiếu. */
    function setEnabled(on) {
      submitBtn.classList.toggle("is-disabled", !on);
      submitBtn.setAttribute("aria-disabled", String(!on));
    }
    const refreshDebounced = Util.debounce((c) => { pv.update(c); refreshChecklist(c); }, 150);

    const editor = Editor.create(root.querySelector(".ed-host"), {
      value: draft.code != null ? draft.code : fp.studentCode || "",
      stats: draft.stats,
      placeholder: "Gõ trang HTML của em vào đây…",
      blockPaste: false,   // bài dài, cho phép dán nhưng vẫn ghi số lần dán
      autoClose: false,
      onChange(code, stats) {
        Store.saveDraft(sid, DRAFT_ID, { code, stats });
        refreshDebounced(code);
      },
    });
    pv.update(editor.getValue());
    refreshChecklist(editor.getValue());
    Editor.splitter(root.querySelector(".final-split"), root.querySelector(".split-handle"));

    root.querySelector(".btn-reset").addEventListener("click", () => {
      if (!confirm("Xóa toàn bộ code vận dụng và làm lại từ đầu?")) return;
      editor.setValue("");
      editor.resetStats();
      Store.removeDraft(sid, DRAFT_ID);
      pv.update("");
      refreshChecklist("");
      fbHost.innerHTML = "";
    });

    submitBtn.addEventListener("click", () => submit());

    function showMissing() {
      const miss = lastResult.errors.map((e) => `<li>${Util.esc(e)}</li>`).join("");
      fbHost.innerHTML = `<div class="fb fb-warn"><div class="fb-title">Bài của em chưa hoàn thành.</div>
        <p class="fb-sub">Còn thiếu:</p><ul>${miss}</ul></div>`;
    }

    async function submit() {
      if (submitting || cooling) return;
      const code = editor.getValue();
      const res = Validators.validateFinalProject(code);
      if (!res.passed) { lastResult = res; showMissing(); return; }

      submitting = true;
      setEnabled(false);
      fbHost.innerHTML = '<div class="fb fb-info"><div class="loader"></div> Đang gửi bài...</div>';

      const stats = editor.getStats();
      const typingStats = {
        keyCount: stats.keyCount, changeCount: stats.changeCount, charsTyped: stats.charsTyped,
        pasteCount: stats.pasteCount, firstInputAt: stats.firstInputAt, lastInputAt: stats.lastInputAt,
      };
      const submittedAt = Util.nowISO();
      try {
        // Gửi lại phần Hình thành kiến thức / Luyện tập nếu trước đó chưa gửi được.
        // Nếu chưa nộp phần 1 thì nộp bù (lỗi ở đây không chặn việc nộp bài vận dụng).
        if (!App.state.part1SubmittedAt) { try { await Practice.submitPart1(); } catch (e) { console.warn(e.message); } }
        await Api.send({
          type: "final",
          student: Api.studentPayload(App.state.student),
          submittedAt,
          code,                                   // gửi nguyên văn, không chỉnh sửa
          typingStats,
          requirements: res.requirements,
          characters: code.length,
        });
        const first = !App.state.finalSubmittedAt;
        App.state.finalProject = {
          studentCode: code, attempts: (fp.attempts || 0) + 1, submittedAt, typingStats, requirements: res.requirements,
        };
        App.state.finalSubmittedAt = App.state.finalSubmittedAt || submittedAt;
        App.save();
        const s = App.state.student;
        fbHost.innerHTML = `<div class="fb fb-ok"><div class="fb-title">🎉 NỘP BÀI THÀNH CÔNG</div>
          <p>Họ tên: <strong>${Util.esc(s.name)}</strong><br>Lớp: <strong>${Util.esc(s.className)}</strong></p>
          <p>Bài làm của em đã được lưu.</p>
          <button type="button" class="btn btn-primary go-complete">XEM TRANG HOÀN THÀNH ➜</button></div>`;
        fbHost.querySelector(".go-complete").addEventListener("click", () => App.go("complete"));
        if (first) App.refresh();
        startCooldown();
      } catch (err) {
        console.warn("Nộp bài thất bại:", err.message);
        fbHost.innerHTML = `<div class="fb fb-warn"><div class="fb-title">Không thể gửi bài.</div>
          <p>Bài của em vẫn được lưu trên máy.<br>Hãy kiểm tra kết nối Internet và thử lại.</p>
          <p class="muted">Chi tiết: ${Util.esc(err.message)}</p></div>`;
      } finally {
        submitting = false;
        setEnabled(lastResult.passed && !cooling);
      }
    }

    /** Khóa nút nộp 5 giây sau khi gửi thành công để tránh bấm liên tục. */
    function startCooldown() {
      cooling = true;
      let left = COOLDOWN_SECONDS;
      setEnabled(false);
      const tick = () => {
        if (!submitBtn.isConnected) { cooling = false; return; }
        if (left <= 0) {
          cooling = false;
          submitBtn.textContent = "NỘP LẠI BÀI VẬN DỤNG";
          setEnabled(lastResult.passed);
          return;
        }
        submitBtn.textContent = `Đã nộp (chờ ${left}s)`;
        left--;
        setTimeout(tick, 1000);
      };
      tick();
    }
  }

  return { render };
})();
