/**
 * contract.js
 * 负责：
 *  1) 合同列表：筛选（类型 / 地区 / 状态 / 币种 / 角色 / 生效日期区间）+ 关键词搜索 + 表头排序
 *  2) 合同表单：Basic / Dates / Amount / Party A / Party B / Submitter
 *     Amount 区块随合同类型切换 —— Revenue Sharing 显示 Revenue Split + Split Ratio，
 *     其余类型显示 Total Amount；Currency 是独立字段，两种类型都要填
 */

// ---------- 状态 ----------

var filterState = {
  type: "",
  region: "",
  status: "",
  currency: "",
  role: "",
  effFrom: "",
  effTo: "",
  search: "",
};

var sortState = { key: "effectiveDate", dir: -1 };

var editingId = null; // 当前正在编辑的合同 ID

// ---------- 工具 ----------

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 把搜索命中的片段包上高亮 */
function highlight(text, keyword) {
  var safe = escapeHtml(text);
  if (!keyword) return safe;
  var kw = escapeHtml(keyword).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(kw, "gi"), function (m) {
    return '<span class="ct-hit">' + m + "</span>";
  });
}

/**
 * Amount 展示：分成合同固定为 Revenue Split（比例见 Split Ratio 列），
 * 总额合同只展示金额本身，币种由独立的 Currency 列承载。
 */
function amountText(c) {
  if (c.amountMode === "split") return "Revenue Split";
  if (c.totalAmount === null || c.totalAmount === undefined) return "—";
  var symbol = { USD: "$", JPY: "¥", CNY: "¥", TWD: "NT$" }[c.currency] || "";
  var digits = c.currency === "JPY" || c.currency === "TWD" ? 0 : 2;
  return (
    symbol +
    Number(c.totalAmount).toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

/** Split Ratio 展示：只有分成合同有值 */
function splitRatioText(c) {
  if (c.amountMode !== "split") return "—";
  return c.splitRatio === null || c.splitRatio === undefined ? "—" : c.splitRatio + "%";
}

/** 排序用的可比较值 */
function sortValue(c, key) {
  if (key === "amount") {
    // 分成合同没有总额，用 -1 让它们排在金额之前，不与金额混排
    return c.amountMode === "split" ? -1 : Number(c.totalAmount || 0);
  }
  if (key === "splitRatio") {
    return c.amountMode === "split" ? Number(c.splitRatio || 0) : -1;
  }
  if (key === "type") return contractTypeLabel(c.type);
  if (key === "status") return contractStatusLabel(c.status);
  if (key === "partyA") return c.partyA.company;
  if (key === "partyB") return c.partyB.company;
  if (key === "createdAt") return c.createdBy.at;
  return c[key] === null || c[key] === undefined ? "" : c[key];
}

var toastTimer = null;

function toast(msg) {
  var el = $("ct-toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    el.hidden = true;
  }, 2200);
}

// ---------- 下拉选项 ----------

function fillSelect(el, items, placeholder) {
  var html = placeholder === undefined ? "" : '<option value="">' + placeholder + "</option>";
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var value = typeof it === "string" ? it : it.value;
    var label = typeof it === "string" ? it : it.label;
    html += '<option value="' + escapeHtml(value) + '">' + escapeHtml(label) + "</option>";
  }
  el.innerHTML = html;
}

function setupOptions() {
  fillSelect($("f-role"), LEGAL_ROLES, "全部");
  fillSelect($("f-type"), CONTRACT_TYPES, "全部");
  fillSelect($("f-region"), CONTRACT_REGIONS, "全部");
  fillSelect($("f-status"), CONTRACT_STATUSES, "全部");
  fillSelect($("f-currency"), CONTRACT_CURRENCIES, "全部");

  fillSelect($("fm-type"), CONTRACT_TYPES, "请选择");
  fillSelect($("fm-region"), CONTRACT_REGIONS, "请选择");
  fillSelect($("fm-currency"), CONTRACT_CURRENCIES, "请选择");
  fillSelect($("fm-a-role"), LEGAL_ROLES, "请选择");
  fillSelect($("fm-b-role"), LEGAL_ROLES, "请选择");
}

