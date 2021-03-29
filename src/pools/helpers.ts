export const poolButtonColors = [
  "$color-bluegreen",
  "$color-light-purple",
  "$color-darkpink",
  "#5bcaa9",
  "#b14fd8",
  "#64b0c8",
  "#bf62a8",
  "#39a1d8",
  "#9a14d5",
  "#95d86e",
];

export const poolButtonColor = (index: number): string => {
  return poolButtonColors[index % poolButtonColors.length];
};
