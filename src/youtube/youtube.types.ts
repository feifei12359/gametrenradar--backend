export type YoutubeVideo = {
  title: string;
  description?: string;
  publishedAt: Date;
  channelTitle: string;
  videoId: string;
  link: string;
  thumbnails?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

export type YoutubeSearchDebugResult = {
  requestParams: {
    query: string;
    regionCode?: string;
    publishedAfter: string;
    order: 'date';
    maxResults: number;
  };
  itemCount: number;
  firstItems: Array<{
    videoId: string;
    title: string;
    channelTitle: string;
    publishedAt: string;
  }>;
};