// ---------- 列表：筛选 / 搜索 / 排序 ----------

/** 一份合同参与关键词搜索的所有文本 */
function searchableText(c) {
  return [
    c.id,
    c.name,
    contractTypeLabel(c.type),
    c.region,
    contractStatusLabel(c.status),
    c.partyA.company,
    c.partyA.role,
    c.partyA.address,
    c.partyA.contact,
    c.partyA.email,
    c.partyB.company,
    c.partyB.role,
    c.partyB.address,
    c.partyB.contact,
    c.partyB.email,
    c.currency,
    c.totalAmount,
    c.splitRatio === null ? "" : c.splitRatio + "%",
    c.splitBase,
    c.createdBy.name,
    c.createdBy.at,
    c.submitter.name,
    c.submitter.dept,
    c.remark,
  ]
    .join(" ")
    .toLowerCase();
}

function applyFilters() {
  var kw = filterState.search.trim().toLowerCase();

  var rows = CONTRACTS.filter(function (c) {
    if (filterState.type && c.type !== filterState.type) return false;
    if (filterState.region && c.region !== filterState.region) return false;
    if (filterState.status && c.status !== filterState.status) return false;
    if (filterState.currency && c.currency !== filterState.currency) return false;
    // Legal role：甲方或乙方任一方命中即算符合
    if (
      filterState.role &&
      c.partyA.role !== filterState.role &&
      c.partyB.role !== filterState.role
    ) {
      return false;
    }
    // 生效日期区间：ISO 日期字符串可直接比较
    if (filterState.effFrom && c.effectiveDate < filterState.effFrom) return false;
    if (filterState.effTo && c.effectiveDate > filterState.effTo) return false;
    if (kw && searchableText(c).indexOf(kw) === -1) return false;
    return true;
  });

  rows.sort(function (a, b) {
    var va = sortValue(a, sortState.key);
    var vb = sortValue(b, sortState.key);
    if (va === vb) return a.id < b.id ? -1 : 1;
    return (va > vb ? 1 : -1) * sortState.dir;
  });

  return rows;
}

/** 当前生效的筛选条件，展示成小胶囊 */
function renderChips() {
  var chips = [];
  if (filterState.type) chips.push("类型：" + contractTypeLabel(filterState.type));
  if (filterState.region) chips.push("地区：" + filterState.region);
  if (filterState.status) chips.push("状态：" + contractStatusLabel(filterState.status));
  if (filterState.currency) chips.push("币种：" + filterState.currency);
  if (filterState.role) chips.push("角色：" + filterState.role);
  if (filterState.effFrom || filterState.effTo) {
    chips.push("生效：" + (filterState.effFrom || "不限") + " ~ " + (filterState.effTo || "不限"));
  }
  if (filterState.search.trim()) chips.push("搜索：" + filterState.search.trim());

  $("ct-chips").innerHTML = chips
    .map(function (t) {
      return '<span class="ct-chip">' + escapeHtml(t) + "</span>";
    })
    .join("");
}

