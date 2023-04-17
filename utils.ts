/**
 * choice random one from the items
 */
export function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function lowerCamelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}
