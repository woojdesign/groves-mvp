import { BaseMatchingEngine } from './base-matching.engine';
export declare class MockMatchingEngine extends BaseMatchingEngine {
    constructor();
    protected getCandidatePool(sourceUserId: string): Promise<string[]>;
    protected generateReasons(sourceUserId: string, candidateUserId: string): Promise<string[]>;
}
