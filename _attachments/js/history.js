
//------globals---------
var gPlotUpdateTimerID;
var gDataBaseName;
var chart1;
var UTCOffset
var gChartRefreshTimer;
var gLoadTimer;
var gLoadedTimer;
var history       = [];
var nameList      = [];
var loadingStatus = [];
var seenBefore    = [];
var theSeries     = [];
var zoomed;
var zoomedStart;
var zoomedEnd;
//---------------------

$(document).ready(function () {

    var currentTime   = new Date();
    UTCOffset = (currentTime.getTimezoneOffset()) * 60; //offset to UT in seconds
    var anId = getUrlVars()["machineID"];

    gDataBaseName = anId;

    AnyTime.picker( "endDateField", { format: "%Y/%m/%d %H:%i" } );

    loadSettings();
    
    if('endDateSec' in dataListStatus){   
        var theEndDate = parseInt(dataListStatus['endDateSec']);
        var now = new Date(theEndDate)
        var y = now.getFullYear();
        var m = now.getMonth()+1;
        var d = now.getDate();
        var hr = now.getHours();
        var min = now.getMinutes();
        document.getElementById('endDateField').value = y+'/'+m+'/'+d+' '+hr+':'+min;
    }
    else setFieldToNow('endDateField');
    
    if(chart1 != undefined)chart1.destroy();
    setUpChart();

    collectNames();
    collectSelectedData();  
    document.getElementById('maintitle').innerHTML = gDataBaseName;
    $("#zoomButtons").hide();
    zoomed = false;
});

function clearData()
{
    if(chart1 != undefined)chart1.destroy();
    setUpChart();
    for (var i in history) { 
        delete history[i];
    } 
}

function loadLast8()
{
    $("#zoomButtons").hide();
    zoomed = false;
    var s = document.getElementById('endDateField').value;
    var endDate = new Date(s);
    var end     = endDate.getTime();
    var start   = pastDate(end,8);
    clearData();
    collectSelectedDataOverRange(start,end);
}

function loadLastWeek()
{
    $("#zoomButtons").hide();
    zoomed = false;
    var s = document.getElementById('endDateField').value;
    var endDate = new Date(s);
    var end     = endDate.getTime();
    var start   = pastDate(endDate,24*7);
    clearData();
    collectSelectedDataOverRange(start,end);
}

function loadLastMonth()
{
    $("#zoomButtons").hide();
    zoomed = false;
    var s = document.getElementById('endDateField').value;
    var endDate = new Date(s);
    var end     = endDate.getTime();
    var start   = pastDate(endDate,24*7*30);
    clearData();
    collectSelectedDataOverRange(start,end);
}

function loadLast2Days()
{
    $("#zoomButtons").hide();
    zoomed = false;
    var s = document.getElementById('endDateField').value;
    var endDate = new Date(s);
    var end     = endDate.getTime();
    var start   = pastDate(endDate,48);
    clearData();
    collectSelectedDataOverRange(start,end);
}

function saveStartEnd(start,end)
{
    //save the start and end as seconds
    saveSettings('startDateSec', start);
    saveSettings('endDateSec', end);
}

function pastDate(startDate,hours)
{
    return startDate - hours*60*60*1000;
}

function setToNow()
{
    setFieldToNow('endDateField');
    //clearData();
    //collectSelectedData();
}

function setFieldToNow(field)
{
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth()+1;
    var d = now.getDate();
    var hr = now.getHours();
    var min = now.getMinutes();
    document.getElementById(field).value = y+'/'+m+'/'+d+' '+hr+':'+min;
}

function getStartDate()
{
    if('startDateSec' in dataListStatus)return dataListStatus['startDateSec'];
    else {
        //default to 8 hours before endDate
        return pastDate(getEndDate(),8);
    }
}

function getEndDate()
{
    if('endDateSec' in dataListStatus)return dataListStatus['endDateSec'];
    else {
        var aDate = new Date(document.getElementById('endDateField').value);
        return aDate.getTime();
    }
}


