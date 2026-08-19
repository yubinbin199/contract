/**
 * invoice.js
 * Invoice 明细页：从 URL 参数 #no=<单号>&contract=<合同ID> 读取要展示的发票，
 * 同时列出同一份合同下的其他发票，方便来回跳转。
 */

function $inv(id) {
  return document.getElementById(id);
}

function escInv(s) {
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 金额按币种格式化：JPY / TWD 不带小数 */
function fmtInvAmount(amount, currency) {
  var symbol = { USD: "$", JPY: "¥", CNY: "¥", TWD: "NT$" }[currency] || "";
  var digits = currency === "JPY" || currency === "TWD" ? 0 : 2;
  return (
    symbol +
    Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) +
    " " +
    currency
  );
}

/**
 * 参数同时支持 ?no=xx 与 #no=xx。
 * 部分静态服务器（如 serve 的 clean-URL 跳转）会在 .html -> 无后缀 的重定向里丢掉查询串，
 * hash 不受影响，所以链接统一用 hash，query 作为兼容保留。
 */
function queryParam(key) {
  var re = new RegExp("[?&#]" + key + "=([^&]*)");
  var m = re.exec(window.location.search) || re.exec(window.location.hash);
  return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
}

/** 一行「标签 - 值」 */
function row(label, value) {
  return (
    '<div class="inv-row"><span class="inv-label">' + escInv(label) + "</span>" +
    '<span class="inv-value">' + value + "</span></div>"
  );
}

function renderInvoice() {
  var no = queryParam("no");
  var contractId = queryParam("contract");
  var inv = findInvoice(no);

  // 返回按钮带上合同 ID，方便定位来源
  $inv("btn-back-contract").href = "index.html";

  if (!inv) {
    $inv("inv-title").textContent = "Invoice 不存在";
    $inv("inv-subtitle").textContent = no ? "找不到单号：" + no : "缺少单号参数";
    $inv("inv-detail").innerHTML =
      '<p class="hint">请从合同列表或合同表单里的「关联 Invoice」进入。</p>';
    return;
  }

  var contract = findContract2(inv.contractId);

  $inv("inv-title").textContent = "Invoice · " + inv.no;
  $inv("inv-subtitle").textContent =
    inv.title + "　|　关联合同：" + inv.contractId + (contract ? "（" + contract.name + "）" : "");

  $inv("inv-detail").innerHTML =
    '<div class="ct-section">' +
      '<div class="ct-section-title">Invoice</div>' +
      '<div class="inv-grid">' +
        row("Invoice No.", escInv(inv.no)) +
        row("状态", '<span class="inv-status ' + inv.status + '">' +
          escInv(INVOICE_STATUSES[inv.status] || inv.status) + "</span>") +
        row("摘要", escInv(inv.title)) +
        row("金额", '<b>' + escInv(fmtInvAmount(inv.amount, inv.currency)) + "</b>") +
        row("开票日期", escInv(inv.issueDate)) +
        row("到期日期", escInv(inv.dueDate)) +
        row("收款方", escInv(inv.payee)) +
        row("备注", escInv(inv.remark || "—")) +
      "</div>" +
    "</div>" +
    '<div class="ct-section">' +
      '<div class="ct-section-title">关联合同</div>' +
      '<div class="inv-grid">' +
        row("Contract ID", escInv(inv.contractId)) +
        row("Contract Name", escInv(contract ? contract.name : "—")) +
        row("Contract Type", escInv(contract ? contractTypeLabel(contract.type) : "—")) +
        row("原文件", contract && contract.sourceFile
          ? '<a class="ct-doc-link" href="' + escInv(contract.sourceFile.url) +
            '" target="_blank" rel="noopener">📄 ' + escInv(contract.sourceFile.name) + "</a>"
          : "—") +
      "</div>" +
    "</div>";

  // 同一合同下的其他发票
  var siblings = invoicesOfContract(inv.contractId).filter(function (x) {
    return x.no !== inv.no;
  });
  $inv("inv-siblings").innerHTML = siblings.length
    ? '<div class="ct-section">' +
        '<div class="ct-section-title">该合同的其他 Invoice</div>' +
        '<div class="table-wrap"><table class="data-table ct-table"><thead><tr>' +
          "<th>Invoice No.</th><th>摘要</th><th>金额</th><th>开票日期</th><th>状态</th>" +
        "</tr></thead><tbody>" +
        siblings
          .map(function (x) {
            return (
              "<tr><td>" +
              '<a class="ct-doc-link" href="invoice.html#no=' + encodeURIComponent(x.no) +
              "&contract=" + encodeURIComponent(x.contractId) + '">' + escInv(x.no) + "</a></td>" +
              "<td>" + escInv(x.title) + "</td>" +
              '<td class="num">' + escInv(fmtInvAmount(x.amount, x.currency)) + "</td>" +
              "<td>" + escInv(x.issueDate) + "</td>" +
              '<td><span class="inv-status ' + x.status + '">' +
                escInv(INVOICE_STATUSES[x.status] || x.status) + "</span></td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>" +
      "</div>"
    : "";
}

/** 本页不加载 contract.js，按 ID 找合同的小工具单独实现一份 */
function findContract2(id) {
  for (var i = 0; i < CONTRACTS.length; i++) {
    if (CONTRACTS[i].id === id) return CONTRACTS[i];
  }
  return null;
}

renderInvoice();

// 同页切换其他 invoice 时只变 hash，不会重新加载页面，需要手动重绘
window.addEventListener("hashchange", renderInvoice);
