import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface SeedDataConfig {
  interests: Record<string, string[]>;
  names: {
    first_names: string[];
    last_names: string[];
  };
}

/**
 * SeedDataService - Provides curated seed data for persona generation
 *
 * Uses JSON files to ensure diversity and avoid AI biases
 */
@Injectable()
export class SeedDataService {
  private seedData: SeedDataConfig;

  constructor() {
    this.loadSeedData();
  }

  private loadSeedData() {
    const seedDataPath = path.join(__dirname, 'seed-data');

    const interests = JSON.parse(
      fs.readFileSync(path.join(seedDataPath, 'interests.json'), 'utf-8'),
    );

    const names = JSON.parse(
      fs.readFileSync(path.join(seedDataPath, 'names.json'), 'utf-8'),
    );

    this.seedData = { interests, names };
  }

  /**
   * Get random interests from seed data
   * @param count Number of interests to return
   * @param categories Optional specific categories to sample from
   * @returns Array of unique interests (no duplicates)
   */
  getRandomInterests(count: number = 5, categories?: string[]): string[] {
    const allInterests: string[] = [];

    if (categories && categories.length > 0) {
      // Filter to specified categories
      for (const category of categories) {
        const categoryKey = this.getCategoryKey(category);
        if (this.seedData.interests[categoryKey]) {
          allInterests.push(...this.seedData.interests[categoryKey]);
        }
      }
    } else {
      // Use all categories
      for (const categoryInterests of Object.values(this.seedData.interests)) {
        allInterests.push(...categoryInterests);
      }
    }

    // Shuffle and return unique selection (no duplicates)
    const shuffled = this.shuffleArray(allInterests);
    const uniqueCount = Math.min(count, shuffled.length);

    // If we need more interests than available, use stratified sampling
    if (count > shuffled.length) {
      return this.getStratifiedInterests(count, categories);
    }

    return shuffled.slice(0, uniqueCount);
  }

  /**
   * Get interests using stratified sampling across categories
   * Ensures balanced distribution when requesting many interests
   */
  private getStratifiedInterests(count: number, categories?: string[]): string[] {
    const targetCategories = categories && categories.length > 0
      ? categories.map(c => this.getCategoryKey(c))
      : Object.keys(this.seedData.interests);

    const interestsPerCategory = Math.ceil(count / targetCategories.length);
    const result: string[] = [];

    // Sample from each category proportionally
    for (const categoryKey of targetCategories) {
      const categoryInterests = this.seedData.interests[categoryKey] || [];
      const shuffled = this.shuffleArray([...categoryInterests]);
      result.push(...shuffled.slice(0, interestsPerCategory));
    }

    // Shuffle final result and trim to exact count
    return this.shuffleArray(result).slice(0, count);
  }

  /**
   * Get a random diverse name
   */
  getRandomName(): { firstName: string; lastName: string; fullName: string } {
    const firstName = this.getRandomElement(this.seedData.names.first_names);
    const lastName = this.getRandomElement(this.seedData.names.last_names);

    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
    };
  }

  /**
   * Get multiple diverse names ensuring no duplicates
   */
  getRandomNames(count: number): Array<{ firstName: string; lastName: string; fullName: string }> {
    const names = new Set<string>();
    const result: Array<{ firstName: string; lastName: string; fullName: string }> = [];

    // Try up to count * 3 times to avoid infinite loop
    let attempts = 0;
    const maxAttempts = count * 3;

    while (result.length < count && attempts < maxAttempts) {
      const name = this.getRandomName();
      if (!names.has(name.fullName)) {
        names.add(name.fullName);
        result.push(name);
      }
      attempts++;
    }

    return result;
  }

  /**
   * Get all interest categories
   */
  getInterestCategories(): string[] {
    return Object.keys(this.seedData.interests);
  }

  /**
   * Get interests by category
   */
  getInterestsByCategory(category: string): string[] {
    const categoryKey = this.getCategoryKey(category);
    return this.seedData.interests[categoryKey] || [];
  }

  /**
   * Helper: Convert category name to key format
   */
  private getCategoryKey(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '_').replace(/&/g, '');
  }

  /**
   * Helper: Get random element from array
   */
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Helper: Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
