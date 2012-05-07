// ____________________________________________________________________________________
var gMachineInfoTimerID;
var gHTMLTimerID;
var firstLoad = true;
var firstHistoryLoad = true;
var UTCOffset;
var gHistoryTimerID;
var machineInfo = [];
var runInfo     = [];
var historyList = [];
var historyStart = [];
var historyEnd = [];
// ____________________________________________________________________________________

function loadDBs () {
    clearInterval(gMachineInfoTimerID);
    $.couch.allDbs( { success : function(dbs) { loadDBList(dbs); } });
    gMachineInfoTimerID = setInterval('loadDBs()', 2000);
} 

function loadDBList(dbs){
    dbs.forEach(function(d1) {
        if(d1 != '_users' && d1 != 'orcas' && !d1.match("history")){
            updateMachineInfo(d1);
         }
         else if(d1.match("history")){
            updateHistoryInfo(d1);
            historyList[d1] = d1;
        }
    });
    
}

function errorOverride(strMessage)
{ 
} 

function machineClick(machineID){
    window.location.href = "runInfo.html?machineID="+machineID; 
}

function historyClick(machineID){
    window.location.href = "history.html?machineID="+machineID;  
}

// ____________________________________________________________________________________
function updateMachineInfo(aDataBaseName)
{    
    var aDataBase = $.couch.db(aDataBaseName);

    aDataBase.view(aDataBaseName +"/machineinfo",{success: function(doc) { 
        machineInfo[aDataBaseName] = doc.rows[0].value
    }});

    aDataBase.view(aDataBaseName +"/runinfo",    {success: function(doc) { 
       runInfo[aDataBaseName] = doc.rows[0].value
    }});
}

function updateHistoryInfo(aDataBaseName)
{    
    var aDataBase = $.couch.db(aDataBaseName);
    
    aDataBase.view(aDataBaseName+"/adcs", {limit:"1", include_docs:"true", descending:"false", success:function(response) {
        
        jQuery.each(response.rows, function(i, row) {
            var doc     = row['doc'];
            var t       = doc.time*1000;
            historyStart[aDataBaseName] = formatDate(new Date(t), "mm/dd/yy hh:nn:ss");
        });
    }});
    
    aDataBase.view(aDataBaseName+"/adcs", {limit:"1", include_docs:"true", descending:"true", success:function(response) {
        jQuery.each(response.rows, function(i, row) {
            var doc     = row['doc'];
            var t       = doc.time*1000;
            historyEnd[aDataBaseName] = formatDate(new Date(t), "mm/dd/yy hh:nn:ss");
       });
    }});

}

function updateHTML()
{
    clearInterval(gHTMLTimerID);
    
    var content = "<table>";
    var count = 0;
   
    for(dbName in machineInfo) {
        count = count+1;
        var mm = machineInfo[dbName];
        var rr = runInfo[dbName];
        var machineID = mm["machine_id"];
		var runStateIndex = rr["state"];
		var runStateStr = translateRunState(runStateIndex);
        var upTime = mm["uptime"];
        var upTimeSec = convertSeconds(upTime);
        var theName = "'"+dbName+"'";
 		content += "<tr onmouseover=\"this.className = 'hlt';document.body.style.cursor = 'pointer';\" onmouseout=\"this.className = '';document.body.style.cursor = 'default'\">";
        content += '<td id=orcaListName onclick = "machineClick(' + theName + ')">' +
                    mm["name"] + '</td>' +
                   '<td id=orcaListState class="greyField">' + runStateStr + '</td>' +
                   '<td id=orcaListExperiment class="greyField">' + rr["experiment"] + '</td>' +
                   '<td id=orcaListUptime class="greyField">' + upTimeSec + '</td>' +
                   '<td id=orcaListVersion class="greyField">' + mm["version"] + '</td>' +
                   '<td id=orcaListIpNumber class="greyField">' + mm["ip_address"] + '</td>';
        
  		content += "</tr>";
    }
    content += "</table>";
    if(count>0){
        document.getElementById('machineList').innerHTML = content;
    }
	else {
        if(firstLoad){
            document.getElementById('machineList').innerHTML = "Loading";
            firstLoad = false;
        }
        else {
            document.getElementById('machineList').innerHTML = "There are no ORCAs in this database";
        }
    }

    gHTMLTimerID = setInterval("updateHTML()", 2000);
}