function renderList() {
  var rows = applyFilters();
  var kw = filterState.search.trim();

  $("ct-count").textContent = "共 " + rows.length + " / " + CONTRACTS.length + " 份合同";
  renderChips();

  if (!rows.length) {
    $("ct-body").innerHTML =
      '<tr class="ct-empty"><td colspan="20">没有符合条件的合同，试试放宽筛选条件</td></tr>';
    return;
  }

  /** 甲方 / 乙方各占 5 个单元格：公司、角色、地址、联系人、Contact Info */
  function partyCells(p) {
    return (
      '<td><b class="ct-company">' + highlight(p.company, kw) + "</b></td>" +
      "<td>" + highlight(p.role || "—", kw) + "</td>" +
      '<td><span class="ct-address" title="' + escapeHtml(p.address) + '">' +
        highlight(p.address || "—", kw) + "</span></td>" +
      "<td>" + highlight(p.contact || "—", kw) + "</td>" +
      "<td>" + highlight(p.email || "—", kw) + "</td>"
    );
  }

  $("ct-body").innerHTML = rows
    .map(function (c) {
      return (
        '<tr data-id="' + escapeHtml(c.id) + '">' +
        "<td>" + highlight(c.id, kw) + "</td>" +
        '<td><span class="ct-name" title="' + escapeHtml(c.name) + '">' +
          highlight(c.name, kw) + "</span></td>" +
        '<td><span class="ct-tag ' + c.type + '">' + escapeHtml(contractTypeLabel(c.type)) + "</span></td>" +
        '<td class="num">' +
          (c.amountMode === "split"
            ? '<span class="ct-split-tag">Revenue Split</span>'
            : highlight(amountText(c), kw)) +
          "</td>" +
        "<td>" + highlight(c.currency, kw) + "</td>" +
        '<td class="num">' + highlight(splitRatioText(c), kw) + "</td>" +
        "<td>" + escapeHtml(c.region) + "</td>" +
        partyCells(c.partyA) +
        partyCells(c.partyB) +
        "<td>" + escapeHtml(c.effectiveDate) + "</td>" +
        "<td>" + escapeHtml(c.endDate) + "</td>" +
        "<td>" + highlight(c.createdBy.name, kw) +
          '<span class="ct-sub">' + highlight(c.createdBy.at, kw) + "</span></td>" +
        "</tr>"
      );
    })
    .join("");
}

function setupListEvents() {
  var bind = [
    ["f-type", "type", "change"],
    ["f-region", "region", "change"],
    ["f-status", "status", "change"],
    ["f-currency", "currency", "change"],
    ["f-role", "role", "change"],
    ["f-eff-from", "effFrom", "change"],
    ["f-eff-to", "effTo", "change"],
    ["f-search", "search", "input"],
  ];

  bind.forEach(function (item) {
    $(item[0]).addEventListener(item[2], function () {
      filterState[item[1]] = this.value;
      renderList();
    });
  });

  $("btn-reset-filter").addEventListener("click", function () {
    filterState = {
      type: "",
      region: "",
      status: "",
      currency: "",
      role: "",
      effFrom: "",
      effTo: "",
      search: "",
    };
    bind.forEach(function (item) {
      $(item[0]).value = "";
    });
    renderList();
  });

  // 表头排序：点同一列切换升降序
  var ths = document.querySelectorAll(".ct-table .sortable-th");
  for (var i = 0; i < ths.length; i++) {
    ths[i].addEventListener("click", function () {
      var key = this.getAttribute("data-sort-key");
      if (sortState.key === key) {
        sortState.dir = -sortState.dir;
      } else {
        sortState.key = key;
        sortState.dir = 1;
      }
      renderList();
    });
  }

  // 整行点击进入表单
  $("ct-body").addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-id]");
    if (!tr) return;
    openForm(tr.getAttribute("data-id"));
  });
}

// ---------- 表单 ----------

/** 按合同类型切换 Amount 区块内的字段（Currency 与类型无关，始终显示） */
function syncAmountSection() {
  var isSplit = isRevenueSplitType($("fm-type").value);
  $("field-total-amount").hidden = isSplit;
  $("field-split-placeholder").hidden = !isSplit;
  $("field-split-ratio").hidden = !isSplit;
  $("field-settle-cycle").hidden = !isSplit;
  $("field-split-base").hidden = !isSplit;
  $("amount-mode-tag").textContent = isSplit ? "分成合同" : "总额合同";
  $("amount-hint").textContent = isSplit
    ? "Revenue Sharing 合同不填固定总额，按约定比例对分成基数分账，金额随实际流水结算。"
    : "填写合同总金额与币种；金额为含税总额时请在备注中注明。";
}

/** 按 ID 找合同 */
function findContract(id) {
  for (var i = 0; i < CONTRACTS.length; i++) {
    if (CONTRACTS[i].id === id) return CONTRACTS[i];
  }
  return null;
}

