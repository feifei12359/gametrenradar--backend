import { ConfigService } from '@nestjs/config';
export declare class YoutubeService {
    private configService;
    private apiKey;
    constructor(configService: ConfigService);
    getYoutubeScore(gameName: string): Promise<number>;
}
