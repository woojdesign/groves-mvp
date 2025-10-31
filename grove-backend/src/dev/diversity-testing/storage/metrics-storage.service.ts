import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { QuickDiversityMetricsDto } from '../dto/diversity-metrics.dto';

@Injectable()
export class MetricsStorageService {
  private readonly logger = new Logger(MetricsStorageService.name);
  private readonly storageDir = path.join(process.cwd(), 'diversity-metrics');

  constructor() {
    this.ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create storage directory: ${error.message}`);
    }
  }

  /**
   * Save metrics to disk
   */
  async save(batchId: string, metrics: QuickDiversityMetricsDto): Promise<void> {
    const filename = `${batchId}_${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.storageDir, filename);

    try {
      await fs.writeFile(filepath, JSON.stringify(metrics, null, 2));
      this.logger.log(`Metrics saved to ${filepath}`);
    } catch (error) {
      this.logger.error(`Failed to save metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load metrics from disk
   */
  async load(batchId: string): Promise<QuickDiversityMetricsDto | null> {
    try {
      const files = await fs.readdir(this.storageDir);
      const matchingFile = files.find(f => f.startsWith(batchId));

      if (!matchingFile) {
        this.logger.warn(`No metrics found for batch ${batchId}`);
        return null;
      }

      const filepath = path.join(this.storageDir, matchingFile);
      const content = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Failed to load metrics: ${error.message}`);
      return null;
    }
  }

  /**
   * List all saved batches
   */
  async list(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.storageDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace(/\.json$/, ''));
    } catch (error) {
      this.logger.error(`Failed to list batches: ${error.message}`);
      return [];
    }
  }
}
