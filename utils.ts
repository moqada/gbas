/**
 * choice random one from the items
 */
export const randomChoice = <T>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

export const lowerCamelToSnake = (str: string): string => {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
};
