const dateOnly = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

let SNAPSHOTS = [];
let TREND_SCORES = [];

const calculateGrowth = (today, yesterday) => {
  if (!yesterday || yesterday <= 0) return 0;
  return ((today - yesterday) / yesterday) * 100;
};

const calculateOpportunityScore = (data) => {
  const v = (data.visitGrowth || 0) * 0.4;
  const l = (data.likeGrowth || 0) * 0.3;
  const f = (data.favoriteGrowth || 0) * 0.2;
  const c = (data.competitionScore || 0) * 0.1;
  return v + l + f - c;
};

const saveSnapshot = (gameId, date, visits, likes, favorites) => {
  const r = {
    id: SNAPSHOTS.length + 1,
    game_id: gameId,
    date: dateOnly(date),
    visits,
    likes,
    favorites,
    created_at: new Date().toISOString()
  };
  SNAPSHOTS.push(r);
  return r;
};

const getSnapshot = (gameId, dateStr) => {
  return SNAPSHOTS.find((s) => s.game_id === gameId && s.date === dateStr) || null;
};

const saveTrendScore = (gameId, visitGrowth, score) => {
  const r = {
    id: TREND_SCORES.length + 1,
    game_id: gameId,
    visit_growth: visitGrowth,
    score,
    calculated_at: new Date().toISOString()
  };
  TREND_SCORES.push(r);
  return r;
};

const getGameMap = async (gameService) => {
  const list = await gameService.getGames();
  const m = new Map();
  for (const g of list) {
    m.set(g.id, g);
  }
  return m;
};

const runTrendDetectionOnce = async (deps) => {
  const { gameService, trendsService, youtubeService, scoringService } = deps;
  const today = new Date();
  const todayStr = dateOnly(today);
  const yesterdayStr = dateOnly(addDays(today, -1));
  const games = await gameService.getGames();
  for (const g of games) {
    const t = await trendsService.getTrendScore(g.name);
    const y = await youtubeService.getYoutubeScore(g.name);
    const newScore = scoringService.calculateNewWordScore(g, t, y);
    const visits = (t && (t.maxValue || t.averageScore || 0)) || 0;
    const likes = (y && y.videoCount) || 0;
    const favorites = newScore || 0;
    saveSnapshot(g.id, todayStr, visits, likes, favorites);
    const ys = getSnapshot(g.id, yesterdayStr);
    const vg = calculateGrowth(visits, ys ? ys.visits : 0);
    const lg = calculateGrowth(likes, ys ? ys.likes : 0);
    const fg = calculateGrowth(favorites, ys ? ys.favorites : 0);
    const score = calculateOpportunityScore({
      visitGrowth: vg,
      likeGrowth: lg,
      favoriteGrowth: fg,
      competitionScore: 0
    });
    if (vg > 200) {
      saveTrendScore(g.id, vg, score);
    }
  }
};

const registerNewTrendsRoute = async (app, deps) => {
  const http = app.getHttpAdapter().getInstance();
  http.get('/api/new-trends', async (req, res) => {
    try {
      const gm = await getGameMap(deps.gameService);
      const items = TREND_SCORES.slice().sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20).map((r) => {
        const g = gm.get(r.game_id);
        const last = SNAPSHOTS.filter((s) => s.game_id === r.game_id).sort((a, b) => (a.date > b.date ? 1 : -1)).slice(-1)[0];
        return {
          name: g ? g.name : String(r.game_id),
          growthRate: r.visit_growth || 0,
          opportunityScore: r.score || 0,
          currentVisits: last ? last.visits : 0
        };
      });
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: 'failed' });
    }
  });
};

const getNewTrendsItems = async (deps) => {
  const gm = await getGameMap(deps.gameService);
  return TREND_SCORES.slice().sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20).map((r) => {
    const g = gm.get(r.game_id);
    const last = SNAPSHOTS.filter((s) => s.game_id === r.game_id).sort((a, b) => (a.date > b.date ? 1 : -1)).slice(-1)[0];
    return {
      name: g ? g.name : String(r.game_id),
      growthRate: r.visit_growth || 0,
      opportunityScore: r.score || 0,
      currentVisits: last ? last.visits : 0
    };
  });
};

module.exports = {
  calculateGrowth,
  calculateOpportunityScore,
  runTrendDetectionOnce,
  registerNewTrendsRoute,
  getNewTrendsItems
};
