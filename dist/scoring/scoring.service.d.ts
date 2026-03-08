export declare class ScoringService {
    calculateNewScore(publishDate: Date): number;
    calculateTotalScore(newScore: number, trendScore: number, ytScore: number): number;
    determineStatus(totalScore: number): string;
}
