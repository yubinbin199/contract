/**
 * contract-data.js
 * 合同表单的静态字典与演示数据。
 * 数据只在浏览器内存里，页面刷新后回到初始状态。
 */

/** 5 种合同类型；revenueSplit 标记该类型的 Amount 区块用「分成」字段 */
var CONTRACT_TYPES = [
  { value: "software_dev", label: "Software Development", revenueSplit: false },
  { value: "ip_license", label: "IP License", revenueSplit: false },
  { value: "distribution", label: "Distribution Service", revenueSplit: false },
  { value: "revenue_sharing", label: "Revenue Sharing", revenueSplit: true },
  { value: "other", label: "Other", revenueSplit: false },
];

var CONTRACT_REGIONS = ["JP", "CN", "TW", "US", "GLOBAL"];

var CONTRACT_CURRENCIES = ["USD", "JPY", "CNY", "TWD"];

var CONTRACT_STATUSES = [
  { value: "draft", label: "草稿" },
  { value: "pending", label: "待审批" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
];

var LEGAL_ROLES = [
  "Client",
  "Service Provider",
  "Licensor",
  "Licensee",
  "Distributor",
  "Publisher",
];

/** 是否分成类合同 */
function isRevenueSplitType(typeValue) {
  for (var i = 0; i < CONTRACT_TYPES.length; i++) {
    if (CONTRACT_TYPES[i].value === typeValue) return CONTRACT_TYPES[i].revenueSplit;
  }
  return false;
}

/** 类型英文名 */
function contractTypeLabel(typeValue) {
  for (var i = 0; i < CONTRACT_TYPES.length; i++) {
    if (CONTRACT_TYPES[i].value === typeValue) return CONTRACT_TYPES[i].label;
  }
  return "—";
}

/** 状态中文名 */
function contractStatusLabel(statusValue) {
  for (var i = 0; i < CONTRACT_STATUSES.length; i++) {
    if (CONTRACT_STATUSES[i].value === statusValue) return CONTRACT_STATUSES[i].label;
  }
  return "—";
}

/**
 * 演示合同列表
 * amountMode: "total"（总额）| "split"（分成），与合同类型保持一致
 */
var CONTRACTS = [
  {
    id: "DR4188716",
    name: "Adobe Creative Cloud 法人契約",
    type: "software_dev",
    region: "JP",
    status: "pending",
    signDate: "2026-05-01",
    endDate: "2027-05-18",
    effectiveDate: "2026-05-18",
    serviceStart: "2026-05-18",
    serviceEnd: "2027-05-18",
    amountMode: "total",
    totalAmount: 18420,
    currency: "USD",
    splitRatio: null,
    splitBase: "",
    settleCycle: "",
    partyA: {
      company: "CTW INC",
      role: "Client",
      address: "1-9-10 ROPPONGI, MINATO-KU, TOKYO-TO, 1060032, JAPAN",
      contact: "Liao Wei",
      email: "liao@ctw.inc",
    },
    partyB: {
      company: "Adobe",
      role: "Service Provider",
      address: "Adobe Systems Software Ireland Limited（ADIR）",
      contact: "",
      email: "xxxxx@mail.com",
    },
    createdBy: { name: "Liao Wei", at: "2026-05-02 09:14:27" },
    submitter: { name: "Liao Wei", dept: "IT", date: "2026-05-02" },
    remark: "年度订阅，自动续约需提前 30 天通知。",
  },
  {
    id: "DR4188742",
    name: "G123 平台游戏分成协议",
    type: "revenue_sharing",
    region: "JP",
    status: "approved",
    signDate: "2026-03-10",
    endDate: "2029-03-31",
    effectiveDate: "2026-04-01",
    serviceStart: "2026-04-01",
    serviceEnd: "2029-03-31",
    amountMode: "split",
    totalAmount: null,
    currency: "USD",
    splitRatio: 12,
    splitBase: "净收入（扣除渠道费与退款）",
    settleCycle: "monthly",
    partyA: {
      company: "CTW INC",
      role: "Publisher",
      address: "1-9-10 ROPPONGI, MINATO-KU, TOKYO-TO, 1060032, JAPAN",
      contact: "Sato Kenji",
      email: "sato@ctw.inc",
    },
    partyB: {
      company: "Studio Aoi Co., Ltd.",
      role: "Service Provider",
      address: "2-4-1 SHIBUYA, SHIBUYA-KU, TOKYO-TO, JAPAN",
      contact: "Aoi Mei",
      email: "mei@studio-aoi.jp",
    },
    createdBy: { name: "Sato Kenji", at: "2026-03-11 14:02:08" },
    submitter: { name: "Sato Kenji", dept: "事业开发", date: "2026-03-11" },
    remark: "按月结算，次月 15 日前出账。",
  },
  {
    id: "DR4188755",
    name: "Unity Pro 企业授权",
    type: "ip_license",
    region: "GLOBAL",
    status: "approved",
    signDate: "2026-01-15",
    endDate: "2027-01-14",
    effectiveDate: "2026-01-15",
    serviceStart: "2026-01-15",
    serviceEnd: "2027-01-14",
    amountMode: "total",
    totalAmount: 46800,
    currency: "USD",
    splitRatio: null,
    splitBase: "",
    settleCycle: "",
    partyA: {
      company: "CTW INC",
      role: "Licensee",
      address: "1-9-10 ROPPONGI, MINATO-KU, TOKYO-TO, 1060032, JAPAN",
      contact: "Liao Wei",
      email: "liao@ctw.inc",
    },
    partyB: {
      company: "Unity Technologies",
      role: "Licensor",
      address: "30 3rd St, San Francisco, CA 94103, USA",
      contact: "—",
      email: "sales@unity.com",
    },
    createdBy: { name: "Liao Wei", at: "2026-01-16 10:37:51" },
    submitter: { name: "Liao Wei", dept: "IT", date: "2026-01-16" },
    remark: "",
  },
  {
    id: "DR4188768",
    name: "台湾地区发行代理合同",
    type: "distribution",
    region: "TW",
    status: "pending",
    signDate: "2026-06-01",
    endDate: "2028-05-31",
    effectiveDate: "2026-06-15",
    serviceStart: "2026-06-15",
    serviceEnd: "2028-05-31",
    amountMode: "total",
    totalAmount: 3200000,
    currency: "TWD",
    splitRatio: null,
    splitBase: "",
    settleCycle: "",
    partyA: {
      company: "CTW INC",
      role: "Client",
      address: "1-9-10 ROPPONGI, MINATO-KU, TOKYO-TO, 1060032, JAPAN",
      contact: "Chen Yu",
      email: "chen@ctw.inc",
    },
    partyB: {
      company: "宏昇數位股份有限公司",
      role: "Distributor",
      address: "台北市信義區松高路 11 號",
      contact: "林怡君",
      email: "lin@hongsheng.tw",
    },
    createdBy: { name: "Chen Yu", at: "2026-06-02 16:45:03" },
    submitter: { name: "Chen Yu", dept: "海外发行", date: "2026-06-02" },
    remark: "",
  },
  {
    id: "DR4188771",
    name: "IP 角色形象二次授权（周边）",
    type: "revenue_sharing",
    region: "CN",
    status: "draft",
    signDate: "2026-07-08",
    endDate: "2028-07-07",
    effectiveDate: "2026-08-01",
    serviceStart: "2026-08-01",
    serviceEnd: "2028-07-07",
    amountMode: "split",
    totalAmount: null,
    currency: "CNY",
    splitRatio: 8.5,
    splitBase: "周边商品出厂价流水",
    settleCycle: "quarterly",
    partyA: {
      company: "CTW INC",
      role: "Licensor",
      address: "1-9-10 ROPPONGI, MINATO-KU, TOKYO-TO, 1060032, JAPAN",
      contact: "Wang Lei",
      email: "wang@ctw.inc",
    },
    partyB: {
      company: "上海羽澜文化传播有限公司",
      role: "Licensee",
      address: "上海市黄浦区中山南路 100 号",
      contact: "周敏",
      email: "zhou@yulan.cn",
    },
    createdBy: { name: "Wang Lei", at: "2026-07-09 11:20:36" },
    submitter: { name: "Wang Lei", dept: "IP 商务", date: "2026-07-09" },
    remark: "季度结算，需提供第三方销售报表。",
  },
  {
    id: "DR4188783",
    name: "后台管理系统外包开发",
    type: "software_dev",
    region: "CN",
    status: "rejected",
    signDate: "2026-02-20",
    endDate: "2026-11-30",
    effectiveDate: "2026-03-01",
    serviceStart: "2026-03-01",
    serviceEnd: "2026-11-30",
    amountMode: "total",
    totalAmount: 860000,
    currency: "CNY",
    splitRatio: null,
    splitBase: "",
    settleCycle: "",
    partyA: {
      company: "CTW INC",
      role: "Client",
      address: "1-9-10 ROPPONGI, MINATO-KU, TOKYO-TO, 1060032, JAPAN",
      contact: "Zhang Hao",
      email: "zhang@ctw.inc",
    },
    partyB: {
      company: "杭州云启软件有限公司",
      role: "Service Provider",
      address: "杭州市西湖区文三路 259 号",
      contact: "刘洋",
      email: "liu@yunqi.cn",
    },
    createdBy: { name: "Zhang Hao", at: "2026-02-21 08:56:19" },
    submitter: { name: "Zhang Hao", dept: "研发中心", date: "2026-02-21" },
    remark: "驳回原因：付款节点与验收条款不匹配，需重新拟定。",
  },
  {
    id: "DR4188790",
    name: "北美渠道分成协议",
    type: "revenue_sharing",
    region: "US",
    status: "pending",
    signDate: "2026-04-18",
    endDate: "2027-04-17",
    effectiveDate: "2026-05-01",
    serviceStart: "2026-05-01",
    serviceEnd: "2027-04-17",
    amountMode: "split",
    totalAmount: null,
    currency: "USD",
    splitRatio: 30,
    splitBase: "平台流水（Gross Revenue）",
    settleCycle: "monthly",
    partyA: {
      company: "CTW INC",
      role: "Publisher",
      address: "1-9-10 ROPPONGI, MINATO-KU, TOKYO-TO, 1060032, JAPAN",
      contact: "Emily Carter",
      email: "emily@ctw.inc",
    },
    partyB: {
      company: "Northgate Media LLC",
      role: "Distributor",
      address: "555 W 57th St, New York, NY 10019, USA",
      contact: "David Kim",
      email: "david@northgate.com",
    },
    createdBy: { name: "Emily Carter", at: "2026-04-19 13:08:44" },
    submitter: { name: "Emily Carter", dept: "海外发行", date: "2026-04-19" },
    remark: "",
  },
  {
    id: "DR4188802",
    name: "办公场地保洁服务",
    type: "other",
    region: "JP",
    status: "approved",
    signDate: "2026-01-05",
    endDate: "2026-12-31",
    effectiveDate: "2026-01-05",
    serviceStart: "2026-01-05",
    serviceEnd: "2026-12-31",
    amountMode: "total",
    totalAmount: 2640000,
    currency: "JPY",
    splitRatio: null,
    splitBase: "",
    settleCycle: "",
    partyA: {
      company: "CTW INC",
      role: "Client",
      address: "1-9-10 ROPPONGI, MINATO-KU, TOKYO-TO, 1060032, JAPAN",
      contact: "Tanaka Yui",
      email: "tanaka@ctw.inc",
    },
    partyB: {
      company: "サンクリーン株式会社",
      role: "Service Provider",
      address: "東京都港区赤坂 3-2-1",
      contact: "田中 一郎",
      email: "tanaka@suncleen.jp",
    },
    createdBy: { name: "Tanaka Yui", at: "2026-01-06 09:03:12" },
    submitter: { name: "Tanaka Yui", dept: "总务", date: "2026-01-06" },
    remark: "",
  },
];