/** 打开某份合同的表单（只从列表行进入） */
function openForm(id) {
  var c = findContract(id);
  if (!c) return;
  editingId = id;

  $("form-title").textContent = "Summary · " + c.id;
  $("form-subtitle").textContent =
    contractTypeLabel(c.type) + " · " + c.region + " · " + contractStatusLabel(c.status);
  $("form-error").textContent = "";

  $("fm-name").value = c.name;
  $("fm-id").value = c.id;
  $("fm-type").value = c.type;
  $("fm-region").value = c.region;
  $("fm-sign-date").value = c.signDate;
  $("fm-end-date").value = c.endDate;
  $("fm-effective-date").value = c.effectiveDate;
  $("fm-service-start").value = c.serviceStart;
  $("fm-service-end").value = c.serviceEnd;
  $("fm-total-amount").value = c.totalAmount === null ? "" : c.totalAmount;
  $("fm-currency").value = c.currency;
  $("fm-split-ratio").value = c.splitRatio === null ? "" : c.splitRatio;
  $("fm-settle-cycle").value = c.settleCycle || "";
  $("fm-split-base").value = c.splitBase || "";
  $("fm-a-company").value = c.partyA.company;
  $("fm-a-role").value = c.partyA.role;
  $("fm-a-address").value = c.partyA.address;
  $("fm-a-contact").value = c.partyA.contact;
  $("fm-a-email").value = c.partyA.email;
  $("fm-b-company").value = c.partyB.company;
  $("fm-b-role").value = c.partyB.role;
  $("fm-b-address").value = c.partyB.address;
  $("fm-b-contact").value = c.partyB.contact;
  $("fm-b-email").value = c.partyB.email;
  $("fm-created-by").value = c.createdBy.name + "　" + c.createdBy.at;
  $("fm-submitter").value = c.submitter.name;
  $("fm-dept").value = c.submitter.dept;
  $("fm-submit-date").value = c.submitter.date;
  $("fm-remark").value = c.remark || "";

  syncAmountSection();
  clearInvalid();
  $("view-list").classList.remove("active");
  $("view-form").classList.add("active");
  window.scrollTo(0, 0);
}

function backToList() {
  $("view-form").classList.remove("active");
  $("view-list").classList.add("active");
  renderList();
}

function clearInvalid() {
  var marked = document.querySelectorAll(".ct-form .invalid");
  for (var i = 0; i < marked.length; i++) {
    marked[i].classList.remove("invalid");
  }
}

function markInvalid(el) {
  var label = el.closest("label");
  if (label) label.classList.add("invalid");
}

/**
 * 校验表单。
 * 必填项随合同类型变化：分成合同校验比例与结算周期，总额合同校验金额。
 */
function validateForm() {
  clearInvalid();
  var errors = [];
  var isSplit = isRevenueSplitType($("fm-type").value);

  var required = [
    ["fm-name", "Contract Name"],
    ["fm-id", "Contract ID"],
    ["fm-type", "Contract Type"],
    ["fm-region", "Region"],
    ["fm-sign-date", "Sign date"],
    ["fm-end-date", "End date"],
    ["fm-effective-date", "Effective Date"],
    ["fm-service-start", "Service Period 开始"],
    ["fm-service-end", "Service Period 结束"],
    ["fm-a-company", "Party A Company name"],
    ["fm-a-role", "Party A Legal role"],
    ["fm-b-company", "Party B Company name"],
    ["fm-b-role", "Party B Legal role"],
    ["fm-submitter", "提交人"],
  ];

  required.push(["fm-currency", "Currency"]);
  if (isSplit) {
    required.push(["fm-split-ratio", "Split Ratio"]);
    required.push(["fm-settle-cycle", "结算周期"]);
  } else {
    required.push(["fm-total-amount", "Total Amount"]);
  }

  required.forEach(function (item) {
    var el = $(item[0]);
    if (!String(el.value).trim()) {
      markInvalid(el);
      errors.push(item[1] + " 必填");
    }
  });

  if (isSplit) {
    var ratio = Number($("fm-split-ratio").value);
    if ($("fm-split-ratio").value && (ratio <= 0 || ratio > 100)) {
      markInvalid($("fm-split-ratio"));
      errors.push("Split Ratio 需在 0 ~ 100 之间");
    }
  } else if ($("fm-total-amount").value && Number($("fm-total-amount").value) < 0) {
    markInvalid($("fm-total-amount"));
    errors.push("Total Amount 不能为负");
  }

  var start = $("fm-service-start").value;
  var end = $("fm-service-end").value;
  if (start && end && start > end) {
    markInvalid($("fm-service-end"));
    errors.push("Service Period 结束日期不能早于开始日期");
  }
  if ($("fm-sign-date").value && $("fm-end-date").value && $("fm-sign-date").value > $("fm-end-date").value) {
    markInvalid($("fm-end-date"));
    errors.push("End date 不能早于 Sign date");
  }

  // 改动 Contract ID 时不允许与已有合同重号
  var id = $("fm-id").value.trim();
  if (id && id !== editingId) {
    for (var i = 0; i < CONTRACTS.length; i++) {
      if (CONTRACTS[i].id === id) {
        markInvalid($("fm-id"));
        errors.push("Contract ID 已存在：" + id);
        break;
      }
    }
  }

  $("form-error").textContent = errors.length ? errors.join("；") : "";
  return errors.length === 0;
}

