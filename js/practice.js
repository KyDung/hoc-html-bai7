/* ==========================================================
 * practice.js – Giai đoạn 2: LUYỆN TẬP
 * Chỉ có đề bài (không có code mẫu). Học sinh tự nhớ thẻ HTML.
 * ========================================================== */
const Practice = (() => {
  const V = Validators;

  const activities = [
    {
      id: "practice-heading", name: "Heading", title: "Bài 1 – Heading",
      task: `<p>Hãy tạo:</p>
        <p><strong>Tiêu đề chính:</strong><br><code>NGÔI NHÀ TRONG MƠ CỦA TÔI</code></p>
        <p><strong>Tiêu đề cấp 2:</strong><br><code>Những điều tôi mong muốn</code></p>`,
      validate: V.validatePracticeHeading,
      success: "Em đã tạo đúng tiêu đề chính và tiêu đề cấp 2.",
    },
    {
      id: "practice-paragraph", name: "Paragraph và br", title: "Bài 2 – Paragraph và br",
      task: `<p>Hãy viết một đoạn giới thiệu ngắn về bản thân.</p>
        <p>Đoạn văn phải:</p>
        <ul><li>được đặt trong thẻ <code>&lt;p&gt;</code>;</li><li>có ít nhất 3 dòng;</li><li>sử dụng ít nhất 2 thẻ <code>&lt;br&gt;</code>.</li></ul>`,
      validate: V.validatePracticeParagraph,
      success: "Em đã viết được đoạn văn nhiều dòng bằng <p> và <br>.",
    },
    {
      id: "practice-ul", name: "Danh sách sở thích", title: "Bài 3 – Danh sách sở thích",
      task: `<p>Tạo tiêu đề:</p><p><code>SỞ THÍCH CỦA TÔI</code></p>
        <p>Sau đó tạo một danh sách <strong>KHÔNG CÓ THỨ TỰ</strong> gồm ít nhất 4 sở thích của em.</p>`,
      validate: V.validatePracticeUL,
      success: "Em đã tạo được tiêu đề và danh sách không có thứ tự bằng <ul>, <li>.",
    },
    {
      id: "practice-ol", name: "Những việc muốn làm", title: "Bài 4 – Những việc muốn làm",
      task: `<p>Tạo một danh sách <strong>CÓ THỨ TỰ</strong> liệt kê ít nhất 4 việc em muốn thực hiện trong tương lai.</p>`,
      validate: V.validatePracticeOL,
      success: "Em đã tạo được danh sách có thứ tự bằng <ol> và <li>.",
    },
    {
      id: "practice-table", name: "Mục tiêu học tập", title: "Bài 5 – Mục tiêu học tập",
      task: `<p>Hãy tạo bảng gồm 3 cột:</p>
        <ul><li><code>Môn học</code></li><li><code>Mục tiêu</code></li><li><code>Việc cần làm</code></li></ul>
        <p>Bảng phải có 1 hàng tiêu đề và ít nhất 3 hàng dữ liệu. Nội dung dữ liệu em tự viết.</p>`,
      validate: V.validatePracticeTable,
      success: "Em đã tạo được bảng đúng yêu cầu bằng <table>, <tr>, <th>, <td>.",
    },
  ];
  activities.forEach((a) => { a.showChecks = true; });

  function firstUnpassed() {
    return activities.findIndex((a) => !(App.state.practice[a.id] && App.state.practice[a.id].passed));
  }
  const isDone = () => firstUnpassed() === -1;
  const passedCount = () => activities.filter((a) => App.state.practice[a.id] && App.state.practice[a.id].passed).length;

  let token = 0;

  function render(root) {
    root.innerHTML = `<div class="stage-layout">
      <aside class="card side"><h3>Luyện tập</h3>
        <div class="side-count">${passedCount()} / ${activities.length} bài</div>
        <ul class="side-list"></ul></aside>
      <section class="stage-main"></section></div>`;
    show(root, isDone() ? "done" : firstUnpassed());
  }

  function show(root, view) {
    token++;
    const main = root.querySelector(".stage-main");
    const front = isDone() ? activities.length : firstUnpassed();
    root.querySelector(".side-count").textContent = `${passedCount()} / ${activities.length} bài`;
    root.querySelector(".side-list").innerHTML = activities.map((a, i) => {
      const passed = App.state.practice[a.id] && App.state.practice[a.id].passed;
      const locked = i > front;
      return `<li><button type="button" class="side-item ${view === i ? "active" : ""} ${passed ? "done" : ""}" data-i="${i}" ${locked ? "disabled" : ""}>
        <span class="mark">${passed ? "✓" : locked ? "🔒" : "○"}</span><span>${Util.esc(a.name)}</span></button></li>`;
    }).join("");
    root.querySelectorAll(".side-item").forEach((b) => b.addEventListener("click", () => show(root, Number(b.dataset.i))));

    if (view === "done") return renderDone(main);
    const def = activities[view];
    main.innerHTML = `
      <div class="card">
        <div class="badge">Luyện tập · Bài ${view + 1}/${activities.length}</div>
        <h2>${Util.esc(def.title)}</h2>
        <div class="task-text">${def.task}</div>
        <p class="muted">Em không có code mẫu – hãy tự nhớ các thẻ HTML đã học.</p>
        <div class="task-host"></div>
      </div>`;
    const myToken = token;
    Activity.mountTask(main.querySelector(".task-host"), {
      records: App.state.practice, def, blockPaste: true,
      onPassed() {
        if (myToken !== token) return;
        App.refresh();
        show(root, isDone() ? "done" : firstUnpassed());
      },
    });
  }

  /** Màn hình cuối Luyện tập: NỘP PHẦN 1 (Hình thành kiến thức + Luyện tập), rồi mới/hoặc sang Vận dụng. */
  function renderDone(main) {
    main.innerHTML = `
      <div class="card center">
        <div class="big-emoji">🏅</div>
        <h2>HOÀN THÀNH LUYỆN TẬP</h2>
        <p>Em đã hoàn thành Hình thành kiến thức và cả ${activities.length} bài luyện tập.
        Hãy <strong>nộp phần 1</strong> để giáo viên nhận được bài của em.</p>
        <div class="part1-box"></div>
      </div>`;
    const box = main.querySelector(".part1-box");
    let busy = false;

    function paint(errMsg) {
      const at = App.state.part1SubmittedAt;
      if (at) {
        const s = App.state.student;
        box.innerHTML = `
          <div class="fb fb-ok"><div class="fb-title">🎉 NỘP PHẦN 1 THÀNH CÔNG</div>
            <p>Họ tên: <strong>${Util.esc(s.name)}</strong> · Lớp: <strong>${Util.esc(s.className)}</strong><br>
            Hình thành kiến thức và Luyện tập của em đã được lưu (${Util.esc(Util.formatDateTime(at))}).</p></div>
          <p class="muted">Nếu hết giờ, em có thể dừng ở đây. Lần sau mở lại web <strong>trên cùng máy tính, cùng trình duyệt</strong> để làm tiếp Vận dụng.</p>
          <button type="button" class="btn btn-primary go-next">SANG VẬN DỤNG ➜</button>`;
      } else {
        box.innerHTML = `
          ${errMsg ? `<div class="fb fb-warn"><div class="fb-title">Không thể gửi bài.</div>
            <p>Bài của em vẫn được lưu trên máy.<br>Hãy kiểm tra kết nối Internet và thử lại.</p>
            <p class="muted">Chi tiết: ${Util.esc(errMsg)}</p></div>` : ""}
          <button type="button" class="btn btn-primary btn-part1">NỘP PHẦN 1: HÌNH THÀNH + LUYỆN TẬP</button>
          <p><button type="button" class="link-btn go-next">Chưa nộp, sang Vận dụng ➜</button><br>
          <span class="muted">(Phần 1 sẽ được nộp cùng lúc khi em nộp bài Vận dụng.)</span></p>`;
      }
      const next = box.querySelector(".go-next");
      if (next) next.addEventListener("click", () => App.go("final"));
      const btn = box.querySelector(".btn-part1");
      if (btn) btn.addEventListener("click", async () => {
        if (busy) return;                       // chống bấm liên tục
        busy = true;
        btn.disabled = true;
        box.insertAdjacentHTML("beforeend", '<div class="fb fb-info sending"><div class="loader"></div> Đang gửi bài...</div>');
        try { await submitPart1(); paint(); }
        catch (e) { console.warn("Nộp phần 1 thất bại:", e.message); paint(e.message); }
        finally { busy = false; }
      });
    }
    paint();
  }

  /** Nộp phần 1 = toàn bộ Hình thành kiến thức + Luyện tập trong MỘT lần ghi. Ném lỗi nếu thất bại. */
  async function submitPart1() {
    const pick = (list, rec) => list.map((a) => rec[a.id]).filter(Boolean);
    const submittedAt = Util.nowISO();
    await Api.send({
      type: "part1",
      student: Api.studentPayload(App.state.student),
      submittedAt,
      learning: pick(Learning.activities, App.state.learning),
      practice: pick(activities, App.state.practice),
    });
    App.state.part1SubmittedAt = submittedAt;
    App.save();
  }

  return { activities, render, isDone, passedCount, submitPart1 };
})();
