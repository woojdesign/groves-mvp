/**
 * Strategy for filtering out invalid match candidates.
 * Implementations: prior matches, blocked users, same org, etc.
 */
export interface IFilterStrategy {
  /**
   * Filter candidates based on business rules.
   * @param sourceUserId - The user to generate matches for
   * @param candidateUserIds - Pool of potential matches
   * @returns Filtered list of candidate user IDs
   */
  filter(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<string[]>;

  /**
   * Strategy name for logging/debugging.
   */
  getName(): string;
}
