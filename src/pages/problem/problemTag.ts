export const TAG_COLORS = [
  "red",
  "blue",
  "black",
  "purple",
  "orange",
  "yellow",
  "pink",
  "green",
  "olive",
  "teal",
  "violet",
  "brown",
  "grey",
];

interface ProblemTagLike {
  color: string;
  name: string;
}

export function sortTagColors(tagColors: string[]) {
  return tagColors.sort((a, b) => TAG_COLORS.indexOf(a) - TAG_COLORS.indexOf(b));
}

export function sortTags<T extends ProblemTagLike>(tags: T[]) {
  return tags.sort((a, b) => {
    if (a.color != b.color) return TAG_COLORS.indexOf(a.color) - TAG_COLORS.indexOf(b.color);
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
}