function updateHistoryHTML()
{
    
   clearInterval(gHistoryTimerID);
     var content = "<table>";
    var count = 0;
  
    for(dbName in historyList) {
        count = count+1;
        var theName = "'"+dbName+"'";
        
        var start = historyStart[dbName];
        if(start == undefined)start = '--';
        
        var end   = historyEnd[dbName];
        if(end == undefined)end = '--';
        
 		content += "<tr onmouseover=\"this.className = 'hlt';document.body.style.cursor = 'pointer';\" onmouseout=\"this.className = '';document.body.style.cursor = 'default'\">";
        content += '<td id=historyListName onclick = "historyClick(' + theName + ')">' + dbName + '</td>' +
                   '<td id=historyTime class="greyField">' + start + '</td>' +
                   '<td id=historyTimeSep class="greyField">' + 'to' + '</td>' +
                   '<td id=historyTime class="greyField">' + end + '</td>' +
                   '<td id=historyTime class="greyField">' + ' ' + '</td>';
       
  		content += "</tr>";
    }
    content += "</table>";
    if(count>0){
        document.getElementById('historyList').innerHTML = content;
    }
	else {
        if(firstHistoryLoad){
            document.getElementById('historyList').innerHTML = "Loading";
            firstHistoryLoad = false;
        }
        else {
            document.getElementById('historyList').innerHTML = "There are no Histories in this database";
        }
    }
    gHistoryTimerID = setInterval("updateHistoryHTML()", 2000);

}


$(document).ready(function() 
{
    var currentTime   = new Date();
    UTCOffset    = (currentTime.getTimezoneOffset()) * 60; //offset to UT in seconds
    window.alert = errorOverride; 
    document.getElementById('maintitle').innerHTML = 'ORCA List' ;

    $.couch.allDbs( { success : function(dbs) { loadDBList(dbs); } });
  
    $('.selectable').mouseover(function() {
		document.body.style.cursor = 'pointer';    
    });
    $('.selectable').mouseleave(function() {
		document.body.style.cursor = 'default';    
    });
    loadDBs();
    
    gHTMLTimerID = setInterval("updateHTML()", 1000);
    gHistoryTimerID = setInterval("updateHistoryHTML()", 1000);

 });  
  
 

function translateRunState(type)
{
    if(type == 0)      return "Stopped";
    else if(type == 1) return "Running";
    else if(type == 2) return "Starting";
    else if(type == 3) return "Stopping";
    else if(type == 4) return "Between Sub Runs";
    return "unKnown";
}


var formatDate = function (formatDate, formatString) {
	if(formatDate instanceof Date) {
		var months = new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");
		var yyyy = formatDate.getFullYear();
		var yy = yyyy.toString().substring(2);
		var m = formatDate.getMonth();
		var mm = m < 10 ? "0" + m : m;
		var mmm = months[m];
		var d = formatDate.getDate();
		var dd = d < 10 ? "0" + d : d;
		
		var h = formatDate.getHours();
		var hh = h < 10 ? "0" + h : h;
		var n = formatDate.getMinutes();
		var nn = n < 10 ? "0" + n : n;
		var s = formatDate.getSeconds();
		var ss = s < 10 ? "0" + s : s;

		formatString = formatString.replace(/yyyy/i, yyyy);
		formatString = formatString.replace(/yy/i, yy);
		formatString = formatString.replace(/mmm/i, mmm);
		formatString = formatString.replace(/mm/i, mm);
		formatString = formatString.replace(/m/i, m);
		formatString = formatString.replace(/dd/i, dd);
		formatString = formatString.replace(/d/i, d);
		formatString = formatString.replace(/hh/i, hh);
		formatString = formatString.replace(/h/i, h);
		formatString = formatString.replace(/nn/i, nn);
		formatString = formatString.replace(/n/i, n);
		formatString = formatString.replace(/ss/i, ss);
		formatString = formatString.replace(/s/i, s);

		return formatString;
	} else {
		return "";
	}
}

