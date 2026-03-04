const { runTrendDetectionOnce } = require('../services/trendService');

const scheduleDailyTrendJob = async (deps) => {
  const run = async () => {
    try {
      await deps.scraperService.filterAndSaveGames();
    } catch (e) {}
    try {
      await runTrendDetectionOnce({
        gameService: deps.gameService,
        trendsService: deps.trendsService,
        youtubeService: deps.youtubeService,
        scoringService: deps.scoringService
      });
    } catch (e) {}
  };
  await run();
  const dayMs = 24 * 60 * 60 * 1000;
  setInterval(run, dayMs);
};

module.exports = {
  scheduleDailyTrendJob
};
