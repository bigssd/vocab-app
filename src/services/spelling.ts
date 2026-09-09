export interface SpellingGrade {
  correct: boolean;
  detail: "correct" | "case" | "spacing" | "wrong";
  message: string;
}

export function checkSpelling(input: string, answer: string): SpellingGrade {
  const user = input.trim().replace(/\s+/g, " ");
  const target = answer.trim();
  if (user === target) {
    return { correct: true, detail: "correct", message: "拼写正确" };
  }
  if (user.toLowerCase() === target.toLowerCase()) {
    return {
      correct: true,
      detail: "case",
      message: "单词拼写正确，注意大小写",
    };
  }
  if (user.toLowerCase().replace(/\s/g, "") === target.toLowerCase()) {
    return {
      correct: true,
      detail: "spacing",
      message: "单词正确，注意删除多余空格",
    };
  }
  return { correct: false, detail: "wrong", message: "拼写有误，已记入错词" };
}
