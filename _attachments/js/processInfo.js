

var gDataBaseName;
var gProcessIndex;
var gProcessTimerID;

$(document).ready(function () {

	var anId = getUrlVars()["processIndex"];
 	var machineName = getUrlVars()["machineName"];
    machineName = machineName.replace("%20"," ");
    gDataBaseName = machineName;
    gProcessIndex = anId;
    document.getElementById('maintitle').innerHTML = "Process";
    $('#nav').append('<li><a ONCLICK="history.go(-1)">'+ machineName + '</a></li>');
 
    updateProcess();

});

function updateProcess() {
    clearInterval(gProcessTimerID);
	var count = 0;
    var numRunning = 0;
    var content = "<table>";
    var log = "<p>";
    gDataBase = $.couch.db(gDataBaseName);
    gDataBase.view(gDataBaseName +"/processes",{success: function(data) {
        if(gProcessIndex <= data.total_rows){
            var processlist = data.rows[0].value.processlist;
            var i = gProcessIndex;
            var title = processlist[i].title;
            var state = processlist[i].state;
            var pid   = processlist[i].id;
            var data  = processlist[i].data;
            
            data      = data.replace(new RegExp( "\\n", "g" ),"<br/>");
            log += data;
            content += "<tr>";

            content += "<td  id=\"processNameCol\" onClick= \"openInfo('";
            content += title + "','" + data;
            content += "')\">";
            content += title;
            content += "</td>"

            content += "<td  id=\"processStateCol\" onClick= \"openInfo('";
            content += title + "','" + data;
            content += "')\">";
            if(state){
                content += "Running";
                numRunning += 1;
            }
            else content += "Stopped";
            content += "</td>"
            content += "</tr>";
            content += "</table>";
            log += "</p>";

            document.getElementById('ProcessTable').innerHTML     = content;
            document.getElementById('ProcessLog').innerHTML     = log;

        }
	}});


    gProcessTimerID = setInterval("updateProcess()", 5000);
}
