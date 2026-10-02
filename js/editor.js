/* ==========================================================
 * editor.js – Code editor đơn giản (textarea), Preview an toàn, thanh kéo chia đôi
 * ========================================================== */

/** Tạo editor có số dòng, Tab thụt lề, tự thụt lề khi Enter, tùy chọn tự đóng thẻ. */
const Editor = (() => {
  const VOID_TAGS = new Set(["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"]);

  function emptyStats() {
    return { keyCount: 0, changeCount: 0, charsTyped: 0, pasteBlocked: 0, pasteCount: 0, firstInputAt: null, lastInputAt: null };
  }

  /**
   * opts: { value, stats, placeholder, blockPaste, autoClose, onChange(code, stats), onBlockedPaste() }
   * Trả về { getValue, setValue, getStats, resetStats, focus }
   */
  function create(host, opts = {}) {
    host.classList.add("code-editor");
    host.innerHTML = `
      <div class="ce-bar">
        <label class="ce-toggle"><input type="checkbox" class="ce-auto"> Tự đóng thẻ</label>
        <span class="ce-hint">Phím Tab = thụt lề (Esc rồi Tab để rời khung)</span>
      </div>
      <div class="ce-body">
        <div class="ce-gutter" aria-hidden="true"></div>
        <textarea class="ce-area" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"
          aria-label="Khung viết code HTML"></textarea>
      </div>`;
    const ta = host.querySelector(".ce-area");
    const gutter = host.querySelector(".ce-gutter");
    const autoBox = host.querySelector(".ce-auto");
    ta.placeholder = opts.placeholder || "";
    ta.value = opts.value || "";
    autoBox.checked = !!opts.autoClose;

    const stats = Object.assign(emptyStats(), opts.stats || {});
    let lastLen = ta.value.length;
    let trapTab = true;

    function renderGutter() {
      const n = ta.value.split("\n").length;
      let s = "";
      for (let i = 1; i <= n; i++) s += i + "\n";
      gutter.textContent = s;
      gutter.scrollTop = ta.scrollTop;
    }

    /** Chèn text tại vị trí con trỏ (giữ được Ctrl+Z khi trình duyệt hỗ trợ). */
    function insert(text) {
      ta.focus();
      if (!document.execCommand("insertText", false, text)) {
        ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    ta.addEventListener("keydown", (e) => {
      const printable = e.key.length === 1 && !e.ctrlKey && !e.metaKey;
      if (printable || ["Backspace", "Delete", "Enter", "Tab"].includes(e.key)) stats.keyCount++;

      if (e.key === "Escape") { trapTab = false; return; }
      if (e.key === "Tab" && trapTab && !e.shiftKey) {
        e.preventDefault();
        insert("    ");
        return;
      }
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && ta.selectionStart === ta.selectionEnd) {
        const pos = ta.selectionStart;
        const before = ta.value.slice(0, pos);
        const indent = (before.slice(before.lastIndexOf("\n") + 1).match(/^[ \t]*/) || [""])[0];
        const between = before.endsWith(">") && ta.value.slice(pos).startsWith("</");
        e.preventDefault();
        if (between) {
          insert("\n" + indent + "    \n" + indent);
          const back = indent.length + 1;
          ta.setSelectionRange(ta.selectionStart - back, ta.selectionStart - back);
        } else {
          insert("\n" + indent);
        }
        return;
      }
      if (e.key === ">" && autoBox.checked && !e.ctrlKey && !e.metaKey) {
        const pos = ta.selectionStart;
        const m = ta.value.slice(0, pos).match(/<([a-zA-Z][a-zA-Z0-9]*)(?:\s[^<>]*)?$/);
        if (m && !VOID_TAGS.has(m[1].toLowerCase()) && !ta.value.slice(pos).startsWith("</" + m[1])) {
          e.preventDefault();
          insert("></" + m[1] + ">");
          const back = m[1].length + 3;
          ta.setSelectionRange(ta.selectionStart - back, ta.selectionStart - back);
        }
      }
    });

    // Chặn dán / kéo thả khi bài yêu cầu học sinh tự gõ.
    function blockIfNeeded(e) {
      if (!opts.blockPaste) return;
      e.preventDefault();
      stats.pasteBlocked++;
      if (opts.onBlockedPaste) opts.onBlockedPaste();
      if (opts.onChange) opts.onChange(ta.value, stats);
    }
    ta.addEventListener("paste", blockIfNeeded);
    ta.addEventListener("drop", blockIfNeeded);

    ta.addEventListener("input", (e) => {
      const now = Util.nowISO();
      const delta = ta.value.length - lastLen;
      lastLen = ta.value.length;
      stats.changeCount++;
      if (!stats.firstInputAt) stats.firstInputAt = now;
      stats.lastInputAt = now;
      if (e.inputType === "insertFromPaste" || e.inputType === "insertFromDrop") stats.pasteCount++;
      else if (delta > 0) stats.charsTyped += delta;
      renderGutter();
      if (opts.onChange) opts.onChange(ta.value, stats);
    });
    ta.addEventListener("scroll", () => { gutter.scrollTop = ta.scrollTop; });
    ta.addEventListener("blur", () => { trapTab = true; });
    renderGutter();

    return {
      getValue: () => ta.value,
      setValue(v) { ta.value = v; lastLen = v.length; renderGutter(); },
      getStats: () => Object.assign({}, stats),
      resetStats() { Object.assign(stats, emptyStats()); },
      focus: () => ta.focus(),
    };
  }

  /** Thanh kéo chia đôi vùng editor / preview (chỉ có tác dụng trên màn hình rộng). */
  function splitter(container, handle) {
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const rect = container.getBoundingClientRect();
      const move = (ev) => {
        const pct = Math.min(75, Math.max(25, ((ev.clientX - rect.left) / rect.width) * 100));
        container.style.gridTemplateColumns = `${pct}% 10px minmax(0, 1fr)`;
      };
      const up = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });
  }

  return { create, splitter, emptyStats };
})();

