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
| `contract-data.js` | 合同字典与演示数据（内存态，刷新即还原） |
| `contract.css` | 合同页样式 |
| `styles.css` | 基础样式（面板、表格、筛选控件等公共组件） |
| `files/*.pdf` | 各合同的原文件（演示用示例 PDF） |

## 功能

- **列表**：按 Contract Action / 合同类型 / Region / Currency / Legal role / Effective 日期区间筛选，关键词搜索覆盖合同编号、名称、甲乙方公司与角色、地址、联系人、邮箱、金额、分成比例、创建人、原文件名，命中处高亮；多列可点表头排序
- **合同编号分组**：`C6-004` 与 `C6-004-T1`、`C6-004-T2` 视为一组，列表里主合同在前、子合同缩进跟随，切换任何排序都保持分组
- **Contract Action**：主合同 / 续约 / 变更 / 追加 / 解约
- **表单**：Basic / Dates / Amount / Party A / Party B / Submitter 分区，点击列表任意一行进入
- **Revenue Sharing**：Amount 区块切换为 Revenue Split + Split Ratio + 结算周期 + 分成基数，其余类型为 Total Amount；Currency 是两种类型共用的独立字段
- **原文件**：列表与表单均可打开该合同的 PDF
