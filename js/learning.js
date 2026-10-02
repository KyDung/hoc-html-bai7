/* ==========================================================
 * learning.js – Giai đoạn 1: HÌNH THÀNH KIẾN THỨC
 * Mỗi bài: Giới thiệu (xem ví dụ) -> Học sinh gõ lại -> Kiểm tra.
 * ========================================================== */
const Learning = (() => {
  const V = Validators;

  const activities = [
    {
      id: "learn-heading",
      name: "Heading",
      icon: "🔠",
      title: "Thẻ tiêu đề (Heading)",
      lead: "Thẻ tiêu đề <h1>, <h2>, <h3> dùng để tạo các tiêu đề trong trang web, giúp người đọc biết nội dung từng phần. Số càng nhỏ thì tiêu đề càng quan trọng và chữ càng lớn.",
      explain: [
        ["<h1>", "tiêu đề chính."],
        ["<h2>", "tiêu đề cấp 2."],
        ["<h3>", "tiêu đề cấp 3."],
      ],
      sample:
        "<h1>Gửi tôi của 10 năm sau</h1>\n<h2>Đôi lời nhắn gửi tới bản thân</h2>\n<h3>Lời chào đầu tiên</h3>",
      validate: (h) =>
        V.validateHeading(h, {
          h1: "Gửi tôi của 10 năm sau",
          h2: "Đôi lời nhắn gửi tới bản thân",
          h3: "Lời chào đầu tiên",
          strictClose: true,
        }),
      success: "Em đã tạo được tiêu đề bằng <h1>, <h2> và <h3>.",
    },
    {
      id: "learn-paragraph",
      name: "Paragraph",
      icon: "📝",
      title: "Thẻ đoạn văn (Paragraph)",
      lead: "Thẻ đoạn văn <p> dùng để tạo một đoạn văn bản. Văn bản thông thường trong trang web nên được đặt trong thẻ này.",
      explain: [["<p>", "dùng để tạo một đoạn văn bản."]],
      sample:
        "<p>\nMình mong rằng 10 năm sau mình sẽ trở thành phiên bản tốt hơn của chính mình.\n</p>",
      validate: (h) =>
        V.validateParagraph(h, {
          text: "Mình mong rằng 10 năm sau mình sẽ trở thành phiên bản tốt hơn của chính mình.",
          strictClose: true,
        }),
      success: "Em đã tạo được một đoạn văn bằng <p>.",
    },
    {
      id: "learn-br",
      name: "Xuống dòng",
      icon: "↩️",
      title: "Thẻ xuống dòng (br)",
      lead: "Thẻ xuống dòng <br> dùng để ngắt dòng ngay trong một đoạn văn. Đây là thẻ không có thẻ đóng.",
      explain: [
        ["<br>", "xuống dòng (cũng có thể viết <br />)."],
        ["<p>", "chứa cả đoạn, các dòng cách nhau bởi <br>."],
      ],
      sample: "<p>\nXin chào!<br>\nMình là học sinh lớp 12.\n</p>",
      validate: (h) =>
        V.validateBR(h, {
          lines: ["Xin chào!", "Mình là học sinh lớp 12."],
          strictClose: true,
        }),
      success: "Em đã dùng đúng <br> để xuống dòng trong đoạn văn.",
    },
    {
      id: "learn-ul",
      name: "Danh sách UL",
      icon: "•",
      title: "Thẻ danh sách không có thứ tự",
      lead: "Thẻ <ul> kết hợp với thẻ <li> dùng để tạo danh sách không có thứ tự: các mục ngang hàng nhau, mỗi mục có một dấu chấm tròn đầu dòng.",
      explain: [
        ["<ul>", "tạo danh sách không thứ tự."],
        ["<li>", "tạo từng phần tử trong danh sách."],
      ],
      sample:
        "<ul>\n    <li>Xem phim</li>\n    <li>Đá bóng</li>\n    <li>Chơi game</li>\n</ul>",
      validate: (h) =>
        V.validateUL(h, {
          minItems: 3,
          items: ["Xem phim", "Đá bóng", "Chơi game"],
          strictClose: true,
        }),
      success: "Em đã tạo được danh sách không có thứ tự bằng <ul> và <li>.",
    },
    {
      id: "learn-ol",
      name: "Danh sách OL",
      icon: "1.",
      title: "Thẻ danh sách có thứ tự",
      lead: "Thẻ <ol> kết hợp với thẻ <li> dùng để tạo danh sách có thứ tự: các mục có trình tự hoặc thứ hạng, mỗi mục được đánh số tự động.",
      explain: [
        ["<ol>", "tạo danh sách có thứ tự."],
        ["<li>", "tạo từng phần tử trong danh sách."],
      ],
      sample:
        "<ol>\n    <li>Đỗ đại học</li>\n    <li>Có công việc đầu tiên</li>\n    <li>Học thêm một ngoại ngữ</li>\n</ol>",
      validate: (h) =>
        V.validateOL(h, {
          minItems: 3,
          items: [
            "Đỗ đại học",
            "Có công việc đầu tiên",
            "Học thêm một ngoại ngữ",
          ],
          strictClose: true,
        }),
      success: "Em đã tạo được danh sách có thứ tự bằng <ol> và <li>.",
    },
    {
      id: "learn-table",
      name: "Bảng",
      icon: "▦",
      title: "Thẻ tạo bảng (table)",
      lead: "Các thẻ <table>, <tr>, <th>, <td> dùng để trình bày dữ liệu dưới dạng bảng gồm hàng và cột. Hàng đầu thường là hàng tiêu đề.",
      explain: [
        ["<table>", "tạo bảng."],
        ["<tr>", "tạo một hàng."],
        ["<th>", "tạo ô tiêu đề."],
        ["<td>", "tạo ô dữ liệu."],
      ],
      sample:
        '<table border="1">\n    <tr>\n        <th>Mốc thời gian</th>\n        <th>Mục tiêu</th>\n        <th>Điều cần làm</th>\n    </tr>\n\n    <tr>\n        <td>1 - 3 năm</td>\n        <td>Đỗ đại học</td>\n        <td>Học tập chăm chỉ</td>\n    </tr>\n</table>',
      validate: (h) =>
        V.validateTable(h, {
          minCols: 3,
          minDataRows: 1,
          minTh: 3,
          minTd: 3,
          headers: ["Mốc thời gian", "Mục tiêu", "Điều cần làm"],
          rows: [["1 - 3 năm", "Đỗ đại học", "Học tập chăm chỉ"]],
          strictClose: true,
        }),
      success: "Em đã tạo được bảng bằng <table>, <tr>, <th> và <td>.",
    },
  ];

  /** Chỉ số hoạt động đầu tiên chưa đạt (-1 nếu đã xong hết). */
  function firstUnpassed() {
    return activities.findIndex(
      (a) => !(App.state.learning[a.id] && App.state.learning[a.id].passed),
    );
  }
  const isDone = () => firstUnpassed() === -1;
  const passedCount = () =>
    activities.filter(
      (a) => App.state.learning[a.id] && App.state.learning[a.id].passed,
    ).length;

  let token = 0; // đổi mỗi lần render để hủy timer cũ

  function render(root) {
    root.innerHTML = `<div class="stage-layout">
      <aside class="card side"><h3>Hình thành kiến thức</h3><ul class="side-list"></ul></aside>
      <section class="stage-main"></section></div>`;
    show(root, isDone() ? "done" : firstUnpassed());
  }

  function show(root, view, step) {
    token++;
    const main = root.querySelector(".stage-main");
    renderSide(root, view);
    if (view === "done") return renderDone(root, main);
    const def = activities[view];
    const rec = App.state.learning[def.id];
    const draft = Store.loadDraft(App.state.student.studentId, def.id);
    // Nếu đã từng gõ thì vào thẳng bước gõ lại
    const startStep =
      step ||
      ((rec && rec.attempts) || (draft && draft.code) ? "type" : "intro");
    if (startStep === "intro") renderIntro(root, main, view);
    else renderType(root, main, view);
  }

  function renderSide(root, view) {
    const front = firstUnpassed() === -1 ? activities.length : firstUnpassed();
    root.querySelector(".side-list").innerHTML = activities
      .map((a, i) => {
        const passed =
          App.state.learning[a.id] && App.state.learning[a.id].passed;
        const locked = i > front;
        const mark = passed ? "✓" : locked ? "🔒" : "○";
        return `<li><button type="button" class="side-item ${view === i ? "active" : ""} ${passed ? "done" : ""}" data-i="${i}" ${locked ? "disabled" : ""}>
        <span class="mark">${mark}</span><span>${Util.esc(a.name)}</span></button></li>`;
      })
      .join("");
    root
      .querySelectorAll(".side-item")
      .forEach((b) =>
        b.addEventListener("click", () =>
          show(root, Number(b.dataset.i), "intro"),
        ),
      );
  }

  /** Bước 1 – Giới thiệu & xem ví dụ. */
  function renderIntro(root, main, i) {
    const def = activities[i];
    main.innerHTML = `
      <div class="card">
        <div class="badge">Bài ${i + 1}/${activities.length} · Bước 1: Quan sát</div>
        <h2>${def.icon} ${Util.esc(def.title)}</h2>
        <p>${Util.esc(def.lead)}</p>
        <div class="two-col">
          <div><div class="mini-title">Đoạn HTML mẫu</div><pre class="code-sample">${Util.esc(def.sample)}</pre></div>
          <div class="pv-host"></div>
        </div>
        <div class="mini-title">Giải thích</div>
        <ul class="explain">${def.explain.map(([t, d]) => `<li><code>${Util.esc(t)}</code> ${Util.esc(d)}</li>`).join("")}</ul>
        <button type="button" class="btn btn-primary go-type">ĐÃ HIỂU – TỰ GÕ LẠI ➜</button>
      </div>`;
    Preview.create(main.querySelector(".pv-host")).update(def.sample);
    main
      .querySelector(".go-type")
      .addEventListener("click", () => show(root, i, "type"));
  }

  /** Bước 2 – Học sinh tự gõ lại. */
  function renderType(root, main, i) {
    const def = activities[i];
    main.innerHTML = `
      <div class="card">
        <div class="badge">Bài ${i + 1}/${activities.length} · Bước 2: Tự gõ lại</div>
        <h2>${def.icon} ${Util.esc(def.title)}</h2>
        <p><strong>Hãy tự gõ lại đoạn HTML vừa quan sát.</strong> Không cần giống từng khoảng trắng hay xuống dòng, miễn đúng cấu trúc.</p>
        <details class="ref" open><summary>Xem lại đoạn mẫu</summary><pre class="code-sample nocopy">${Util.esc(def.sample)}</pre></details>
        <div class="task-host"></div>
        <button type="button" class="link-btn back-intro">← Xem lại phần giới thiệu</button>
      </div>`;
    const myToken = token;
    Activity.mountTask(main.querySelector(".task-host"), {
      records: App.state.learning,
      def,
      blockPaste: true,
      onPassed() {
        if (myToken !== token) return;
        App.refresh();
        show(root, isDone() ? "done" : firstUnpassed());
      },
    });
    main
      .querySelector(".back-intro")
      .addEventListener("click", () => show(root, i, "intro"));
  }

  /** Màn hình kết thúc Hình thành kiến thức (dữ liệu được nộp ở cuối Luyện tập). */
  function renderDone(root, main) {
    const learned = [
      "Heading",
      "Paragraph",
      "br",
      "ul + li",
      "ol + li",
      "table",
      "tr",
      "th",
      "td",
    ];
    main.innerHTML = `
      <div class="card center">
        <div class="big-emoji">🎉</div>
        <h2>HOÀN THÀNH HÌNH THÀNH KIẾN THỨC</h2>
        <p>Bạn đã biết sử dụng:</p>
        <ul class="tick-list">${learned.map((t) => `<li>✓ ${Util.esc(t)}</li>`).join("")}</ul>
        <button type="button" class="btn btn-primary go-next">SANG LUYỆN TẬP ➜</button>
      </div>`;
    main
      .querySelector(".go-next")
      .addEventListener("click", () => App.go("practice"));
  }

  return { activities, render, isDone, passedCount };
})();
