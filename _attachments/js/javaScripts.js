var gDataCatalog;
var gDataList;

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}


function runState(type,offline)
{
    var extra;
    if(offline) extra = " (Offline)";
    else extra = "";
    if(type == 0)      return "Stopped";
    else if(type == 1) return "Running" + extra;
    else if(type == 2) return "Starting" + extra;
    else if(type == 3) return "Stopping";
    else if(type == 4) return "Between Sub Runs";
    return "unKnown";
}

function convertSeconds(seconds)
{
    var days    = parseInt(seconds / (24*60*60));
    seconds -= days * 24*60*60;
    var hours    = parseInt(seconds / (60*60));
    seconds -= hours * 60*60;
    var minutes    = parseInt(seconds / 60);
    seconds -= minutes * 60;
    return sprintf('%02d %02d:%02d:%02d',days,hours,minutes,seconds);
}

function runNumber(run,subrun)
{
    if(subrun==0)  return run;
    else           return run + "." + subrun;
}

function node(name,count)
{
    this.name=name;
    this.count=count;
}

function hasClassName(objElement, strClass){
   if(objElement.className){
      var arrList = objElement.className.split(' ');
      var strClassUpper = strClass.toUpperCase();
      for ( var i = 0; i < arrList.length; i++ ){
         if ( arrList[i].toUpperCase() == strClassUpper )return true;
      }
    }
   return false;
}

function addClassName(objElement, strClass, blnMayAlreadyExist){
    if ( objElement.className ){
        var arrList = objElement.className.split(' ');
        if ( blnMayAlreadyExist ){
            var strClassUpper = strClass.toUpperCase();
            for ( var i = 0; i < arrList.length; i++ ){
                if ( arrList[i].toUpperCase() == strClassUpper ){
                    arrList.splice(i, 1);
                    i--;
                }
            }
        }
        arrList[arrList.length] = strClass;
        objElement.className = arrList.join(' ');
    }
    else {
        objElement.className = strClass;
    }

}

function removeClassName(objElement, strClass){
    if ( objElement.className ){
        var arrList = objElement.className.split(' ');
        var strClassUpper = strClass.toUpperCase();
        for ( var i = 0; i < arrList.length; i++ ){
            if ( arrList[i].toUpperCase() == strClassUpper ){
                arrList.splice(i, 1);
                i--;
            }
        }
        objElement.className = arrList.join(' ');
    }
}

function saveSettings(key, value)
{
	// put the new value in the object
	dataListStatus[key] = value;
	// create an array that will keep the key:value pairs
	var listData = [];
	for (var key in dataListStatus) listData.push(key+":"+dataListStatus[key]);
		
	// set the cookie expiration date 1 year from now
	var today = new Date();
	var expirationDate = new Date(today.getTime() + 365 * 1000 * 60 * 60 * 24);
	// write the cookie
	document.cookie = gDataBaseName + "=" + escape(listData.join("|")) + ";expires=" + expirationDate.toGMTString();
}

function loadSettings()
{
    var tabIndex = parseInt($.cookie( 'stickyTab'));
    $('#tabs').tabs('select', tabIndex);
    handleTabSwitch(tabIndex);

	// prepare the object that will keep the node states
	dataListStatus = {};
	
	// find the cookie name
	var start = document.cookie.indexOf(gDataBaseName + "=");
	if (start == -1) return;
	
	// starting point of the value
	start += gDataBaseName.length+1;
	
	// find end point of the value
	var end = document.cookie.indexOf(";", start);
	if (end == -1) end = document.cookie.length;
	
	// get the value, split into key:value pairs
	var cookieValue = unescape(document.cookie.substring(start, end));
	var listData = cookieValue.split("|");
	
	// split each key:value pair and put in object
	for (var i=0; i< listData.length; i++)
	{
		var pair = listData[i].split(":");
		dataListStatus[pair[0]] = pair[1];
	}
}

function serverityName(a)
{
	if(a == 0)      return "Information";
	else if(a == 1) return "Setup";
	else if(a == 2) return "Range";
	else if(a == 3) return "Hardware";
	else if(a == 4) return "RunInhibitor";
	else if(a == 5) return "DataFlow";
	else if(a == 6) return "Important";
	else if(a == 7) return "Emergency";
    else return "Unknown";
}

$( function()
{
    $( '#tabs' ).tabs( {
        select: function( e, ui ){
            $.cookie( 'stickyTab', ui.index );
            handleTabSwitch(ui.index);
        }
    } );
} );