/** 读表单 → 合同对象 */
function collectForm(status) {
  var isSplit = isRevenueSplitType($("fm-type").value);
  var current = findContract(editingId);
  return {
    id: $("fm-id").value.trim(),
    name: $("fm-name").value.trim(),
    type: $("fm-type").value,
    region: $("fm-region").value,
    status: status,
    signDate: $("fm-sign-date").value,
    endDate: $("fm-end-date").value,
    effectiveDate: $("fm-effective-date").value,
    serviceStart: $("fm-service-start").value,
    serviceEnd: $("fm-service-end").value,
    amountMode: isSplit ? "split" : "total",
    totalAmount: isSplit ? null : Number($("fm-total-amount").value),
    currency: $("fm-currency").value,
    splitRatio: isSplit ? Number($("fm-split-ratio").value) : null,
    splitBase: isSplit ? $("fm-split-base").value.trim() : "",
    settleCycle: isSplit ? $("fm-settle-cycle").value : "",
    partyA: {
      company: $("fm-a-company").value.trim(),
      role: $("fm-a-role").value,
      address: $("fm-a-address").value.trim(),
      contact: $("fm-a-contact").value.trim(),
      email: $("fm-a-email").value.trim(),
    },
    partyB: {
      company: $("fm-b-company").value.trim(),
      role: $("fm-b-role").value,
      address: $("fm-b-address").value.trim(),
      contact: $("fm-b-contact").value.trim(),
      email: $("fm-b-email").value.trim(),
    },
    // 创建人信息由系统记录，表单只读展示，保存时原样带回
    createdBy: {
      name: current ? current.createdBy.name : "",
      at: current ? current.createdBy.at : "",
    },
    submitter: {
      name: $("fm-submitter").value.trim(),
      dept: $("fm-dept").value.trim(),
      date: $("fm-submit-date").value,
    },
    remark: $("fm-remark").value.trim(),
  };
}

function saveContract(status, successMsg) {
  if (!validateForm()) {
    window.scrollTo(0, document.body.scrollHeight);
    return;
  }
  var data = collectForm(status);
  for (var i = 0; i < CONTRACTS.length; i++) {
    if (CONTRACTS[i].id === editingId) CONTRACTS[i] = data;
  }
  toast(successMsg);
  backToList();
}

function setupFormEvents() {
  $("fm-type").addEventListener("change", syncAmountSection);
  $("btn-back-list").addEventListener("click", backToList);

  $("btn-save").addEventListener("click", function () {
    saveContract("draft", "已保存草稿");
  });

  $("btn-approve").addEventListener("click", function () {
    saveContract("approved", "已通过并流转财务（Approve to F）");
  });

  $("btn-reject").addEventListener("click", function () {
    for (var i = 0; i < CONTRACTS.length; i++) {
      if (CONTRACTS[i].id === editingId) CONTRACTS[i].status = "rejected";
    }
    toast("已驳回");
    backToList();
  });

  // Party A / Party B 折叠
  var toggles = document.querySelectorAll(".ct-toggle");
  for (var i = 0; i < toggles.length; i++) {
    toggles[i].addEventListener("click", function () {
      this.closest(".ct-collapsible").classList.toggle("collapsed");
    });
  }
}

// ---------- 启动 ----------

setupOptions();
setupListEvents();
setupFormEvents();
renderList();
