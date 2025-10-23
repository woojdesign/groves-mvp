export declare class AcceptMatchResponseDto {
    status: 'accepted' | 'mutual_match';
    mutualMatch: boolean;
    intro?: {
        id: string;
        status: string;
    };
    message: string;
}
