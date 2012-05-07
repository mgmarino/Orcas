
// ____________________________________________________________________________________

var gRecheckIntervalID;
var gDataBase;
var gDataBaseName;
var gPlotName;
var gDataBaseExists;
var chart1;
var gExperiment;
var gMachineInfoTimerID;
var gAlarmTimerID;
var gRunInfoTimerID;
var gProcessTimerID;
var gTabTimerID;
var chart1;
var chart2;
var gMachineID;

// ____________________________________________________________________________________

function loadDBList () {
//    setDataBaseExists(false);
//    $.couch.allDbs( { success : function(dbs) { loadDB(dbs); } });
 } 

function loadDB(d1){
    var count = 0;
    if(d1 != '_users' && d1 != 'orcas' && !d1.match("history")){
        count = count+1;
        gDataBase = $.couch.db(d1);
        
        if(count == 1){
            gDataBase.view(d1 +"/machineinfo",{success: function(doc) { 
                setDataBaseExists(true);
                gDataBaseName = d1;
                loadSettings();
                if('plotID' in dataListStatus){
                    gPlotName = dataListStatus['plotID'];
                }

                document.getElementById('maintitle').innerHTML = doc.rows[0].value.name;
                
                updateMachineInfo();
                updateRunInfo();
                updateAlarms();
                updateProcesses();

                showHideAll();
            }});
        }
    }
}

function handleTabSwitch(i)
{
    var query;
    switch(i){
        case 0: //data
            updateDataList();
        break;
        case 3: //status
            updateStatusLog();       
       break;
//        case 4: //experiment
//        break;
    }
}


function updateStatusLog()
{    
    clearInterval(gTabTimerID);
    if(gDataBaseExists){
        gDataBase.view(gDataBaseName +"/statuslog",{success: function(doc) {
            var mm = doc.rows[0].value;
            var html = "<p>";
            var s = mm.statuslog.replace(new RegExp( "\\n", "g" ),"<br/>");

            html += s;
            html += "</p>";
            document.getElementById('StatusLog').innerHTML = html;
        }});
    }
    gTabTimerID =  setInterval("updateStatusLog()", 10000);
}

function errorOverride(strMessage)
{ 
    setDataBaseExists(false);
} 
// ____________________________________________________________________________________
function updateMachineInfo()
{    
    clearInterval(gMachineInfoTimerID);
    if(gDataBaseExists){
        gDataBase.view(gDataBaseName +"/machineinfo",{success: function(doc) { 
            var mm = doc.rows[0].value;
            var html = "<p>";
            html += "Name<br/>";
            html += "ORCA Version<br/>";
            html += "IP Address<br/>";
            html += "HW Address<br/>";
            html += "Experiment<br/>";
            html += "Uptime<br/>";
            html += "</p>";
            document.getElementById('machineInfoName').innerHTML = html;

            html = "<p>";
            html += mm.name + "<br/>";
            html += mm.version + "<br/>";
            html += mm.hw_address + "<br/>";
            html += mm.ip_address + "<br/>";
            html += gExperiment + "<br/>";
            html += mm.uptime + "<br/>";
            html += "</p>";
            document.getElementById('machineInfo').innerHTML = html;
        }});
     }
    gMachineInfoTimerID = setInterval("updateMachineInfo()", 2000);
}

function updateRunInfo()
{    
    clearInterval(gRunInfoTimerID);
    if(gDataBaseExists){

        gDataBase.view(gDataBaseName +"/runinfo",    {success: function(doc) { 
            var tt = doc.rows[0].value;
            
            gExperiment = tt.experiment;
            
            var html = "<p>";
            html += "Run State<br/>";
            html += "Run Number<br/>";
            html += "Start Time<br/>";
            html += "Elapsed Time<br/>";
            if(tt.subrun) html += "Sub Run Elapsed Time<br/>";
            if(tt.timedRun){
                if(tt.repeatRun) html += "Time To Go<br/>";
                else             html += "Time To Go<br/>";
            }
            html += "</p>";
            document.getElementById('runInfoName').innerHTML = html;

            html = "<p>";
            var valid = tt.run;
            if(valid){
                html += runState(tt.state,tt.offlineRun) + "<br/>";
                if(tt.offlineRun)html += "----<br/>";
                else html += runNumber(tt.run,tt.subrun)+ "<br/>";
                html += tt.startTime + "<br/>";
                html += convertSeconds(tt.elapsedTime)+ "<br/>";
                if(valid){
                    if(tt.subrun) html += convertSeconds(tt.elapsedSubRunTime) + "<br/>";
                    if(tt.timedRun){
                        if(tt.repeatRun) html += convertSeconds(tt.timeToGo) + " until repeating<br/>";
                        else             html += convertSeconds(tt.timeToGo) + " until stopping<br/>";
                    }
                }
            }
            else {
                html += "No Run Info<br/>";
                html += "---<br/>";
                html += "---<br/>";
                html += "---<br/>";
                if(valid){
                    if(tt.subrun) html += convertSeconds(tt.elapsedSubRunTime) + "<br/>";
                    if(tt.timedRun){
                        if(tt.repeatRun) html += convertSeconds(tt.timeToGo) + " until repeating<br/>";
                        else             html += convertSeconds(tt.timeToGo) + " until stopping<br/>";
                    }
                }           
            }
            
            html += "</p>";

            document.getElementById('runInfo').innerHTML = html;

        }});
    }
    gRunInfoTimerID = setInterval("updateRunInfo()", 2000);
}

