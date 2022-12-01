
export function inverseMapping(
  mapping: Record<string, string | number>,
): Record<string, string> {
  const inversed = {};
  Object.keys(mapping).forEach((key) => {
    inversed[mapping[key]] = key;
  });
  return inversed;
}
