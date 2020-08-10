userPrediction = JSON.parse(userPrediction)
//console.log(userPrediction)

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


// Retrieve all cumulative death data
function collectData() {
  var data = null;
  $.ajax({
    url: '/forecasts',
    type: 'get',
    dataType: 'html',
    async: false,
    success: function(response) {
        data = $.parseJSON(response);
    } 
  });
  var orgs = Object.keys(data);
  
  var results = [];
  var confirmed = [];
  for (var i = 0; i < orgs.length; i++) {
    var forecast = data[orgs[i]];
    var dates = forecast.target_end_date;
    var values = forecast.value;

    //var cases = getConfirmed(dates);
    //confirmed.push(cases);

    var result = {};
    dates.forEach((key, i) => result[key] = values[i]);
    //console.log(result)
    results.push(result);
  }

  return [results, orgs];
}


// Get confirmed deaths (cumulative)
function getConfirmed(input) {
  var data = null;

  // Send data from Python to JavaScript
  $.ajax({
    url: '/us_cum_deaths',
    type: 'get',
    dataType: 'html',
    async: false,
    success: function(response) {
        data = $.parseJSON(response);
    } 
  });

  var result = {};
  for (var i = 0; i < input.length; i++) {
    var date = input[i];
    result[date] = data[date];
  }
  return result;
}

function savePrediction(model, data) {
  $.ajax({
    type : 'POST',
    url : "/update/",
    contentType: 'application/json;charset=UTF-8',
    data : JSON.stringify({"model": model, "category": "cum", "data": data}),
    /*success: function(){
      window.location.href = "update";
  }*/
  });
  //console.log("done");
}

// Navbar component
class Navbar extends React.Component {
    render() {
        return (
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                <a class="navbar-brand" href="#">Navbar</a>
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
                <div class="navbar-nav">
                    <a class="nav-item nav-link active" href="#">Home <span class="sr-only">(current)</span></a>
                    <a class="nav-item nav-link" href="#">Daily Deaths <span class="sr-only">(current)</span></a>
                    <a class="nav-item nav-link" href="#">About</a>
                </div>
                </div>
            </nav>
        );
    }
}



// LineChart component
class LineChart extends React.Component {
  constructor(props) {
    super(props);
    this.chartRef = React.createRef(); // create reference for chart in class
  }

  componentDidMount() {
    var data = this.props.data;
    var model = this.props.org
    //console.log(userPrediction[model])
    this.myChart = new Chart(this.chartRef.current, {
      type: 'line',
      data: {
        labels: Object.keys(this.props.data),
        datasets: [ // Settings for user prediction graph
          {
              label: "User's Prediciton",
              data: userPrediction[model],
              backgroundColor: [
                'rgba(64, 64, 64, 0.2)',
              ],
              borderWidth: 1,
              dragData: true, // User's predictions are draggable
              radius: 2.5
          },
          // Settings for graph of forecasted deaths
          {
              label: 'Estimated Deaths',
              data: Object.values(this.props.data),
              backgroundColor: [
                  'rgba(255, 99, 130, 0.2)',
              ],
              borderWidth: 1,
              dragData: false,
              pointStyle: 'cross',
              rotation: 45,
          }, 
          // Settings for graph of confirmed deaths
          {
              label: 'Confirmed Deaths',
              data: Object.values(this.props.confirmed),
              backgroundColor: [
                'rgba(130, 99, 255, 0.2)',
              ],
              borderWidth: 1,
              dragData: false,
              pointStyle: 'cross',
              rotation: 45,
          }
          //{
              //label: 'Confirmed Deaths',
              //data: Object.values(this.props.confirmed),
              //backgroundColor: [
                //'rgba(130, 99, 255, 0.2)',
              //],
              //borderWidth: 1,
              //dragData: false,
          //}
        ]
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero: true
                  }
              }]
          },
          title: {
            display: true,
            text: this.props.org,
            fontSize: 30
          },
          dragData: true,
          dragDataRound: 1,
          dragOptions: {
            showTooltip: true
          },
          onDragStart: function(e) {
            // console.log(e)
          },
          onDrag: function(e, datasetIndex, index, value) {
            e.target.style.cursor = 'grabbing'
          },
          onDragEnd: function(e, datasetIndex, index, value) {
            e.target.style.cursor = 'default';
            //console.log('value: ' + value);
            //console.log('index: ' + index);
            //var date = addDays(Object.keys(data)[0], index).toISOString().slice(0,10);
            //console.log(userPrediction[model]);
            //update user prediction
            savePrediction(model, userPrediction[model]);
          },
          hover: {
            onHover: function(e) {
              const point = this.getElementAtEvent(e)
              if (point.length) e.target.style.cursor = 'grab'
              else e.target.style.cursor = 'default'
            }
          }
      }
    });
  }

  render() {
    return <canvas ref={this.chartRef} />;
  }
}


// ModelChart component
class ModelsChart extends React.Component {
  constructor(props) {
    super(props);
    this.chartRef = React.createRef();
  }

  componentDidMount() {
    var options = {
      scales: {
        yAxes: [{
          ticks: {
            //beginAtZero: true
          }
        }],
      },
      title: {
        display: true,
        text: 'All Model Forecasts',
        fontSize: 30
      },
    };

    var datasets = [];
    // Set colors for each organization
    var colors = {
      'Columbia': 'rgba(172, 204, 230, 0.2)',
      'Georgia Tech': 'rgba(179, 163, 105​, 0.2)',
      'UCLA': 'rgba(39, 116, 174, 0.2)',
      'IHME': 'rgba(87, 175, 85, 0.2)',
      'Youyang Gu': 'rgba(196, 129, 14, 0.2)'
    }
    for (var i = 0; i < this.props.data.length; i++) {
      console.log(this.props.orgs[i]);
      console.log(this.props.data[i]);
      console.log(colors[this.props.orgs[i]]);
      // Add each models data to datasets
      datasets.push({
        label: this.props.orgs[i],
        data: Object.values(this.props.data[i]),
        borderColor: colors[this.props.orgs[i]],
        borderWidth: 4,
        fill: false,
        pointStyle: 'cross',
        rotation: 45,
        pointBorderWidth: 1
      })
    }

    // Create chart with all models
    this.myChart = new Chart(this.chartRef.current, {
      type: 'line',
      data: {
        labels: Object.keys(this.props.data[3]),
        datasets: datasets
      },
      options: options
    });

  }

  render() {
    return <canvas ref={this.chartRef} />;
  }
}

function LineCharts({ dataSet, orgs }) {
  return dataSet.map((data, index) => {
    return (
      <LineChart data={data} org={orgs[index]} />
     );
  })
}


class App extends React.Component {
  constructor(props) {
    super(props);

    const data = collectData();
    this.state = { data: data[0], orgs: data[1] };
  }

  render() {
    const { data, orgs } = this.state;
    return (
      <div>
        <Navbar/>
        <LineCharts dataSet={data} orgs={orgs} />
        <ModelsChart data={data} orgs={orgs} />
      </div>
    );
  }
}

ReactDOM.render(
    <App />,
    document.getElementById('app')
);