// ____________________________________________________________________________________
function updateAlarms()
{
    clearInterval(gAlarmTimerID);
    if(gDataBaseExists){
        gDataBase.view(gDataBaseName +"/alarms",{success: function(data) {
            if(data.total_rows > 0){
                var alarmlist = data.rows[0].value.alarmlist;
                var numAlarms = alarmlist.length;
                if(numAlarms != 0){

                    //populate the Name Column
                    var content = "<table>";
                    for(var i=0;i<numAlarms;i++){
                        var alarmName = alarmlist[i].name;
                        var alarmHelp = alarmlist[i].help;
                        var alarmPost = alarmlist[i].timePosted;
                        var severity  = alarmlist[i].severity;
                        alarmHelp     = alarmHelp.replace(new RegExp( "\\n", "g" ),"<br/>");
                       
                        content += "<tr onmouseover=\"this.className = 'hlt';document.body.style.cursor = 'pointer';\" onmouseout=\"this.className = '';document.body.style.cursor = 'default'\">";
                        content += "<td  id=\"alarmNameCol\" onClick= \"openInfo('";
                        content += alarmName + "','" +alarmHelp;
                        content += "')\">";
                        content += alarmName;
                        content += "</td>"
                  
                        content += "<td  id=\"alarmSeverityCol\" class=\"" + serverityName(severity) + "\"onClick= \"openInfo('";
                        content += alarmName + "','" +alarmHelp;
                        content += "')\">";
                        content += serverityName(severity);
                        content += "</td>"
                 
                        content += "<td  id=\"alarmPostedCol\" onClick= \"openInfo('";
                        content += alarmName + "','" + alarmHelp;
                        content += "')\">";
                        content += alarmPost;
                        content += "</td>"
                        content += "</tr>";
                    }
                    content += "</table>";
                    document.getElementById('alarmtab').innerHTML    = content;
                     
                    document.getElementById('alarmtabtext').innerHTML = "Alarms (" + numAlarms + ")" ;
                   $('#alarmCountNone').hide();
                    
                }
                else {
                    document.getElementById('alarmtabtext').innerHTML = 'Alarms (None)' ;
                    $('#alarmCountNone').show();
                }       
            }
            else {
                $('#alarmTable').hide();
                document.getElementById('alarmtabtext').innerHTML = 'Alarms (None)' ;
               $('#alarmCountNone').show();
           }
         }});
    }
    gAlarmTimerID = setInterval("updateAlarms()", 5000);

}

function processClick(processID){
    window.location.href = "processInfo.html?processIndex=" + processID + "&machineName="+gDataBaseName; 
}

function updateProcesses()
{
    clearInterval(gProcessTimerID);
    if(gDataBaseExists){
        gDataBase.view(gDataBaseName +"/processes",{success: function(data) {
            if(data.total_rows > 0){
                var processlist = data.rows[0].value.processlist;
                var numProcesses = processlist.length;
                var numRunning = 0;
                if(numProcesses != 0){

                    //populate the Name Column
                    var content = "<table>";
                    for(var i=0;i<numProcesses;i++){
                    
                        var title = processlist[i].title;
                        var state = processlist[i].state;
                        var pid   = processlist[i].id;
                      
                        content += "<tr onmouseover=\"this.className = 'hlt';document.body.style.cursor = 'pointer';\" onmouseout=\"this.className = '';document.body.style.cursor = 'default'\">";

                        content += "<td  id=\"processNameCol\" onClick= \"processClick('" + i + "')\">";
                        content += title;
                        content += "</td>"

                        content += "<td  id=\"processStateCol\" onClick= \"processClick('" + i + "')\">";
                        if(state){
                            content += "Running";
                            numRunning += 1;
                        }
                        else content += "Stopped";
                        content += "</td>"
                        content += "</tr>";

                    }

                    content += "</table>";
                    document.getElementById('processtab').innerHTML     = content;

                    //$('#processTable').show();
                    document.getElementById('processtabtext').innerHTML = "Processes (" + numRunning+"/"+numProcesses + ")" ;
                    
                }
                else {
                    //$('#processTable').hide();
                    document.getElementById('processtabtext').innerHTML = 'Processes (None)' ;
                   // $('#alarmCountNone').show();
                }       
            }
            else {
                //$('#processTable').hide();
                document.getElementById('processtabtext').innerHTML = 'Processes (None)' ;
               //$('#alarmCountNone').show();
           }
           
         }});
    }
    gProcessTimerID = setInterval("updateProcesses()", 5000);
}

