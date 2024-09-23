import { setEnvironment, authenticate, whoAmI } from '../AppView.js';

$(document).ready(function() {
    setEnvironment().then((res) => {
        authenticate().then(response => {
            whoAmI();
            // Get data for widgets
            getalertsWidgetChartData();
        });
    })
});