/* ==========================================================
 * validators.js – Kiểm tra bài làm bằng DOM (KHÔNG so sánh chuỗi thô)
 *
 * Mỗi validator trả về:
 *   { passed: boolean,
 *     errors: string[],                       // gợi ý cho các mục chưa đạt
 *     checks: [{ ok, label, hint }] }         // từng tiêu chí
 * ========================================================== */
const Validators = (() => {
  /* ---------- Helper ---------- */

  /** Parse HTML thành Document (DOMParser không chạy script). */
  function parseHTML(html) {
    return new DOMParser().parseFromString(html || "", "text/html");
  }

  function countElements(root, selector) {
    return root.querySelectorAll(selector).length;
  }

  /** Chuẩn hóa text để so sánh: bỏ khoảng trắng thừa, không phân biệt hoa/thường, bỏ dấu câu cuối. */
  function norm(s) {
    return (s || "")
      .normalize("NFC")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/[.!,;:?…]+$/, "")
      .trim();
  }

  /** Độ dài text hiển thị của một phần tử (khoảng trắng liên tiếp tính là 1). */
  function getTextLength(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim().length;
  }

  /** Tách nội dung phần tử thành các dòng theo thẻ <br>. */
  function getLines(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("br").forEach((b) => b.replaceWith("\u0001"));
    return clone.textContent
      .replace(/\s+/g, " ")
      .split("\u0001")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  /** Các <li> là con trực tiếp của list. */
  function directItems(list) {
    return Array.from(list.children).filter((c) => c.tagName === "LI");
  }

  function filledItems(list) {
    return directItems(list).filter((li) => norm(li.textContent));
  }

  /** Danh sách tốt nhất (nhiều mục nhất) trong số các <ul>/<ol>. */
  function bestList(doc, tag) {
    const lists = Array.from(doc.querySelectorAll(tag));
    lists.sort((a, b) => filledItems(b).length - filledItems(a).length);
    return lists[0] || null;
  }

  /**
   * Kích thước bảng. Trả về số hàng, số cột lớn nhất, số th/td,
   * số hàng dữ liệu (hàng có <td>), và text từng ô.
   */
  function getTableDimensions(table) {
    const empty = { rows: 0, cols: 0, th: 0, td: 0, dataRows: 0, firstRowAllTh: false, matrix: [] };
    if (!table) return empty;
    const trs = Array.from(table.rows);
    const matrix = trs.map((tr) => Array.from(tr.cells).map((c) => c.textContent));
    let cols = 0, th = 0, td = 0, dataRows = 0;
    trs.forEach((tr) => {
      const cells = Array.from(tr.cells);
      cols = Math.max(cols, cells.reduce((sum, c) => sum + (c.colSpan || 1), 0));
      const t = cells.filter((c) => c.tagName === "TH").length;
      const d = cells.filter((c) => c.tagName === "TD").length;
      th += t; td += d;
      if (d > 0) dataRows++;
    });
    const first = trs[0] ? Array.from(trs[0].cells) : [];
    return {
      rows: trs.length, cols, th, td, dataRows,
      firstRowAllTh: first.length > 0 && first.every((c) => c.tagName === "TH"),
      matrix,
    };
  }

  function bestTable(doc) {
    const tables = Array.from(doc.querySelectorAll("table"));
    tables.sort((a, b) => a.querySelectorAll("td,th").length - b.querySelectorAll("td,th").length);
    return tables[tables.length - 1] || null;
  }

  function chk(ok, label, hint) {
    return { ok: !!ok, label, hint: hint || label };
  }

  function result(checks) {
    return {
      passed: checks.every((c) => c.ok),
      checks,
      errors: checks.filter((c) => !c.ok).map((c) => c.hint),
    };
  }

  /** Kiểm tra thẻ mở/đóng đủ (dành cho bài học: học sinh phải nhớ đóng thẻ). */
  function closeCheck(html, tags) {
    const src = (html || "").replace(/<!--[\s\S]*?-->/g, "");
    for (const tag of tags) {
      const opens = (src.match(new RegExp("<" + tag + "(?=[\\s>/])", "gi")) || []).length;
      const closes = (src.match(new RegExp("</" + tag + "\\s*>", "gi")) || []).length;
      if (opens !== closes) {
        return chk(false, "Mọi thẻ mở đều có thẻ đóng",
          `Thẻ <${tag}> mở ${opens} lần nhưng đóng ${closes} lần. Đừng quên thẻ đóng </${tag}>.`);
      }
    }
    return chk(true, "Mọi thẻ mở đều có thẻ đóng");
  }

  function hasText(doc, selector, text) {
    return Array.from(doc.querySelectorAll(selector)).some((el) => norm(el.textContent) === norm(text));
  }

  /* ---------- Validator theo từng kiến thức ---------- */

  /** opts: { exactH1, h1, h2, h3, strictClose } */
  function validateHeading(html, opts = {}) {
    const doc = parseHTML(html);
    const checks = [];
    const h1 = countElements(doc, "h1");
    if (opts.exactH1) checks.push(chk(h1 === 1, "Có đúng 1 thẻ <h1>", `Cần có đúng 1 thẻ <h1>, hiện em có ${h1} thẻ.`));
    else checks.push(chk(h1 >= 1, "Có thẻ <h1>", "Em chưa tạo thẻ <h1> cho tiêu đề chính."));
    if (opts.h1) checks.push(chk(hasText(doc, "h1", opts.h1), "Nội dung <h1> đúng yêu cầu", `Thẻ <h1> cần chứa dòng chữ: ${opts.h1}`));

    checks.push(chk(countElements(doc, "h2") >= 1, "Có thẻ <h2>", "Em chưa tạo thẻ <h2> cho tiêu đề cấp 2."));
    if (opts.h2) checks.push(chk(hasText(doc, "h2", opts.h2), "Nội dung <h2> đúng yêu cầu", `Thẻ <h2> cần chứa dòng chữ: ${opts.h2}`));

    if (opts.h3) {
      checks.push(chk(countElements(doc, "h3") >= 1, "Có thẻ <h3>", "Em chưa tạo thẻ <h3> cho tiêu đề cấp 3."));
      checks.push(chk(hasText(doc, "h3", opts.h3), "Nội dung <h3> đúng yêu cầu", `Thẻ <h3> cần chứa dòng chữ: ${opts.h3}`));
    }
    if (opts.strictClose) checks.push(closeCheck(html, opts.h3 ? ["h1", "h2", "h3"] : ["h1", "h2"]));
    return result(checks);
  }

  /** opts: { text, lines, minBr, minLines, minLen, strictClose } */
  function validateParagraph(html, opts = {}) {
    const doc = parseHTML(html);
    const ps = Array.from(doc.querySelectorAll("p"));
    const checks = [chk(ps.length >= 1, "Có thẻ <p>", "Em chưa đặt nội dung vào thẻ <p>.")];

    if (opts.text) {
      checks.push(chk(ps.some((p) => norm(p.textContent).includes(norm(opts.text))),
        "Nội dung đoạn văn đúng yêu cầu", `Đoạn văn trong <p> cần có nội dung: ${opts.text}`));
    }
    if (opts.lines) {
      const ok = ps.some((p) => {
        const lines = getLines(p).map(norm);
        return opts.lines.every((l) => lines.includes(norm(l)));
      });
      checks.push(chk(ok, "Mỗi dòng nằm trên một dòng riêng", "Hãy dùng <br> để tách các câu thành từng dòng như ví dụ."));
    }
    const brIn = countElements(doc, "p br");
    const minBr = opts.minBr || 0;
    if (minBr) {
      checks.push(chk(brIn >= minBr, `Có ít nhất ${minBr} thẻ <br> trong <p>`,
        `Trong thẻ <p> mới có ${brIn} thẻ <br>, cần ít nhất ${minBr}.`));
    }
    if (opts.minLines) {
      const best = Math.max(0, ...ps.map((p) => getLines(p).length));
      checks.push(chk(best >= opts.minLines, `Đoạn văn có ít nhất ${opts.minLines} dòng`,
        `Đoạn văn mới có ${best} dòng, cần ít nhất ${opts.minLines} dòng (các dòng cách nhau bằng <br>).`));
    }
    if (opts.minLen) {
      const best = Math.max(0, ...ps.map(getTextLength));
      checks.push(chk(best >= opts.minLen, `Đoạn văn có nội dung`, `Đoạn văn cần có nội dung (hiện ${best} ký tự).`));
    }
    if (opts.strictClose) checks.push(closeCheck(html, ["p"]));
    return result(checks);
  }

  /** Bài xuống dòng: <p> + <br>. */
  function validateBR(html, opts = {}) {
    return validateParagraph(html, Object.assign({ minBr: 1 }, opts));
  }

  /** Dùng chung cho <ul> và <ol>. opts: { minItems, items, headingText, strictClose } */
  function validateList(html, tag, opts = {}) {
    const doc = parseHTML(html);
    const other = tag === "ul" ? "ol" : "ul";
    const lists = Array.from(doc.querySelectorAll(tag));
    const best = bestList(doc, tag);
    const filled = best ? filledItems(best) : [];
    const min = opts.minItems || 1;
    const checks = [];

    if (opts.headingText) {
      const ok = hasText(doc, "h1,h2,h3,h4,h5,h6", opts.headingText);
      checks.push(chk(ok, "Có tiêu đề đúng yêu cầu", `Em cần tạo một tiêu đề (<h1>, <h2>…) với nội dung: ${opts.headingText}`));
    }
    const kind = tag === "ul" ? "không có thứ tự" : "có thứ tự";
    checks.push(chk(lists.length >= 1, `Có thẻ <${tag}>`,
      doc.querySelector(other)
        ? `Em đã dùng <${other}>, nhưng đề yêu cầu danh sách ${kind} nên cần dùng <${tag}>.`
        : `Em chưa tạo danh sách ${kind} bằng thẻ <${tag}>.`));
    if (lists.length >= 1) {
      checks.push(chk(filled.length >= min, `Có ít nhất ${min} thẻ <li> có nội dung`,
        `Em đã tạo danh sách <${tag}>, nhưng hiện mới có ${filled.length} mục. Hãy thêm ít nhất ${min - filled.length} thẻ <li> nữa.`));
    }
    const stray = Array.from(doc.querySelectorAll("li")).filter((li) => !li.closest("ul,ol")).length;
    if (stray) checks.push(chk(false, "Thẻ <li> nằm trong danh sách", `Có ${stray} thẻ <li> nằm ngoài <${tag}>. Các mục phải nằm trong thẻ <${tag}>.`));

    if (opts.items) {
      const texts = filled.map((li) => norm(li.textContent));
      const wrong = opts.items.findIndex((it, i) => texts[i] !== norm(it));
      checks.push(chk(wrong === -1, "Nội dung các mục đúng yêu cầu",
        wrong === -1 ? "" : `Mục thứ ${wrong + 1} cần có nội dung: ${opts.items[wrong]}`));
    }
    if (opts.strictClose) checks.push(closeCheck(html, [tag, "li"]));
    return result(checks);
  }

  const validateUL = (html, opts) => validateList(html, "ul", opts);
  const validateOL = (html, opts) => validateList(html, "ol", opts);

  /** opts: { minCols, minDataRows, minTh, minTd, headers, rows, strictClose } */
  function validateTable(html, opts = {}) {
    const doc = parseHTML(html);
    const table = bestTable(doc);
    const d = getTableDimensions(table);
    const checks = [chk(!!table, "Có thẻ <table>", "Em chưa tạo bảng bằng thẻ <table>.")];

    if (opts.minCols) checks.push(chk(d.cols >= opts.minCols, `Bảng có ≥ ${opts.minCols} cột`,
      `Bảng hiện có ${d.cols} cột, cần ít nhất ${opts.minCols} cột.`));
    if (opts.minTh) checks.push(chk(d.th >= opts.minTh, `Có ≥ ${opts.minTh} ô tiêu đề <th>`,
      `Mới có ${d.th} thẻ <th>, cần ít nhất ${opts.minTh}. Hàng đầu tiên nên dùng <th>.`));
    checks.push(chk(d.firstRowAllTh, "Hàng đầu là hàng tiêu đề (<th>)", "Hàng đầu tiên của bảng cần dùng các ô <th>."));
    if (opts.minDataRows) checks.push(chk(d.dataRows >= opts.minDataRows, `Có ≥ ${opts.minDataRows} hàng dữ liệu`,
      `Bảng mới có ${d.dataRows} hàng dữ liệu. Yêu cầu tối thiểu ${opts.minDataRows} hàng dữ liệu (hàng dùng <td>).`));
    if (opts.minTd) checks.push(chk(d.td >= opts.minTd, `Có ≥ ${opts.minTd} ô dữ liệu <td>`,
      `Mới có ${d.td} thẻ <td>, cần ít nhất ${opts.minTd}.`));

    if (opts.headers) {
      const first = (d.matrix[0] || []).map(norm);
      const wrong = opts.headers.findIndex((h, i) => first[i] !== norm(h));
      checks.push(chk(wrong === -1, "Tiêu đề các cột đúng yêu cầu",
        wrong === -1 ? "" : `Ô tiêu đề thứ ${wrong + 1} cần có nội dung: ${opts.headers[wrong]}`));
    }
    if (opts.rows) {
      const data = d.matrix.slice(1);
      const wrong = opts.rows.findIndex((row, r) => row.some((c, i) => norm((data[r] || [])[i]) !== norm(c)));
      checks.push(chk(wrong === -1, "Nội dung các ô đúng yêu cầu",
        wrong === -1 ? "" : `Hàng dữ liệu thứ ${wrong + 1} chưa đúng nội dung như quan sát.`));
    }
    if (opts.strictClose) checks.push(closeCheck(html, ["table", "tr", "th", "td"]));
    return result(checks);
  }

  /* ---------- Validator riêng cho bài LUYỆN TẬP ---------- */

  const validatePracticeHeading = (html) => validateHeading(html, {
    exactH1: true, h1: "NGÔI NHÀ TRONG MƠ CỦA TÔI", h2: "Những điều tôi mong muốn", strictClose: true,
  });
  const validatePracticeParagraph = (html) => validateParagraph(html, {
    minBr: 2, minLines: 3, minLen: 10, strictClose: true,
  });
  const validatePracticeUL = (html) => validateUL(html, {
    minItems: 4, headingText: "SỞ THÍCH CỦA TÔI", strictClose: true,
  });
  const validatePracticeOL = (html) => validateOL(html, { minItems: 4, strictClose: true });
  const validatePracticeTable = (html) => validateTable(html, {
    minCols: 3, minDataRows: 3, minTh: 3, minTd: 9,
    headers: ["Môn học", "Mục tiêu", "Việc cần làm"], strictClose: true,
  });

  /* ---------- Validator cho bài VẬN DỤNG ---------- */

  /** Trả về checklist 14 yêu cầu; mỗi mục có id để lưu vào requirements. */
  function validateFinalProject(html) {
    const doc = parseHTML(html);
    const h1 = countElements(doc, "h1");
    const h2 = countElements(doc, "h2");
    const ps = Array.from(doc.querySelectorAll("p"));
    const br = countElements(doc, "p br");
    const longestP = Math.max(0, ...ps.map(getTextLength));
    const ulItems = (bestList(doc, "ul") ? filledItems(bestList(doc, "ul")) : []).length;
    const olItems = (bestList(doc, "ol") ? filledItems(bestList(doc, "ol")) : []).length;
    const d = getTableDimensions(bestTable(doc));

    const items = [
      ["h1", chk(h1 >= 1, "Có <h1>", "Chưa có tiêu đề <h1> “Gửi tôi của 10 năm sau”.")],
      ["h2", chk(h2 >= 1, "Có các tiêu đề <h2>", "Chưa có tiêu đề <h2> cho các phần.")],
      ["p", chk(ps.length >= 1, "Có đoạn văn <p>", "Chưa có đoạn văn <p>.")],
      ["br", chk(br >= 2, "Có ít nhất 2 <br>", `Mới có ${br} thẻ <br> trong đoạn văn, cần ít nhất 2.`)],
      ["pLen", chk(longestP >= 50, "Đoạn nhắn gửi ≥ 50 ký tự", `Đoạn nhắn gửi mới có ${longestP} ký tự, cần ít nhất 50.`)],
      ["ul", chk(countElements(doc, "ul") >= 1, "Có <ul>", "Chưa có danh sách không thứ tự <ul>.")],
      ["ulLi", chk(ulItems >= 4, "Có ≥ 4 <li> trong ul", `Danh sách sở thích mới có ${ulItems} mục, cần ít nhất 4.`)],
      ["ol", chk(countElements(doc, "ol") >= 1, "Có <ol>", "Chưa có danh sách có thứ tự <ol>.")],
      ["olLi", chk(olItems >= 4, "Có ≥ 4 <li> trong ol", `Danh sách việc muốn làm mới có ${olItems} mục, cần ít nhất 4.`)],
      ["table", chk(countElements(doc, "table") >= 1, "Có <table>", "Chưa có bảng <table>.")],
      ["cols", chk(d.cols >= 3, "Bảng có ≥ 3 cột", `Bảng mới có ${d.cols} cột, cần ít nhất 3.`)],
      ["th", chk(d.th >= 3, "Có ≥ 3 <th>", `Bảng mới có ${d.th} ô tiêu đề <th>, cần ít nhất 3.`)],
      ["dataRows", chk(d.dataRows >= 3, "Có ≥ 3 hàng dữ liệu", `Bảng mới có ${d.dataRows} hàng dữ liệu, cần ít nhất 3.`)],
      ["td", chk(d.td >= 9, "Có ≥ 9 <td>", `Bảng mới có ${d.td} ô dữ liệu <td>, cần ít nhất 9.`)],
    ];
    const checks = items.map(([id, c]) => Object.assign(c, { id }));
    const res = result(checks);
    res.requirements = {};
    checks.forEach((c) => { res.requirements[c.id] = c.ok; });
    return res;
  }

  return {
    parseHTML, countElements, getTextLength, getTableDimensions, getLines,
    validateHeading, validateParagraph, validateBR, validateUL, validateOL, validateTable,
    validatePracticeHeading, validatePracticeParagraph, validatePracticeUL,
    validatePracticeOL, validatePracticeTable, validateFinalProject,
  };
})();