function collectNames()
{
    var db = $.couch.db(gDataBaseName);
     db.view(gDataBaseName+"/ave", {group_level:2, success:function(response) {
        jQuery.each(response.rows, function(i, row) {

            var keyArray     = row['key'];
            var processName  = keyArray[0];
            var variableName = keyArray[1];
            var theFullName  = keyArray.join(',');
            if(seenBefore[theFullName]==undefined){
                seenBefore[theFullName] = "YES";
                updateItem(theFullName,theFullName);
            }

            if(nameList[processName] == undefined){
                nameList[processName] = [];
            }
            nameList[processName].push(variableName);
            
         });
         setUpChart();
    }});   
}

function collectSelectedDataOverRange(startTime,endTime) 
{    
    if('numPlots' in dataListStatus){
        var n = dataListStatus['numPlots'];
        for(var i=0;i<n;i++){
            var itemName = 'plotID'+'_'+i;
            if(itemName in dataListStatus){
                collectDataForItemOverRange(dataListStatus[itemName],startTime,endTime);
            }
        }
    }
}

function collectSelectedData() 
{    
    if('numPlots' in dataListStatus){
        var n = dataListStatus['numPlots'];
        for(var i=0;i<n;i++){
            var itemName = 'plotID'+'_'+i;
            if(itemName in dataListStatus){
                collectDataForItem(dataListStatus[itemName]);
            }
        }
    }
}

function collectDataForItem(theFullName) 
{
    collectDataForItemOverRange(theFullName,getStartDate(),getEndDate());
}

function collectDataForItemOverRange(theFullName,startTime,endTime) 
{

    clearInterval(gChartRefreshTimer);
    clearInterval(gLoadTimer);

    saveStartEnd(startTime,endTime);
 
    //start and end times are in local time (Unix epoch seconds)
    //so have to convert to UTC.
    endTime   -= UTCOffset;
    startTime -= UTCOffset;

    var theDate = new Date(startTime);
	var y1 = theDate.getFullYear();
	var m1 = theDate.getMonth()+1;
	var d1 = theDate.getDate();
	var h1 = theDate.getHours();
	var min1 = theDate.getMinutes();

    theDate = new Date(endTime);
	var y2 = theDate.getFullYear();
	var m2 = theDate.getMonth()+1;
	var d2 = theDate.getDate();
	var h2 = theDate.getHours();
	var min2 = theDate.getMinutes();
    
    var db = $.couch.db(gDataBaseName);

    var parts = theFullName.split(",");
    var processName  = parts[0];
    var variableName = parts[1];

    if(history[theFullName] == undefined){
        history[theFullName] = [];
    }
    var approxPoints = parseInt((endTime-startTime))/60000;
    
    var level = 7;
    if(approxPoints>1000)level=6;
    else if(approxPoints>5000)level=5;
    //else if(approxPoints>10000)level=4;
    //else if(approxPoints>50000)level=3;
    
    loadingStatus[variableName] = 'loading';
    
    db.view(gDataBaseName+"/ave", {group_level:level, startkey:[processName,variableName,y1,m1,d1,h1,min1], endkey:[processName,variableName,y2,m2,d2,h2,min2], success:function(response) {

        if(loadHistory(response,level)){
            var n   = chart1.series.length;
        
            var parts = theFullName.split(",");
            var variableName = parts[1];

            theSeries[n] = chart1.addSeries({lineWidth:1,name:variableName,data:history[theFullName]},false);
            saveSettings('numPlots', n+1);
            saveSettings('plotID'+'_'+n, theFullName);
            gChartRefreshTimer = setInterval("redrawChart()", 500);
        }
        delete loadingStatus[this.startkey[1]];
        gLoadTimer = setInterval("loadStatus()", 100);
    }});
    loadStatus();
}

