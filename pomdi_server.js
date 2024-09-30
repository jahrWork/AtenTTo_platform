'use strict';


var arcos = require('./arcos.js'); 
var cloud = require('./cloud.js'); 

var Facility; 


function upload()
{
    var uploaded; 


   uploaded = cloud.upload(Facility, 23, 55);
  // console.log("uploaded =", uploaded);

   if (uploaded) {
       console.log("size uploaded =", Facility.data.length, Facility.time.length);
       Facility.data.length = 0;
       Facility.time.length = 0;
   }

}



// The server listens to AtenTTo and stores its real time data 
arcos.listen(8080);

// Every 300 mill seconds arcos data is recovered and sent to the web page if it is open 
setInterval(function (){ Facility = arcos.data(); }, 300);

// Facility data is uploaded to Dropbox at night 
setInterval(function () {  upload(); }, 59000);



