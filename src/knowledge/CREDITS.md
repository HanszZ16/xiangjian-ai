# 知识库出处

`vendor/` 下是从公开仓库取来的参考资料原件，未作改动。它们承载的是公有领域的
传统术数内容，这些仓库做的是整理与编排的工作。

## bazi/

来自 [jinchenma94/bazi-skill](https://github.com/jinchenma94/bazi-skill)，**MIT License**
（原始 LICENSE 见 `vendor/bazi/LICENSE`）。

取用：`wuxing-tables.md`、`shensha-table.md`、`dayun-rules.md`、`shichen-table.md`、
`classical-texts.md`。

该仓库的 `SKILL.md` 还提供了八段式的论命框架与边界情况处理表，本项目的解读章节
与排盘提醒沿用其思路；`scripts/test_pai_pan.py` 的黄金用例移植到了
`src/divination/bazi/compute.test.ts`，用于交叉验证 tyme4ts 的排盘结果。
其排盘脚本本身是 Python，本项目在浏览器里跑，故改用 `tyme4ts` 重新实现。

## tarot/

来自 [daman-ovo-0404/tarot-skill](https://github.com/daman-ovo-0404/tarot-skill)，**MIT License**。

取用：`cards.md`、`spreads.md`、`card-relations.md`、`combinations.md`。

其 `SKILL.md` 中的护栏——反巴纳姆、主权归用户、「起点→张力→转折→出口→回响」的
叙事结构、自伤表达的安全处置——被提炼进 `src/prompt/guardrails.ts`，三个门类共用。

## ziwei/

紫微模块目前**不带任何外部知识库文件**。

开发时曾参考过
[FANzR-arch/Numerologist_skills](https://github.com/FANzR-arch/Numerologist_skills)
的 `ziwei-doushu/references/`（星曜、四化、格局三份），但该仓库**未声明任何 license**
——没有 LICENSE 文件，GitHub 也识别为未声明，默认即保留全部权利。
所以那几份文件既不进构建产物，也**不提交进本仓库**（见 `.gitignore`），
只作为「该覆盖哪些题目」的结构参照。

紫微的方法论写在 `src/divination/ziwei/impl.ts` 的角色提示里，是依据公有领域的
斗数通行说法自行编写的。将来若要补知识条目，同样依古籍原典另写，不照抄他人整理稿。

## 城市经纬度

`src/data/cities.json` 由 `scripts/build-cities.mjs` 从
[GeoNames](https://www.geonames.org/) 的 `cities15000` 数据集生成，
该数据集以 **CC BY 4.0** 授权。
