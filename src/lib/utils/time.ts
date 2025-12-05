// src/lib/utils/time.ts
// Centrale plek voor tijd- en datum-gerelateerde utility functies.

/**
 * Converteert een Date object of een numerieke timestamp naar een ISO 8601 string.
 * Essentieel voor consistente data-uitwisseling tussen server en client.
 * @param date - Het Date object of de timestamp in milliseconden.
 * @returns Een ISO 8601 geformatteerde string.
 */
export const createTimestamp = (date: Date | number): string => {
  return new Date(date).toISOString();
};

/**
 * Genereert de huidige tijd als een ISO 8601 string.
 * @returns De huidige tijd als een ISO 8601 geformatteerde string.
 */
export const nowTimestamp = (): string => new Date().toISOString();