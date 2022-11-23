
export function splitByWordSeparators(input: string): string[] {
  const whiteSpaceRegex = "\\s\\r\\n\\t\\,";
  const myRegex = new RegExp(`[${whiteSpaceRegex}]`, "i");
  const split = input.split(myRegex).filter((_string) => _string !== "");
  return split;
}