/** Preview an toàn: iframe sandbox="" (không chạy script, không chạm vào trang cha). */
const Preview = (() => {
  const EMPTY = '<p style="font-family:sans-serif;color:#94a3b8">Kết quả sẽ hiện ở đây khi em gõ code…</p>';

  /** Loại bỏ <script> trước khi hiển thị (iframe sandbox cũng đã chặn script). */
  function sanitize(html) {
    return html.replace(/<script[\s\S]*?(?:<\/script\s*>|$)/gi, "");
  }

  /** opts: { title, fullscreen } -> { update(html) } */
  function create(host, opts = {}) {
    host.classList.add("preview-box");
    host.innerHTML = `
      <div class="pv-head">
        <span>🖥️ ${Util.esc(opts.title || "Kết quả hiển thị")}</span>
        ${opts.fullscreen ? '<button type="button" class="btn-mini pv-full">⛶ Toàn màn hình</button>' : ""}
      </div>
      <iframe class="pv-frame" sandbox="" title="Xem trước trang web"></iframe>`;
    const frame = host.querySelector(".pv-frame");
    const btn = host.querySelector(".pv-full");
    if (btn) {
      const toggle = (on) => {
        host.classList.toggle("pv-fullscreen", on);
        btn.textContent = on ? "✕ Đóng toàn màn hình" : "⛶ Toàn màn hình";
      };
      btn.addEventListener("click", () => toggle(!host.classList.contains("pv-fullscreen")));
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && host.classList.contains("pv-fullscreen")) toggle(false);
      });
    }
    function update(html) {
      frame.srcdoc = html && html.trim() ? sanitize(html) : EMPTY;
    }
    // Không gán srcdoc ở đây: gán 2 lần liên tiếp có thể làm iframe hiển thị trắng.
    return { update };
  }

  return { create, sanitize };
})();
