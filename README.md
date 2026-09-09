# 真题词汇 · 个人背词

基于 `2013.10-2026.4真题单词汇总(词频表).xlsm` 的个人英语单词学习网站。

网站是纯前端应用，可直接部署到 GitHub Pages，学习进度保存在浏览器
`localStorage`，不需要后端、数据库或登录系统。

## 功能

- 今日学习：到期复习词优先，再按“易错词 → 模糊词 → 新词”填充当日目标
- 单词卡片：默认隐藏释义，显示后标记“忘记 / 模糊 / 认识”
- SRS 间隔复习：认识间隔 `1/3/7/14/30/60/90` 天，忘记先 10 分钟再 1 天，
  模糊自动缩短间隔
- 中文拼写训练：自动判断大小写、多余空格和拼写错误
- 错词本、词库搜索筛选、学习统计、真题词频覆盖率
- 真题例句：可朗读整句；首次联网自动获取中文翻译并保存在浏览器
- 每日进度、连续学习天数、7/30 天趋势
- PWA：可添加主屏，核心资源与词库支持离线访问
- 导出 / 导入 / 清空学习数据
- 电脑端快捷键：`Space` 显示答案、`1/2/3` 忘记/模糊/认识、`R` 发音、
  `Enter` 下一词

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

`npm run build` 生成 `dist/`，GitHub Actions 会把它发布到 GitHub Pages。

## 数据结构

Excel 只有一个可见工作表 `词频顺序`，实际有效数据为 3940 个单词。
转换后的数据在 `src/data/words.json`，每条记录包含：

```json
{
  "id": 2,
  "rank": 2,
  "word": "and",
  "phonetic": "[ənd; ən; n; ænd]",
  "dictionaryMeaning": "conj. 和，与；……",
  "frequency": 198,
  "example": "fruits and vegetables grown indoors ...",
  "examMeaning": "conj. 和；又；而且"
}
```

字段说明：

- `id`：Excel 原始行号（稳定标识，不随排序变化）
- `rank`：按真题词频降序后的排名
- `word`：小写单词
- `phonetic`：音标；Excel 中缺失时输出 `null`
- `dictionaryMeaning`：完整词典释义，保留 Excel 换行
- `frequency`：真题出现次数
- `example`：Excel 例句；空白单元格规范化成 `null`
- `examMeaning`：考试大纲释义；Excel 中的 `-` 规范化成 `null`

Excel 中的 H-K 列只有四个“单词默写”空表头，L 列“难度自查”每一行都是相同
模板，没有单词级数据，因此不写入 JSON。详细分析见
[docs/excel-analysis.md](docs/excel-analysis.md)。

如果更新 Excel，可在项目根目录重新生成数据：

```bash
python3 scripts/convert_excel.py
```

脚本依赖 `openpyxl`。

## GitHub Pages 部署

仓库开启 GitHub Pages，并将 Source 设置为 **GitHub Actions**。
推送 `main` 后，`.github/workflows/deploy.yml` 会自动执行：

```text
npm ci
npm run build
actions/deploy-pages
```

网站地址通常是：

```text
https://<你的 GitHub 用户名>.github.io/<仓库名>/
```

Vite 使用相对路径 `base: "./"`，PWA 的 manifest、service worker 和资源都使用
相对地址，因此仓库名是什么都不影响访问。站点不依赖 React Router，不会出现
GitHub Pages 子路径刷新 404。

## 隐私与数据

- 单词库随网站发布，只用于个人学习
- 学习状态、复习计划、错词和统计数据全部保存在当前浏览器
- 应用不请求登录，不发送学习数据

## 测试记录

- `npm run build`：通过
- 数据：3940 词、0 重复、词频降序排序通过
- 浏览器：首页、今日学习、显示释义、认识/模糊/忘记、拼写训练、词库搜索、
  错词本、复习、统计、导入导出均通过
- SRS：`24h → 72h → 忘记 10min → 再次忘记 1d → 模糊 36h` 通过
- 刷新后进度保持：通过
- PWA：生产构建、service worker 激活、断网重载通过
- 响应式：390px 手机、768px 平板、1512px 宽屏无横向溢出，通过
