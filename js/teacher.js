/* ==========================================================
 * teacher.js – Trang giáo viên: đăng nhập Google, xem bài nộp theo thời gian thực.
 * Quyền đọc dữ liệu do Firestore Rules quyết định (chỉ email giáo viên) – xem firestore.rules.
 * ========================================================== */
(() => {
  const VERSION = "10.14.1";
  const BASE = `https://www.gstatic.com/firebasejs/${VERSION}/`;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let fb = null;            // { auth, authMod, fs, db }
  let students = [];        // [{ key, ...data }]
  let selectedKey = null;
  let unsub = null;
  let lessonId = "";
  let bigPreview = false;

  /* ---------- Khởi động ---------- */
  async function init() {
    if (/^DIEN_/.test(FIREBASE_CONFIG.apiKey)) { $("t-loading").textContent = "Chưa điền js/firebase-config.js."; return; }
    try {
      const [appMod, authMod, fs] = await Promise.all([
        import(BASE + "firebase-app.js"), import(BASE + "firebase-auth.js"), import(BASE + "firebase-firestore.js"),
      ]);
      const app = appMod.initializeApp(FIREBASE_CONFIG);
      fb = { auth: authMod.getAuth(app), authMod, fs, db: fs.getFirestore(app) };
    } catch (e) {
      $("t-loading").textContent = "Không tải được Firebase: " + e.message;
      return;
    }
    fb.authMod.onAuthStateChanged(fb.auth, onAuth);
    $("t-signin").addEventListener("click", signIn);
    $("t-signout").addEventListener("click", () => fb.authMod.signOut(fb.auth));
    ["t-class", "t-status"].forEach((id) => $(id).addEventListener("change", render));
    $("t-search").addEventListener("input", render);
    $("t-lesson").addEventListener("change", () => watch($("t-lesson").value));
    $("t-csv").addEventListener("click", exportCSV);
  }

  async function signIn() {
    $("t-login-msg").textContent = "";
    try {
      await fb.authMod.signInWithPopup(fb.auth, new fb.authMod.GoogleAuthProvider());
    } catch (e) {
      $("t-login-msg").textContent = e.code === "auth/unauthorized-domain"
        ? "Tên miền này chưa được cho phép đăng nhập. Thêm vào Firebase → Authentication → Settings → Authorized domains."
        : "Không đăng nhập được: " + (e.code || e.message);
    }
  }

  function onAuth(user) {
    $("t-loading").hidden = true;
    $("t-login").hidden = !!user;
    $("t-app").hidden = !user;
    $("t-signout").hidden = !user;
    $("t-user").textContent = user ? "👤 " + user.email : "";
    if (unsub) { unsub(); unsub = null; }
    students = []; selectedKey = null;
    if (user) loadLessons();
  }

  /* ---------- Bài học & dữ liệu ---------- */
  async function loadLessons() {
    $("t-error").textContent = "";
    try {
      const snap = await fb.fs.getDocs(fb.fs.collection(fb.db, "lessons"));
      const items = snap.docs.map((d) => ({ id: d.id, title: d.data().title || d.id, at: d.data().updatedAt }));
      items.sort((a, b) => (b.at ? b.at.toMillis() : 0) - (a.at ? a.at.toMillis() : 0));
      $("t-lesson").innerHTML = items.map((l) => `<option value="${esc(l.id)}">${esc(l.title)} (${esc(l.id)})</option>`).join("");
      if (!items.length) { $("t-error").textContent = "Chưa có bài học nào được nộp."; render(); return; }
      let saved = null; try { saved = localStorage.getItem("teacher-lesson"); } catch (e) { /* bỏ qua */ }
      if (saved && items.some((l) => l.id === saved)) $("t-lesson").value = saved;
      watch($("t-lesson").value);
    } catch (e) { showError(e); }
  }

  /** Theo dõi realtime danh sách học sinh của một bài. */
  function watch(id) {
    lessonId = id; selectedKey = null;
    try { localStorage.setItem("teacher-lesson", id); } catch (e) { /* bỏ qua */ }
    if (unsub) unsub();
    unsub = fb.fs.onSnapshot(fb.fs.collection(fb.db, "lessons", id, "students"), (snap) => {
      students = snap.docs.map((d) => Object.assign({ key: d.id }, d.data()));
      $("t-error").textContent = "";
      rebuildClassFilter();
      render();
    }, showError);
  }

  function showError(e) {
    console.warn(e);
    $("t-error").textContent = e.code === "permission-denied"
      ? "Tài khoản này không có quyền giáo viên (kiểm tra email trong firestore.rules và đã Publish chưa)."
      : "Lỗi: " + (e.message || e);
  }

  /* ---------- Tóm tắt từng học sinh ---------- */
  const ms = (t) => (t && t.toDate ? t.toDate() : null);
  const fmt = (d) => (d ? d.toLocaleString("vi-VN") : "—");

  /** Cảnh báo nếu số ký tự gõ quá ít so với độ dài code, hoặc có dán code. */
  function typingFlags(len, st) {
    const out = [];
    if (!st || !len) return out;
    if (st.pasteCount > 0) out.push(`dán code ${st.pasteCount} lần`);
    if (typeof st.charsTyped === "number" && st.charsTyped < len * 0.6) out.push(`chỉ gõ ${st.charsTyped}/${len} ký tự`);
    return out;
  }

  function summarize(s) {
    const learning = s.learning || [], practice = s.practice || [], p = s.progress || {};
    const flags = [];
    if (s.final) typingFlags(s.final.characters || (s.final.code || "").length, s.final.typingStats).forEach((f) => flags.push("Vận dụng: " + f));
    [...learning, ...practice].forEach((r) => {
      typingFlags((r.studentCode || "").length, r.typingStats).forEach((f) => flags.push(`${r.activityId}: ${f}`));
    });
    return {
      lp: learning.filter((a) => a.passed).length, ln: learning.length,
      pp: practice.filter((a) => a.passed).length, pn: practice.length,
      part1: !!p.part1Submitted, part1At: p.part1SubmittedAt,
      final: !!s.final, finalAt: s.final && s.final.submittedAt,
      updated: ms(s.updatedAt), flags,
    };
  }

  /* ---------- Bảng ---------- */
  function rebuildClassFilter() {
    const cur = $("t-class").value;
    const classes = [...new Set(students.map((s) => (s.student || {}).className).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
    $("t-class").innerHTML = '<option value="">Tất cả</option>' + classes.map((c) => `<option>${esc(c)}</option>`).join("");
    $("t-class").value = classes.includes(cur) ? cur : "";
  }

  function visible() {
    const cls = $("t-class").value, q = $("t-search").value.trim().toLowerCase(), st = $("t-status").value;
    return students.map((s) => ({ s, sum: summarize(s) })).filter(({ s, sum }) => {
      const info = s.student || {};
      if (cls && info.className !== cls) return false;
      if (q && !(info.name || "").toLowerCase().includes(q)) return false;
      if (st === "final" && !sum.final) return false;
      if (st === "nofinal" && sum.final) return false;
      if (st === "part1" && !sum.part1) return false;
      if (st === "flag" && !sum.flags.length) return false;
      return true;
    }).sort((a, b) => {
      const x = a.s.student || {}, y = b.s.student || {};
      return (x.className || "").localeCompare(y.className || "", "vi", { numeric: true }) || (x.name || "").localeCompare(y.name || "", "vi");
    });
  }

  function render() {
    const rows = visible();
    $("t-count").textContent = `${rows.length}/${students.length} học sinh · ${students.filter((s) => s.final).length} đã nộp vận dụng`;
    $("t-table").innerHTML = `<thead><tr><th>Lớp</th><th>Họ và tên</th><th>Hình thành</th><th>Luyện tập</th><th>Phần 1</th><th>Vận dụng</th><th>Cập nhật</th><th></th></tr></thead><tbody>${
      rows.map(({ s, sum }) => {
        const i = s.student || {};
        return `<tr data-k="${esc(s.key)}" class="${s.key === selectedKey ? "sel" : ""}">
          <td>${esc(i.className)}</td><td>${esc(i.name)}</td>
          <td>${sum.lp}/${sum.ln}</td><td>${sum.pp}/${sum.pn}</td>
          <td class="${sum.part1 ? "t-ok" : "t-no"}">${sum.part1 ? "✓ đã nộp" : "—"}</td>
          <td class="${sum.final ? "t-ok" : "t-no"}">${sum.final ? "✓ đã nộp" : "—"}</td>
          <td>${esc(fmt(sum.updated))}</td>
          <td class="t-warn" title="${esc(sum.flags.join("\n"))}">${sum.flags.length ? "⚠️ " + sum.flags.length : ""}</td></tr>`;
      }).join("")}</tbody>`;
    $("t-table").querySelectorAll("tbody tr").forEach((tr) => tr.addEventListener("click", () => { selectedKey = tr.dataset.k; render(); }));
    renderDetail();
  }

  /* ---------- Chi tiết một học sinh ---------- */
  function statsLine(st) {
    if (!st) return "—";
    return `gõ ${st.charsTyped ?? "?"} ký tự · ${st.keyCount ?? "?"} phím · ${st.changeCount ?? "?"} thay đổi`
      + (st.pasteCount ? ` · <span class="t-warn">dán ${st.pasteCount} lần</span>` : "")
      + (st.pasteBlocked ? ` · cố dán ${st.pasteBlocked} lần (đã chặn)` : "");
  }

  function renderDetail() {
    const box = $("t-detail");
    const s = students.find((x) => x.key === selectedKey);
    if (!s) { box.innerHTML = '<p class="muted">Chọn một học sinh ở bảng bên trái để xem bài.</p>'; return; }
    const i = s.student || {}, sum = summarize(s), f = s.final;
    let html = `<h3>${esc(i.name)} · ${esc(i.className)}</h3>
      <div class="muted">Cập nhật: ${esc(fmt(sum.updated))}</div>
      <div class="t-actions">
        ${f ? '<button type="button" class="btn btn-ghost" id="t-dl">⬇ Tải bài vận dụng (.html)</button>' : ""}
        <button type="button" class="btn btn-danger" id="t-del">🗑 Xóa bài này</button></div>`;

    html += '<div class="t-sec"><h4>🚀 Bài vận dụng</h4>';
    if (!f) html += '<p class="muted">Chưa nộp.</p>';
    else {
      const req = f.requirements || {};
      html += `<dl class="t-kv"><dt>Nộp lúc</dt><dd>${esc(fmt(f.submittedAt ? new Date(f.submittedAt) : null))}</dd>
        <dt>Độ dài</dt><dd>${esc(f.characters)} ký tự</dd><dt>Quá trình gõ</dt><dd>${statsLine(f.typingStats)}</dd></dl>
        <div class="t-req">${Object.keys(req).map((k) => `<span class="${req[k] ? "t-ok" : "t-warn"}">${req[k] ? "✓" : "✗"} ${esc(k)}</span>`).join("")}</div>
        <button type="button" class="link-btn" id="t-big">${bigPreview ? "Thu nhỏ preview" : "Phóng to preview"}</button>
        <iframe class="t-frame ${bigPreview ? "big" : ""}" sandbox="" title="Bài vận dụng"></iframe>
        <details><summary>Xem code HTML</summary><pre class="t-code">${esc(f.code)}</pre></details>`;
    }
    html += "</div>";

    const block = (title, list) => {
      let h = `<div class="t-sec"><h4>${title}</h4>`;
      if (!list || !list.length) return h + '<p class="muted">Chưa có dữ liệu.</p></div>';
      h += list.map((r) => `<details class="t-act"><summary>${r.passed ? "✓" : "○"} ${esc(r.activityId)} · ${esc(r.attempts)} lần kiểm tra</summary>
        <div class="muted">${statsLine(r.typingStats)}</div><pre class="t-code">${esc(r.studentCode)}</pre></details>`).join("");
      return h + "</div>";
    };
    html += block(`📘 Hình thành kiến thức (${sum.lp}/${sum.ln})`, s.learning) + block(`✏️ Luyện tập (${sum.pp}/${sum.pn})`, s.practice);
    if (sum.flags.length) html += `<div class="t-sec"><h4 class="t-warn">⚠️ Cần xem lại</h4><ul>${sum.flags.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
    box.innerHTML = html;

    // Preview bài vận dụng trong iframe sandbox="" (không chạy script) – an toàn cho trang giáo viên.
    const frame = box.querySelector(".t-frame");
    if (frame) frame.srcdoc = String(f.code || "").replace(/<script[\s\S]*?(?:<\/script\s*>|$)/gi, "");
    const big = $("t-big"); if (big) big.addEventListener("click", () => { bigPreview = !bigPreview; renderDetail(); });
    const dl = $("t-dl"); if (dl) dl.addEventListener("click", () => download(`${s.key}.html`, f.code, "text/html"));
    $("t-del").addEventListener("click", async () => {
      if (!confirm(`Xóa vĩnh viễn bài của ${i.name} (${i.className})?`)) return;
      try { await fb.fs.deleteDoc(fb.fs.doc(fb.db, "lessons", lessonId, "students", s.key)); selectedKey = null; } catch (e) { showError(e); }
    });
  }

  /* ---------- Xuất file ---------- */
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function exportCSV() {
    const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const head = ["Lớp", "Họ và tên", "Hình thành", "Luyện tập", "Nộp phần 1", "Nộp vận dụng", "Số ký tự", "Cảnh báo"];
    const rows = visible().map(({ s, sum }) => {
      const i = s.student || {};
      return [i.className, i.name, `${sum.lp}/${sum.ln}`, `${sum.pp}/${sum.pn}`, sum.part1 ? "x" : "", sum.final ? "x" : "",
        s.final ? s.final.characters : "", sum.flags.join("; ")];
    });
    download(`${lessonId}_bai-nop.csv`, "﻿" + [head, ...rows].map((r) => r.map(q).join(",")).join("\r\n"), "text/csv");
  }

  init();
})();