function loadHistory(response,level)
{
    var num = response.rows.length;
    if(num == 0)return false;
    var theFullName = response.rows[0].key[0] + ',' + response.rows[0].key[1];
    if(num<500){
        for(var i=0;i<num;i++){
            var values  = response.rows[i].value;
            var theDate = dateFrom(response.rows[i].key,level);
            
            var dataAtTime = [];
            dataAtTime[0] = theDate.getTime()- UTCOffset*1000;
            dataAtTime[1] = response.rows[i].value['avg'];
            history[theFullName][i] = dataAtTime;
        }
    }
    else {
        var index = 0;
        for(var i=1;i<num-1;i+=3){
            var values  = response.rows[i].value;
            var theDate = dateFrom(response.rows[i].key,level);
            
            var dataAtTime = [];
            
            dataAtTime[0] = theDate.getTime()- UTCOffset*1000;
            dataAtTime[1] = ( response.rows[i-1].value['avg'] + 
                              response.rows[i].value['avg']   + 
                              response.rows[i+1].value['avg'] ) / 3.;
                              
            history[theFullName][index] = dataAtTime;
            index++;
        }

    }
        
    return true;
}

function dateFrom(keys,level)
{
    var theDate;
    if(level == 7)      theDate = new Date(keys[2],keys[3]-1,keys[4],keys[5],keys[6],0,0);
    else if(level == 6) theDate = new Date(keys[2],keys[3]-1,keys[4],keys[5],0,0,0);
    else if(level == 5) theDate = new Date(keys[2],keys[3]-1,keys[4],0,0,0,0);
    //else if(level == 4) theDate = new Date(keys[2],keys[3]-1,0,0,0,0,0);
    //else if(level == 3) theDate = new Date(keys[2],0,0,0,0,0,0);
    return theDate;
}

function redrawChart()
{
    chart1.redraw();
}

function loadStatus()
{
    var prefix;
    var content = '';
    var count = 0;
    for(item in loadingStatus){
        count++;
        content += '['+item + '] ';
    }
    if(count)prefix = 'Loading: ';
    else prefix = '';
    document.getElementById('loadStatus').innerHTML = prefix + content;
}

function handleTabSwitch(i)
{
}


function loadToZoomValues()
{
    $("#zoomButtons").hide();
    clearData();
    var start = zoomedStart;
    var end = new Date(zoomedEnd);
    var y = end.getFullYear();
    var m = end.getMonth()+1;
    var d = end.getDate();
    var hr = end.getHours();
    var min = end.getMinutes();
    document.getElementById('endDateField').value = y+'/'+m+'/'+d+' '+hr+':'+min;
    collectSelectedDataOverRange(start,end);
    zoomed = false;
}

function setUpChart()
 {
    chart1 = new Highcharts.Chart({
        chart:    { 
            renderTo: 'historyChart', 
            events: {
                selection: function(event) {
                    if (event.xAxis) {
                        zoomed = true;
                        zoomedStart = event.xAxis[0].min + UTCOffset*1000; 
                        zoomedEnd   = event.xAxis[0].max + UTCOffset*1000; 
                        $("#zoomButtons").show();
                    } 
                    else {
                        zoomed = false;
                         $("#zoomButtons").hide();
                   }
                }
            },

            zoomType: 'xy',
            spacingRight: 20,
            backgroundColor: '#ffffff',
            borderWidth: 0
        },
        
        credits: { enabled:false },
        
        title:   { text: ' ' },
            
        xAxis: {
            type: 'datetime',
            maxZoom: 10,
            title: { text: 'Time (local)' },
            dateTimeLabelFormats: { //custom date formats for different scales
                second: '%H:%M:%S',
                minute: '%H:%M',
                hour: '%H:%M',
                day: '%e. %b',
                week: '%e. %b',
                month: '%b', //month formatted as month only
                year: '%Y'
            }
        },
        yAxis: {
            title: { text: '' },
            startOnTick: false,
            showFirstLabel: false
        },
 
        tooltip: {
            shared: true,
            crosshairs: true,
            formatter: function() {
                var s = Highcharts.dateFormat('%b %d, %Y %H:%M',this.x);
                $.each(this.points, function(i, point) {
                var y = parseFloat(point.y);
                    s += '<br/>'+ point.series.name +': '+
                    y.toFixed(2);
                });
        
                return s;
            }, 
        },
        
        plotOptions: {
            series: {
                marker: {
                 enabled: false,
                   lineWidth: 1
                }
            }
        }
            
    });   
}

function itemClickRedraw(itemName)
{
    itemClick(itemName,true);
}