// ____________________________________________________________________________________
function updateDataList()
{      
    clearInterval(gTabTimerID);
     if(gDataBaseExists){
        gDataBase.view(gDataBaseName +"/counts",{success: function(data) { 
            var count = 0;
            var n = data.total_rows;
            if(n>0){
                for(var i=0;i<n;i++){
                    data.rows[i].value.name
                    var name    = data.rows[i].value.name
                    var counts  = data.rows[i].value.counts;
                    var pid     = data.rows[i].id;
                    if(!gPlotName){
                        if(count==0)gPlotName = pid;
                    }
                    count = count+1;
                    if(counts>0)updateItem(name,pid,counts);
                } 
                updatePlot(gPlotName);
            }
            else {
                document.getElementById('dataSetName').innerHTML = '<p style="color:#888888"> No Data Sets </p>';
                document.getElementById('countValue').innerHTML  = '<p style="color:#888888"> ------- </p>';

            }
       }});
   }
   gTabTimerID = setInterval("updateDataList()", 10000);
}

function plotClick(pn)
{
    saveSettings('plotID', pn);
    gPlotName = pn;
    updatePlot(pn);
}

function openPlot()
{
    window.location.href = "plot.html?dataSetID="+gPlotName + "&machineName="+gDataBaseName; 
};

function updatePlot(pn)
{
    if(gDataBaseExists){
        gPlotName = pn;
        gDataBase.openDoc(pn,"", { async:false, success: function(doc) {
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
            chart1.setTitle({ text: doc.name});
            
        }});
    }
}

$(document).ready(function() 
{
    window.alert = errorOverride; 
    setDataBaseExists(false);
    
	var anId = getUrlVars()["machineID"];
    anId = anId.replace("%20"," ");
    gMachineID = anId;

    $.couch.allDbs( { success : function(dbs) { loadDB(anId); } });
  
    $('.selectable').mouseover(function() {
		document.body.style.cursor = 'pointer';    
    });
    $('.selectable').mouseleave(function() {
		document.body.style.cursor = 'default';    
    });

    showHideAll();
    
    //CLOSING POPUP  
    //Click the x event!  
    $("#popupContactClose").click(function(){  
        disablePopup();  
    });  
    //Click out event!  
    $("#backgroundPopup").click(function(){  
        disablePopup();  
    });  
    setUpDataChart();

 });  
 
function openInfo(name,str)
{
    centerPopup();  
    loadPopup();  
 
    document.getElementById('popupDescription').innerHTML = name + str;
    document.getElementById('popupTitle').innerHTML = name;
}
 
function setDataBaseExists(state)
{  
    gDataBaseExists = state;
    showHideAll();
    if(state){
        clearInterval(gRecheckIntervalID);
    }
    else {
        clearInterval(gRecheckIntervalID);
        gRecheckIntervalID = setInterval("loadDBList()", 5000);
    }
}
 
 function showHideAll()
 {
     if(!gDataBaseExists){
        $('#machineInfoTable').hide();
        $('#alarmTable').hide();
        $('#processTable').hide();
        $('#dataSetTable').hide();
        $('#StatusLogTitle').hide();
        $('#StatusLog').hide();
        document.getElementById('maintitle').innerHTML = '' ;
    }
    else {
        $('#main').fadeIn(1000);
        $('#machineInfoTable').show();
        $('#alarmTable').show();
        $('#dataSetTable').show();
        $('#StatusLogTitle').show();
        $('#StatusLog').show();
        $('#processTable').show();
   }
}
 
 function setUpDataChart()
 {
    chart1 = new Highcharts.Chart({
        chart: {
            renderTo: 'histogramChart1',
            zoomType: 'x',
            spacingRight: 20,
            backgroundColor: '#ffffff',
            borderWidth: 0
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
                    linearGradient: [0, 0, 0, 300],
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


//$(function(){
//    $('#tabs').tabs();
//});

function updateItem(dataItemName,pid,count)
{
    var parentRef = document.getElementById('dataList');
    return update(parentRef,dataItemName,pid,count,0);
}

function update(parentRef,pathName,pid,count,level)
{
    var index = pathName.indexOf(',');
    if(index == -1){
        var children = parentRef.children;

        for(var i=0;i<children.length;i++){
            if(children[i].id == pathName){
                var item = children[i].getElementsByTagName('countItem')[0];
                item.innerHTML = count;
                return false;
            }
        }
        var leafTag = document.createElement('div');
        leafTag.id = pathName;
        level = level+1;
        leafTag.className ='leaf level'+level;
        leafTag.innerHTML = pathName+' ';
        leafTag.setAttribute('onClick','plotClick("'+pid+'")');
        
        var countTag = document.createElement('countItem');
        countTag.innerHTML = count+'<br/>';
        leafTag.appendChild(countTag);

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
                update(theContent,theRest,pid,count,level);
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
            
            update(nodeContentTag,theRest,pid,count,level);
            
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
    if(target.parentNode.id == 'dataList')return theFullName;
    else {
        var parentID = target.parentNode.id;
        var s;
        if(parentID) s = target.parentNode.id + ',' + theFullName;
        else s = theFullName;
        return fullName(target.parentNode,s);
    }
}




