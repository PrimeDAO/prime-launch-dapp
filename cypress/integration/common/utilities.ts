export function getRandomId(): string {
  /**
   * "0.g6ck5nyod4".substring(2, 9)
   * -> g6ck5ny
   */
  return Math.random().toString(36).substring(2, 9);
}

export async function delay(milisec: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("");
    }, milisec);
  });
}
