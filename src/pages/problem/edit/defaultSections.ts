import { v4 as uuid } from "uuid";

import { Locale } from "@/interfaces/Locale";

import type { LocalizedContentSection } from "./ProblemEditPage";

export default <Record<Locale, LocalizedContentSection[]>>{
  [Locale.zh_CN]: [
    {
      uuid: uuid(),
      sectionTitle: "题目描述",
      type: "Text",
      text: ""
    },
    {
      uuid: uuid(),
      sectionTitle: "形式化命题",
      type: "Text",
      text: ""
    },
    {
      uuid: uuid(),
      sectionTitle: "提示",
      type: "Text",
      text: ""
    }
  ],
  [Locale.en_US]: [
    {
      uuid: uuid(),
      sectionTitle: "Description",
      type: "Text",
      text: ""
    },
    {
      uuid: uuid(),
      sectionTitle: "Formal statement",
      type: "Text",
      text: ""
    },
    {
      uuid: uuid(),
      sectionTitle: "Hint",
      type: "Text",
      text: ""
    }
  ],
  [Locale.ja_JP]: [
    {
      uuid: uuid(),
      sectionTitle: "問題文",
      type: "Text",
      text: ""
    },
    {
      uuid: uuid(),
      sectionTitle: "形式な命題",
      type: "Text",
      text: ""
    },
    {
      uuid: uuid(),
      sectionTitle: "ヒント",
      type: "Text",
      text: ""
    }
  ]
};
