/**
 * choice random one from the items
 */
export const randomChoice = <T>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};
