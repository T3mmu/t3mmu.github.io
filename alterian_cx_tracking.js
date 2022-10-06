// ----------------------------------------------------
// Name         : Teemu test CX tracking tag
// Created by   : Teemu Syrjala
// Created Date : 06-09-2022
// Last Modified: 06-10-2022
// Version      : v0.1
// Description  : Changes to capture identity off the query string and migrates to a new cookie name, with some bespoke functions
//--------------------------------------------------
(function gtm_Alterian_DDE_cx_track() {

    // set up global vars
    var loggingOn = true;
    var tagVersion = "0.1";
    var ddeURL = "https://dde.alterian.net/invoke/dev/trainingorchestration/";
    var track_rule_name = "track-web-teemu-s";
    var cookieName = "ddevisitorid";
    var newCookieName = "altcxvisitorid";
    var cookieTimeout = 365;
    var baseDomain = "syrjala.pro";
    // AlterianCX_channelagentid1 is used by the public track email rule to pass the recipient id to the website
    var emQueryStringName = 'AlterianCX_channelagentid1';
  
    // Function:         setCookie
    // Description:      function to set a cookies data
    var setCookie = function(cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
      var expires = "expires=" + d.toUTCString();
      document.cookie = cname + "=" + cvalue + "; " + expires + "; Path=/; Domain=" + baseDomain;
    };
  
    // Function:          getCookie
    // Description:       function to get a cookies data
    var getCookie = function(cname) {
      var name = cname + "=";
      var ca = document.cookie.split(";");
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
      }
      return "";
    };
  
    // Function:         getVisitorId
    // Description:      get visitor id from cookie, update the cookie expiry
    var getVisitorId = function(callback) {
      // new cookie exists and just needs updating to latest time
      var altcxvisitorid = getCookie(newCookieName);
      var ddevisitorid = getCookie(cookieName);
  
      if (altcxvisitorid != "") {
        logMsg("altcxvisitorid cookie exists, visitorid = " + altcxvisitorid);
      } else {
        // if no cookie exists create new one
        if (ddevisitorid == "") {
          altcxvisitorid = uuidv4();
          logMsg("no cookie - created one called " + newCookieName + "with value" + altcxvisitorid);
        }
        // old cookie is set but no new cookie does not exist - transfer cookie value
        else {
          logMsg("old cookie exists but new cookie does not transfering visitorid = " + ddevisitorid);
          // set the new cookie to the same value as the old
          altcxvisitorid = ddevisitorid;
        }
      }
      setCookie(newCookieName, altcxvisitorid, cookieTimeout);
      // set the time out on the old cookie to be 0
      setCookie(cookieName, "", 0);
      callback(altcxvisitorid);
    };
  
    // Function:         uuidv4
    // Description:      generate and return a guid
    function uuidv4() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
          v = c == "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  
    // Function:         logMsg
    // Description:      extract the logging so it can be enabled/disabled
    var logMsg = function(msg) {
      if (loggingOn == true) {
        console.log("ALT Tag v" + tagVersion + " : " + msg);
      }
    };
  
    // Function:         invokeRule
    // Description:      call a DDE rule and return its recommendation
    var invokeRule = function(ddeURL, ddeRule, JSONdata, callback) {
      var ret = jQuery.post(ddeURL + ddeRule, JSONdata, function(data) {
        if (data) {
          callback(data);
        } else {
          callback("");
        }
      });
    };
  
    // Function:         invokeRuleAJ
    // Description:      call a DDE rule (using AJAX) and return its recommendation
    var invokeRuleAJ = function(ddeURL, ddeRule, JSONdata, callback) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          //alert(this.responseText);
        }
      };
      xhr.open('POST', ddeURL + ddeRule, true);
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
      xhr.onload = function() {
        callback(this.responseText);
      };
      xhr.send(JSONdata);
    };
  
    //=========================================
    // look at the query string and retrieve any email identifiers for use as an ID
    var urlParams = new URLSearchParams(window.location.search);
    var altEmId = urlParams.get(emQueryStringName);
    isKnown = "0";
  
    //===============================
    // Send tracking data to dde
    getVisitorId(function(visitorid) {
      channelAgentId1 = visitorid;
      channelAgentId2 = '';
      if (altEmId) { // if there is an em ID parameter
        // set the email parameter into the channelAgentId1 slot and visitorid into the channelAgentId2 slot
        altEmId = decodeURIComponent(altEmId);
        channelAgentId1 = altEmId;
        channelAgentId2 = visitorid;
        isKnown = "1";
      } else {
        channelAgentId1 = visitorid;
      }
  
      var JSONData = JSON.stringify({
        AlterianCX_channelagentid1: channelAgentId1,
        AlterianCX_channelagentid2: channelAgentId2,
        AlterianCX_isknown: isKnown,
        AlterianQueue_channel: "web",
        AlterianCX_url: document.location.href,
        AlterianCX_referrer: document.referrer
      });
      invokeRuleAJ(ddeURL, track_rule_name, JSONData, function(noReturnData) {});
    });
}());