function itemClick(itemName,redraw)
{
    
    if(chart1 == undefined)setUpChart();

    if(itemName in history){
        var n   = chart1.series.length;
        
        var parts = itemName.split(",");
        var variableName = parts[1];
        var i;
        var addit = true;
        for(i=0;i<n;i++){
            if(chart1.series[i].name == variableName){
                addit = false;
                document.getElementById('loadedStatus').innerHTML = '['+variableName+'] Already Plotted';
                clearInterval(gLoadedTimer);
                gLoadedTimer = setInterval("clearLoadedStatus()", 3000);
                break;
            }
        }
        if(addit){
            theSeries[n] = chart1.addSeries({lineWidth:1,name:variableName,data:history[itemName]},false);
            saveSettings('numPlots', n+1);
            saveSettings('plotID'+'_'+n, itemName);
            if(redraw)chart1.redraw();
        }
    }
    else collectDataForItem(itemName);
}

function clearLoadedStatus(itemName)
{
    document.getElementById('loadedStatus').innerHTML = "";
}

function removeSeries()
{
    if(chart1 == undefined)return;
    var n = chart1.series.length;
    var s1 = theSeries[n-1];
    s1 && s1.remove && s1.remove(false);
    
    saveSettings('numPlots', n-1);

    chart1.redraw();
}

function updateItem(dataItemName,pid)
{
    var parentRef = document.getElementById('historyList');
    return update(parentRef,dataItemName,pid,0);
}

function update(parentRef,pathName,pid,level)
{
    var index = pathName.indexOf(',');
    if(index == -1){
        var children = parentRef.children;

        var leafTag = document.createElement('div');
        leafTag.id = pathName;
        level = level+1;
        leafTag.className ='leaf level'+level;
        leafTag.innerHTML = pathName+' ';
        leafTag.setAttribute('onClick','itemClickRedraw("'+pid+'")');
        
        parentRef.appendChild(leafTag);
       return true;

    }
    else {
        var name    = pathName.substr(0,index);
        var theRest = pathName.slice(index+1);
        level = level+1;

        var children = parentRef.children;
        var foundit = false;
        for(var i=0;i<children.length;i++){
            if(children[i].id == name){
                var theContent = children[i].children[1];
                update(theContent,theRest,pid,level);
                foundit = true;
            }
        }
        //ok -- didn't find an existing node so we have to create one
        //the form will be 
        //<div class="node">
        //    <nodename>DataGen</nodename>
        //    <div class="nodecontent">
        //        content
        //    <div>
        //<div>
        if(!foundit){
            var nodeTag = document.createElement('div');            

            nodeTag.className = 'node level'+level;
            nodeTag.id = name;

            var nodeNameTag = document.createElement('nodename');
            nodeNameTag.id = 'nodename';
            nodeNameTag.innerHTML = name;
            
            var nodeContentTag = document.createElement('div');
            nodeContentTag.className ='nodecontent';
          
            parentRef.appendChild(nodeTag);
            nodeTag.appendChild(nodeNameTag);
            nodeTag.appendChild(nodeContentTag);
            
            nodeNameTag.onclick = function() {
                toggleNode(this);
            };
            
            var n = fullName(nodeTag,name);
            if(n in dataListStatus){
                if(dataListStatus[n] == 'false'){
                    addClassName(nodeTag,'nodecollapsed',true);
                }
            }
            else addClassName(nodeTag,'nodecollapsed',true);
            
            update(nodeContentTag,theRest,pid,level);
            
          }
    }
}

function toggleNode(clickedNode)
{    
    var target    = clickedNode.parentNode;

    var collapsed = hasClassName(target,'nodecollapsed');
    if(collapsed) removeClassName(target,'nodecollapsed');
    else addClassName(target,'nodecollapsed',false);
    
    var n = fullName(target,target.id);
    saveSettings(n, collapsed?"true":"false");
}

function fullName(target,theFullName){
    if(target.parentNode.id == 'historyList')return theFullName;
    else {
        var parentID = target.parentNode.id;
        var s;
        if(parentID) s = target.parentNode.id + ',' + theFullName;
        else s = theFullName;
        return fullName(target.parentNode,s);
    }
}
