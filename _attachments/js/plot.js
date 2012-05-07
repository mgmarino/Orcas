
var gPlotUpdateTimerID;
var gDataBaseName;
var gDataBase;

$(document).ready(function () {
	var plotId = getUrlVars()["dataSetID"];
	var machineName = getUrlVars()["machineName"];
	
    gDataBase = $.couch.db(machineName);

    setUpDataChart();
    
    machineName = machineName.replace("%20"," ");
    document.getElementById('maintitle').innerHTML = "1D Histogram";
    $('#nav').append('<li><a ONCLICK="history.go(-1)">'+ machineName+'</a></li>');
        
    plotData(plotId);
    
});

function plotData(plotId) 
{
    clearInterval(gPlotUpdateTimerID);
    gDataBase.openDoc(plotId,"", { async:false, success: function(doc) {

        var d       = new Array();
        var y       = doc.PlotData.split(',');
        var start   = doc.start;
        var end     = start + y.length;
        var j = 0;
        for(var i=0;i<start;i++)d[i]=0;
        for(var i=start;i<end;i++){
            d[i]=parseInt(y[j++]);
        }
        for(var i=end;i<end+50;i++)d[i]=0;

        chart1.series[0].setData(d);        
        chart1.setTitle({ text: plotId});
  	}});
    gPlotUpdateTimerID = setInterval(function() { plotData(plotId); }, 15000);
}

 function setUpDataChart()
 {
    chart1 = new Highcharts.Chart({
        chart: {
            renderTo: 'histogramChart1',
            zoomType: 'x',
            spacingRight: 20
        },
        title: { text: 'Plot' },
        xAxis: {
            type: 'channel',
            maxZoom: 50,
            title: { text: 'Channel' }
        },
        yAxis: {
            title: { text: 'Counts' },
            min: 0.6,
            startOnTick: false,
            showFirstLabel: false
        },
        tooltip: { shared:  true  },
        legend:  { enabled: false },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: [0, 0, 0, 450],
                    stops: [
                        [0, Highcharts.theme.colors[0]],
                        [1, 'rgba(2,0,0,0)']
                    ]
                },
                lineWidth: 1,
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true,
                            radius: 5
                        }
                    }
                },
                shadow: false,
                states: {
                    hover: {
                        lineWidth: 1						
                    }
                }
            }
        },
    
        series: [{
            type: 'area',
            name: 'Counts',
            pointInterval: 1,
            pointStart: 0,
            data: []
        }]
    });   
}
