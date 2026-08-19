# 合同管理页面

原生 HTML / CSS / JS，无构建步骤。

## 本地预览

```bash
npm run start
```

打开 http://localhost:3000

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | 列表视图 + 表单视图 |
| `contract.js` | 筛选 / 搜索 / 排序、表单回填与校验 |
| `contract-data.js` | 合同类型字典与演示数据（内存态，刷新即还原） |
| `contract.css` | 合同页与 Invoice 页样式 |
| `styles.css` | 基础样式（面板、表格、筛选控件等公共组件） |
| `invoice.html` / `invoice.js` | Invoice 明细页，从合同的「关联 Invoice」跳入 |
| `files/*.pdf` | 各合同的原文件（演示用示例 PDF） |

## 功能

- **列表**：按合同类型 / Region / 状态 / Currency / Legal role / Effective 日期区间筛选，关键词搜索覆盖合同名、ID、甲乙方公司与角色、地址、联系人、邮箱、金额、分成比例、创建人、原文件名、Invoice 单号，命中处高亮；多列可点表头排序
- **表单**：Basic / Dates / Amount / Party A / Party B / Submitter 分区，点击列表任意一行进入
- **Revenue Sharing**：Amount 区块切换为 Revenue Split + Split Ratio + 结算周期 + 分成基数，其余类型为 Total Amount；Currency 是两种类型共用的独立字段
- **原文件**：列表与表单均可打开该合同的 PDF
- **关联 Invoice**：点击跳转 `invoice.html#no=<单号>`，展示发票明细、关联合同以及同合同下的其他发票

> 参数用 hash 而非 query：静态托管常把 `/invoice.html` 301 到 `/invoice` 并丢掉查询串，hash 不受影响。
