import { getTopAlertsChartData } from './TopAlerts.js';
import { getEndpointsByHealthChartData } from './EndpointHealthData.js';
import { getRecentInfectedEndpointsTableData } from './RecentInfectedEndpoints.js';
import { getThreatActorsTableData } from './ThreatActors.js';
import { getOverviewData } from './Overview.js';
import { getMitreAttackChartData } from './MitreAttackCoverage.js';
import { getUserClicksOnRiskyLinksChartData } from './UserClicksOnRiskyLinks.js';
import { setEnvironment, authenticate, whoAmI } from '../AppView.js';
import { getRegionalProtectionScoreChartData } from './RegionalProtectionScore.js';
import { getHealthScoresChartData } from './HealthScores.js';

$(document).ready(function() {
    setEnvironment().then((res) => {
        authenticate().then(response => {
            whoAmI();
            getHealthScoresChartData();
            getTopAlertsChartData();
            getEndpointsByHealthChartData();
            getRecentInfectedEndpointsTableData();
            getThreatActorsTableData();
            getOverviewData();
            getUserClicksOnRiskyLinksChartData();
            getMitreAttackChartData();
            getRegionalProtectionScoreChartData();
        });
    })
});