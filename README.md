# 英析练习台

一个无需后端的英语学习网页。打开 `index.html` 后即可使用。

## 功能

- 粘贴英文后自动拆解句子或文章的语法结构
- 根据同等句型生成造句练习，并按回答给出点评
- 鼠标悬停单词显示中文和日语释义
- 收藏单词和语法点
- 朗读单词或全文
- 从 BBC News Top Stories 生成每日更新的英语阅读训练包

## 使用方式

直接打开 `index.html`。

如果发布到 GitHub Pages，进入仓库的 `Settings -> Pages`，选择 `main` 分支和 `/root` 目录即可。

## BBC 新闻更新

新闻数据来自 BBC News Top Stories RSS：`https://feeds.bbci.co.uk/news/rss.xml`。

GitHub Actions 会每天 06:00（日本时间）运行一次 `scripts/update-bbc-news.mjs`，更新 `data/bbc-news.json`。网页只读取这个每日生成的数据文件，不再内置预先写好的阅读文章。

为了避免直接搬运版权文章，网页不会复制 BBC 全文。每条新闻会基于 BBC RSS 的标题、短摘要和原文链接生成原创学习材料：学习版长读、重点词汇、语法观察、理解题、造句训练和跟读句。用户可以通过原文链接到 BBC 阅读完整报道。
