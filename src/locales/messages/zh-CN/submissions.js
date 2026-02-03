return {
  title: "提交记录",
  query: {
    problem_id: "题目",
    submitter: "提交者",
    code_language: "语言",
    code_language_all: "不限语言",
    status: "状态",
    status_all: "不限状态",
    filter: "筛选",
    my_submissions: "我的提交",
    lean_version: "Lean版本",
    lean_version_all: "不限版本",
  },
  query_error: {
    INVALID_PROBLEM_ID: "无效的题目ID。",
    INVALID_USERNAME: "无效的用户名。",
    NO_SUCH_PROBLEM: "无此题目。",
    NO_SUCH_USER: "无此用户。"
  },
  empty: {
    message_filtered: "找不到符合条件的提交",
    message_not_filtered: "暂无提交",
    goback: "返回"
  }
};
