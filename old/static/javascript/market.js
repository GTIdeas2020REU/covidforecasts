$.get("/total", function(total_votes) {
    console.log(total_votes)
    console.log("hello")
    total_votes = $.parseJSON(total_votes);
    console.log(total_votes['UCLA']);
    drawChart(total_votes)
    //collectData(total_votes);
  })

function drawChart(results) {
    var data = {
        datasets: [{
            data: [results['Columbia'], results['Georgia Tech'], results['UCLA']],
            backgroundColor: [
                "#2ecc71",
                "#3498db",
                "#95a5a6"
            ]
        }],
    
        // These labels appear in the legend and in the tooltips when hovering different arcs
        labels: [
            'Columbia',
            'Georgia Tech',
            'UCLA'
        ]
    };
    console.log(data)
    var ctx = document.getElementById('chart').getContext('2d');
    var myPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true
        }
    });   

}


