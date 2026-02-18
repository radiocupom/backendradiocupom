const { Router } = require('express');
const DashboardController = require('./dashboard.controller');

const router = Router();
const controller = new DashboardController();

router.get('/kpis', controller.getKPIs);
router.get('/recent-transactions', controller.getRecentTransactions);
router.get('/store-distribution', controller.getStoreDistribution);
router.get('/store-ranking', controller.getStoreRanking);
router.get('/growth-metrics', controller.getGrowthMetrics);

module.exports = router;
