export default class LocalStorageService {
  public static isStorageSupported(): boolean {
    return window.localStorage !== undefined;
  }

  public static set<T>(key: string, object: T): void {
    window.localStorage.setItem(key, JSON.stringify(object));
  }

  public static get<T>(key: string): T {
    return JSON.parse(window.localStorage.getItem(key));
  }

  public static remove(key: string): void {
    window.localStorage.removeItem(key);
  }
}
