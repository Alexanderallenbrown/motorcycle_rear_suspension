//four bar props


//motorcycle rear suspension


///2D simulation using MC body as fixed link.

//links:
//B (body)
//A (swingarm)
//L (linkage)
//D (dogbone)
//S (shock)

//give 3 points on swingarm: pivot A, linkage mount B, axle C
//in local coords. x fwd, y up.
//for swingarm, p1 is pivot, p2 is dogbone attach, p3 is axle
const swingarm = [[0,0],[-.17,0.07],[-.57,0,0]]
//for linkate, p1 is pivot, p2 is dogbone attach, p3 is shock attach
const linkage = [[0,0],[-.0635,-.013],[-.1,0]]
//for chassis, p1 swingarm pivot, p2 is linkage pivot, p3 is shock pivot
const chassis = [[0,0],[0.0,-0.076],[0,.33]]

const springrate = 63000 //N/m
const suspPreload = .03 //m

//dogbone length
const dogbonelength = 0.17
//free length of shock
const freeshocklength = .437

//create a global variable to hold the suspension object.
var suspConfig = {};
suspConfig.swingarm = swingarm
suspConfig.linkage = linkage
suspConfig.chassis = chassis
suspConfig.dogbonelength = dogbonelength
suspConfig.freeshocklength = freeshocklength
suspConfig.springrate = springrate
suspConfig.suspPreload = suspPreload

//update the HTML to reflect this initial config.
// updateSuspTextBoxes(suspConfig)

var savedConfig = varcopy(suspConfig)

updateSuspTextBoxes(suspConfig)


//create a variable to hold suspension object
var susp;

var tnow =0;
var told = 0;
var dt = .015


//variables to interact with the user:
var wheelslider = document.getElementById("wheelslider")
var autosolve_checkbox = document.getElementById("autoSolve")
var wheelpos = 0;
var chassisroll = 0;
var rackdisp = 0;



let inconsolata;
function preload() {
  inconsolata = loadFont('assets/Inconsolata.otf');
}

/////////////////////////////////////////

function setup() {

  var cnv = createCanvas(windowWidth/2, 500);//,WEBGL);
  cnv.parent('sketch-holder')
  initLineChart([],"Choose plot options below, then hit 'generate plot' ","Independent variable","Dependent Variable")
  susp = new Suspension(suspConfig);
  susp.draw()
  print(wheelslider)
  print(autosolve_checkbox)
  //camera(-1000,-1000,2500,-500,0,0,0,1,0)

  textFont(inconsolata);
  textSize(10);
  textAlign(CENTER, TOP);
}

function draw() {
  tnow = millis()/1000.0
  dt = tnow-told
  told = tnow
  background(50);
  // setAttributes('antialias', true);
  // frustum(-width/2, width/2, -height/2, height, 0, max(width, height))
  fill(0)
  stroke(0)




  if(!simulating){
      //see if we want auto-solve on
      //use the slider to update the wheel position.


      var autosolve_now = autosolve_checkbox.checked;
      if(autosolve_now){
        //find motion ratio:
        susp.updateSwingarm(wheelpos+.01)
        susp.solve();
        susp.shockpos_old = susp.shockCompression
        susp.wheelpos_old = wheelpos+.01

        susp.updateSwingarm(wheelpos)
        susp.solve();
        susp.MR = .01/(susp.shockpos_old-susp.shockCompression)
        print(str(susp.MR))

      }

      susp.draw();
  }
  else{

      ////we are supposed to be running an automatic simulation now.
      simstr = "simulating"

      if(globalXData.length<=simlength){
        // simstr+="."
        // print(simstr)
        // print(globalXData.length)
        ////check to see what the independent variable is
        simxtype = document.getElementById("chart_x_axis").value;
        // print("Read Sim X type: "+simxtype)
        if(simxtype == "Jounce"){
          //now we set the simulation's input to the last element in the input array
          //TODO UNIT CHECK
          susp.updateSwingarm(globalXData.slice(-1)[0])
          //find motion ratio:
          susp.updateSwingarm(globalXData.slice(-1)[0]+.01)
          susp.solve();
          susp.shockpos_old = susp.shockCompression
          susp.wheelpos_old = globalXData.slice(-1)[0]+.01

          susp.updateSwingarm(globalXData.slice(-1)[0])
          susp.solve();
          susp.MR = .01/(susp.shockpos_old-susp.shockCompression)
          // print(str(susp.MR))
          if(globalXData.length==1){
            susp.solve();
            // susp.draw();
          }
        }
        else{
          simulating = false;
          print("Simtype Not Supported (independent)")
        }
        ////now the simulation should be set up to solve with correct input.
        susp.update();
        // susp.draw();


        ///// now the simulation should be updated. Add the desired output to the global Y data vector
        simytype = document.getElementById("chart_y_axis").value;
        if(simytype== "Shock_Compression"){
          globalYData.push(-(susp.shockCompression))
        }
        else if(simytype == "Motion_Ratio"){
          globalYData.push((susp.MR))
        }
        else if(simytype == "Wheel_Force"){
          globalYData.push((susp.shockForce/susp.MR)) //this.shockForce/this.MR
        }
        else if(simytype=="Wheel_Rate"){
          globalYData.push((susp.springrate)/susp.MR)
        }
        else{
          print("Simtype Not Supported (dependent)")
        }
        //add a new element to globalXdata if we're not at the end of the simulation.
        //if(!(globalXData.length==simlength)){
        //if(susp.itercount<susp.iter_limit){
        globalXData.push((globalXData.slice(-1)[0]+input_increment));
        //}
      }
      //turn off sim
      else{
        //this means that the simulation just ended. turn these into data for the chart.
        simulating = false;
        newChartData = generateData(globalXData,globalYData);
        suspPlot.data.datasets[0].data = newChartData;
        suspPlot.options.scales.yAxes[0].scaleLabel.labelString = simytype;
        suspPlot.options.scales.xAxes[0].scaleLabel.labelString = simxtype;
        suspPlot.options.title.text = simytype+" vs. "+simxtype;
        document.getElementById("plotfilename").value = simytype+"_vs_"+simxtype
        suspPlot.update();
      }
  }







/////// END DRAW ////////
}


















function reloadConfig(){
  suspConfig = varcopy(savedConfig)
  updateSuspTextBoxes(savedConfig)
  updateGeometry()
  susp.solve()
}

//callbacks for these functions:
wheelslider.oninput = function(){
  wheelpos = this.value/1000.0;
  document.getElementById("wheelsliderval").innerHTML = parseFloat(wheelpos/.0254).toPrecision(3)
  //print("wheel pos udpate: " +str(this.value))
}


function windowResized() {
  resizeCanvas(windowWidth/2, 750);
  susp.fbscale = 500;//windowWidth//2*windowWidth
}

function saveConfig(){
  myConfig = getSuspPointsFromHTML()
  downloadJSON(JSON.stringify(myConfig,null,"\t"),document.getElementById("configfilename").value+".txt")

}


//this is the callback fro the load config button.
function loadConfig(){
  // document.getElementById('attachment').click();
  const content = document.querySelector('.content');
  const [file] = document.querySelector('input[type=file]').files;
  const reader = new FileReader()
  reader.addEventListener("load", () => {
    // this will then display a text file
    print("NEW CONFIG LOADING:")
    print(reader.result);
    newConfig = JSON.parse(reader.result)
    savedConfig = newConfig
    updateSuspTextBoxes(newConfig)
    updateGeometry()

  }, false);

  if (file) {
    reader.readAsText(file);
  }



}

function updateIndependentRange(){
  var simxtype = document.getElementById("chart_x_axis").value;
  document.getElementById("input_min").value="0"
  document.getElementById("input_inc").value="1"
  document.getElementById("input_max").value="300"


}



//this is the callback for the update button.
function updateGeometry(){
  //zero out all sliders TODO
  document.getElementById("wheelslider").value = 0
  wheelpos = 0

  //get a new global suspension config.
  suspConfig = getSuspPointsFromHTML();

  //update suspension object as appropriate
  //susp is a global variable. Not sure this is really the right way to do this...
  susp.swingarm = suspConfig.swingarm
  susp.linkage = suspConfig.linkage
  susp.chassis = suspConfig.chassis
  susp.dogbonelength = suspConfig.dogbonelength
  susp.freeshocklength = suspConfig.freeshocklength
  susp.springrate = suspConfig.springrate
  susp.suspPreload = suspConfig.suspPreload
  //now solve suspension
  susp.solve()

}


//this is a utility function to download config as a JSON text file.
function downloadJSON(content, fileName) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


///this takes a JSON suspension config and updates the HTML textboxes to match.
function updateSuspTextBoxes(myConfig){
    //swingarm pivot in chassis frame
    document.getElementById("csp-x").value = myConfig.chassis[0][0]
    document.getElementById("csp-y").value = myConfig.chassis[0][1]
    //linkage pivot in chassis frame
    document.getElementById("clp-x").value = myConfig.chassis[1][0]
    document.getElementById("clp-y").value = myConfig.chassis[1][1]
    //shock pivot in chassis frame
    document.getElementById("cshp-x").value = myConfig.chassis[2][0]
    document.getElementById("cshp-y").value = myConfig.chassis[2][1]
    //swingarm dogbone pivot in swingarm frame
    document.getElementById("sdp-x").value = myConfig.swingarm[1][0]
    document.getElementById("sdp-y").value = myConfig.swingarm[1][1]
     //swingarm axle pivot in swingarm frame
    document.getElementById("sap-x").value = myConfig.swingarm[2][0]
    document.getElementById("sap-y").value = myConfig.swingarm[2][1]
    //linkage dogbone pivot (linkage frame)
    document.getElementById("ldp-x").value = myConfig.linkage[1][0]
    document.getElementById("ldp-y").value = myConfig.linkage[1][1]
    //upright upper ball joint point
    document.getElementById("lsp-x").value = myConfig.linkage[2][0]
    document.getElementById("lsp-y").value = myConfig.linkage[2][1]

    document.getElementById("dogbone-length").value = myConfig.dogbonelength
    document.getElementById("shock-length").value = myConfig.freeshocklength
    document.getElementById("spring-preload").value = myConfig.suspPreload
    document.getElementById("spring-rate").value = myConfig.springrate

}


//this creates a JSON suspension config object.
function getSuspPointsFromHTML(){
  //get values one at a time from the text boxes
  //swingarm pivot in chassis frame
  var csp_x = float(document.getElementById("csp-x").value)
  var csp_y = float(document.getElementById("csp-y").value)
  //linkage pivot in chassis frame
  var clp_x = float(document.getElementById("clp-x").value)
  var clp_y = float(document.getElementById("clp-y").value)
  //shock pivot in chassis frame
  var cshp_x = float(document.getElementById("cshp-x").value)
  var cshp_y = float(document.getElementById("cshp-y").value)
  //swingarm dogbone pivot in swingarm frame
  var sdp_x = float(document.getElementById("sdp-x").value)
  var sdp_y = float(document.getElementById("sdp-y").value)
   //swingarm axle pivot in swingarm frame
  var sap_x = float(document.getElementById("sap-x").value)
  var sap_y = float(document.getElementById("sap-y").value)
  //linkage dogbone pivot (linkage frame)
  var ldp_x = float(document.getElementById("ldp-x").value)
  var ldp_y = float(document.getElementById("ldp-y").value)
  //upright upper ball joint point
  var lsp_x = float(document.getElementById("lsp-x").value)
  var lsp_y = float(document.getElementById("lsp-y").value)

  var dogbonelength = float(document.getElementById("dogbone-length").value)
  var freeshocklength = float(document.getElementById("shock-length").value)
  var suspPreload = float(document.getElementById("spring-preload").value)
  var springrate = float(document.getElementById("spring-rate").value)

  const newConfig = {}

  //fill in new cfg
  newConfig.chassis = [[csp_x,csp_y],[clp_x,clp_y],[cshp_x,cshp_y]]
  newConfig.linkage = [[0,0],[ldp_x,ldp_y],[lsp_x,lsp_y]]
  newConfig.swingarm = [[0,0],[sdp_x,sdp_y],[sap_x,sap_y]]
  newConfig.dogbonelength = dogbonelength
  newConfig.freeshocklength = freeshocklength
  newConfig.suspPreload = suspPreload
  newConfig.springrate = springrate

  return newConfig
}



///// VARIABLES FOR PLOTTING AND DATA COLLECTION
var suspPlot;
var globalXData = [];
var globalYData = [];
var globalCurrentX = [];
var globalCurrentY = [];
var input_min = 0;
var input_max = 0;
var input_increment = 0;
var simlength = 0;
// var simdata = '';
// var chartdata = new Object();
// var chartdata ={};


//////// VARIABLE TO LOCK OUT USER INPUT
var simulating = false;



function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
};


function savePlotData(){

  var simdata = ''

  for(let k=0;k<globalYData.length;k++){
    simdata+=str(globalXData[k])+"\t"+str(globalYData[k])+"\r\n"
  }

  var blob;
  if (typeof window.Blob == "function") {
    blob = new Blob([simdata], {
      type: "text/latex"
    });
  } else {
    var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder;
    var bb = new BlobBuilder();
    bb.append(simdata);
    blob = bb.getBlob(simdata);
  }
  var URL = window.URL || window.webkitURL;
  var bloburl = URL.createObjectURL(blob);
  var anchor = document.createElement("a");
  if ('download' in anchor) {
    anchor.style.visibility = "hidden";
    anchor.href = bloburl;
    anchor.download = document.getElementById("plotfilename").value+".txt";
    document.body.appendChild(anchor);
    var evt = document.createEvent("MouseEvents");
    evt.initEvent("click", true, true);
    anchor.dispatchEvent(evt);
    document.body.removeChild(anchor);
  } else if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, "SimData.txt");
  } else {
    location.href = bloburl;
  }


}


//call this plot when options have changed.
function generateNewPlot(){
  //get y axis and x axis from dropdown. Use if statements to generate data and labels
  globalYData = [];
  globalXData = [];
  input_min = float(document.getElementById("input_min").value)/1000.0;
  input_max = float(document.getElementById("input_max").value)/1000.0;
  input_increment = float(document.getElementById("input_inc").value)/1000.0;
  simlength = int((input_max-input_min)/input_increment);
  print("Sim Length: "+str(simlength))
  globalXData.push(input_min);
  susp.solve();
  simulating = true;

}



/////// this function puts data in the format required by chartJS.
/////// you can update the chart's data with the result of this function, then call chart.update()
function generateData(xdata,ydata) {
            var data = [];
            for (var i = 0; i < ydata.length; i++) {
                data.push({
                    x: xdata[i],
                    y: ydata[i]
                });
            }
            return data;
        }


/////////////// PLOT PLOTTING plot plotting make chart
function initLineChart(data, myTitle, xlabel, ylabel) {
        canv = document.getElementById("chartCanvas");
        var config = {  // Chart.js configuration, including the DATASETS data from the model data
          type: "scatter",
          title: myTitle,

          data: {
        datasets: [{
            // xAxisID: "Time (s)",
            // yAxisID: "Output",
            pointBackgroundColor: 'rgba(0, 0, 0, 1)',
            showLine: true,
            borderColor: 'rgba(0, 0, 0, 1)',
            fill: false,
            label: '',
            data: data
        }]
    },
          options: {
            maintainAspectRatio: false,
          responsive: true,
             scales: {
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: (ylabel),
              }
            }],
             xAxes: [{
              scaleLabel: {
                display: true,
                labelString: (xlabel),
              }
            }]
        },
             title: {
            display: true,
            text: myTitle
        }
          }
        };

        suspPlot = new Chart(canv, config);

        return canv;
      }





function varcopy(x) {
    return JSON.parse( JSON.stringify(x) );
}

////callback for the "solve once" button
function solveSuspension(){
  susp.update()
  // susp.solveRough()
  // susp.draw()
}


function Suspension(suspConfig){
  //local coordinate representations of each link
  this.swingarm = suspConfig.swingarm
  this.linkage = suspConfig.linkage
  this.chassis = suspConfig.chassis
  this.dogbonelength = suspConfig.dogbonelength
  this.freeshocklength = suspConfig.freeshocklength
  this.springrate = suspConfig.springrate
  this.suspPreload = suspConfig.suspPreload
  this.shockForce = 0
  this.shockCompression = 0
  this.MR = 0
  this.wheelpos = 0
  this.wheelpos_old = 0
  this.shockpos_old = 0
  this.swingarm_pivot_static_height = .48//.426 //meters, height of swingarm pivot above ground
  this.wheel_diameter = .6

  //now create global coordinates for each body
  //format [X,Y,theta] for each body
  var chassisGlobal= [0,0,0]
  var swingarmGlobal = [chassisGlobal[0]+this.chassis[0][0],chassisGlobal[1]+this.chassis[0][1],0]
  var linkageGlobal = [chassisGlobal[0]+this.chassis[1][0],chassisGlobal[1]+chassis[1][1],0]

  this.swingarmGlobal = swingarmGlobal
  this.chassisGlobal = chassisGlobal
  this.linkageGlobal = linkageGlobal

  //display-level variables
  this.fbscale = 500;//windowWidth //adjust this for drawing
  this.ox = 500 //adjust this for drawing
  this.oy = 200//adjust this for drawing
  this.debug = true

  //guesses for q, our dependent gen coords
  //this.q = [this.lowerAglobal[3],this.lowerAGlobal[4],this.lowerAGlobal[5],this.upperAGlobal[3],this.upperAGlobal[4],this.upperAGlobal[5],this.uprightGlobal[3],this.uprightGlobal[4],this.uprightGlobal[5],this.uprightGlobal[0],this.uprightGlobal[1]]
  //constraint values
  this.eps = .0001 //this is the perturbation size
  this.resid_thresh = .0001
  this.iter_limit = 100
  this.itercount = 0

  this.updateSwingarm = function(wheelpos){
    ///this function takes a wheel position (global)
    //turns that into a swingarm angle.
    //how high is pivot above ground now?
    pivot_height = this.swingarm_pivot_static_height-wheelpos
    //what is the triangle vertical? positive when swingarm angled up towards pivot.
    triangle_vertical = pivot_height - this.wheel_diameter/2
    //now find the angle. positive will be same orientation as below, since swingarm x axis points right.
    swingarm_length = this.swingarm[0][0]-this.swingarm[2][0]
    swingarm_angle = math.asin(triangle_vertical/swingarm_length)
    this.swingarmGlobal[2] = swingarm_angle
    //print("swingarm angle: "+str(swingarm_angle))
  }

  this.getqArrayFromGlobals = function(){
    // print(this.lowerAGlobal)
    var q = this.linkageGlobal[2]
    return q
  }

  this.updateGlobalPositionsFromQ = function(q){
    //q is just the linkage angle!
    // print("q is: "+str(q))
    this.linkageGlobal = [this.linkageGlobal[0],this.linkageGlobal[1],q]
  }



  //https://www.johndcook.com/blog/2018/05/05/svd/ <-use SVD to get Moore-Penrose.
  this.shultzInverse = function(M){
    iM = math.eye(M._size[1])
    for(let k=0;k<10;k++){
      iM = math.multiply(iM,math.subtract(math.multiply(math.eye(M._size[0]),2),math.multiply(M,iM)))
    }
    return iM
  }

  //makes a rotation matrix
  // http://web.mit.edu/2.05/www/Handout/HO2.PDF
  this.makeRotation = function(angle){
    const R = math.matrix([[cos(angle),-sin(angle)],[sin(angle),cos(angle)]])
    return R
  }

  //this function calculates global position given local. global origin in form [xyzrpa]
  this.calcGlobal = function(origin, qlocal){
    pglobal = []
    //create tall vector for rotation operation
    localvec = math.matrix([[qlocal[0]],[qlocal[1]]])
    // if(this.debug){print("localvec: "+str(localvec))}
    //create rotation matrix
    R = this.makeRotation(origin[2])
    // if(this.debug){print("roll: "+str(origin[3])+", pitch: "+str(origin[4])+", yaw:"+str(origin[5]))}
    // if(this.debug){print("R: "+str(R))}
    //rotate point
    rotvec = math.multiply(R,localvec)
    // if(this.debug){print("localvec: "+str(rotvec))}
    //create plain array with translation by body origin
    pglobal = [origin[0]+rotvec.subset(math.index(0,0)),origin[1]+rotvec.subset(math.index(1,0))]

    //return global position of point
    return pglobal
  }

  //loops through an array of 3-arrays, converting local coordinates into global coordinates of each point.
  this.getDrawPoints = function(origin,plocal){
    var pglobal = [];
    for(let k = 0;k<plocal.length;k++){
      //pull out this local xyz array
      thislocal = plocal[k]
      //now pass into the local to global function
      thisglobal = this.calcGlobal(origin,plocal[k])
      pglobal.push(thisglobal)
    }
    return pglobal
  }



  this.calcConstraints = function(q){
    // actual physical constraints are:
    // revolute chassis p1 to swingarm p1 (not a real constraint, can force)
    // revolute chassis p2 to linkage p1 (not a real constraint, can force)
    // distance swingarm p2 to linkage p2

    //using the current q, get local origin (global) variables for each link
    //this allows us to use the nice functions we have to calculate constraints using a 'local' q
    //which is required for calculating numerical Jacobian, for example

    //calculate distance (double revolute) D1
    //this constraint tells us that the distance between LBJ and UBJ (between )
    var linkageGlobal = [this.linkageGlobal[0],this.linkageGlobal[1],q]
    d_link = this.calcGlobal(linkageGlobal,this.linkage[1])
    d_swing = this.calcGlobal(this.swingarmGlobal,this.swingarm[1])
    phi1 = math.pow(d_link[0]-d_swing[0],2)+math.pow(d_link[1]-d_swing[1],2) - math.pow(this.dogbonelength,2)

    constraints = phi1//math.matrix([[phi1]])
    // print(str(constraints))
    return constraints
  }


this.calcJac = function(){
      qlocal = varcopy(this.q)//perturb one of the coords in the local copy
      qlocal+=this.eps
      //evaluate the constraints based on perturbed q
      constraints_local = this.calcConstraints(qlocal)
      //print("constraints: "+str(this.constraints)+", pertubed: "+str(constraints_local))
      // print("difference: "+str(this.constraints-constraints_local))
      // print("q diff: "+str(qlocal - this.q))
      Jac = (constraints_local-this.constraints)/this.eps
return Jac
}

this.iterate = function(){
  //this.getqArrayFromGlobals()

  Jac = this.calcJac()
  //print("Jac: "+str(Jac))
  this.constraints = this.calcConstraints(this.q)
  // newqvec = math.subtract(qvec,math.multiply(math.inv(Jac),this.constraints))
  newq = this.q- this.constraints/Jac //math.subtract(qvec,math.multiply(pIjac ,this.constraints))
  this.q = newq
  this.updateGlobalPositionsFromQ(this.q)
}


this.solve = function(){

  //update  global positions that aren't in q.
  swingarmglobal = this.calcGlobal(this.chassisGlobal,this.swingarm[0])

  this.swingarmGlobal[0] = swingarmglobal[0]
  this.swingarmGlobal[1] = swingarmglobal[1]
  //print(str(swingarmglobal))

  //calculate initial value of constraints
  this.q = this.getqArrayFromGlobals()
  if(this.itercount<this.iter_limit){
  qsave = varcopy(this.q)
  // print("saved configuration: "+str(qsave))
}
  this.constraints = this.calcConstraints(this.q)

  useIter = this.resid_thresh

  //iterate while error is large
  niter = 0
  //print((math.max(math.abs(this.constraints))))

  while((math.max(math.abs(this.constraints))>useIter)&&(niter<this.iter_limit)){
    //if(this.debug){print("q: "+str(math.multiply(this.q,180/3.14)))}
    niter+=1
    // print("Iteration: "+str(niter))
    //print(niter,this.constraints)
    this.iterate()

  }

  this.itercount = niter

  if(this.itercount>=this.iter_limit){
    print("iteration limit reached! norm is: "+str(math.max(this.constraints)))
    this.q = varcopy(qsave)
    this.updateGlobalPositionsFromQ(this.q)
    document.getElementById("sim_msg").innerHTML="Iteration Limit Reached! <br> What you're asking for is impossible <br> Press Reload Config to reset."
  }
  else{
    document.getElementById("sim_msg").innerHTML="Simulation health OK <br> Max solver error: "+parseFloat(math.max(this.constraints)).toPrecision(2)+"<br> Motion Ratio: "+parseFloat(this.MR).toPrecision(3)+"<br>Shock Compression: "+parseFloat(this.shockCompression/.0254).toPrecision(4)+" inches <br>Wheel Force: "+parseFloat(this.shockForce/this.MR/9.8*2.2).toPrecision(5)+" lb"

  }

  var shpivot_chassis = this.calcGlobal(this.chassisGlobal,this.chassis[2])
  var shpivot_linkage= this.calcGlobal(this.linkageGlobal,this.linkage[2])
  this.shockCompression = this.freeshocklength - math.sqrt(math.pow(shpivot_chassis[0]-shpivot_linkage[0],2)+math.pow(shpivot_chassis[1]-shpivot_linkage[1],2))
  this.shockForce = this.springrate*(this.shockCompression+this.suspPreload)

}

this.update = function(){
  //update independent driving variable
  this.q = this.getqArrayFromGlobals();
  this.solve();
  var shpivot_chassis = this.calcGlobal(this.chassisGlobal,this.chassis[2])
  var shpivot_linkage= this.calcGlobal(this.linkageGlobal,this.linkage[2])
  this.shockCompression = this.freeshocklength - math.sqrt(math.pow(shpivot_chassis[0]-shpivot_linkage[0],2)+math.pow(shpivot_chassis[1]-shpivot_linkage[1],2))
  this.shockForce = this.springrate*(this.shockCompression+this.suspPreload)
  //debug
  // this.q = this.getqArrayFromGlobals()
  // this.constraints = this.calcConstraints(this.q)
  // print(str(this.constraints))

  //draw the system
  //this.getqArrayFromGlobals()
  this.draw()


}


//this function calls all of the relevant draw functions for individual components.
this.draw = function(){

  //make coordinate system match ours
  translate(this.ox,this.oy)
  push()
  //draw origin
  strokeWeight(1);
  stroke(color(255,0,0))
  line(0,0,50,0)
  push()
  translate(50,0)
  fill(color(255,0,0))
  stroke(0)
  textSize(25)
  text("X",0,10)
  pop()

  stroke(color(0,255,0))
  // sphere(.01)
  line(0,0,0,-50)
  push()
  translate(0,-50)
  fill(color(0,255,0))
  stroke(0)
  textSize(25)
  text("Y",10,0)
  pop()

  pop()


  //reset to black
  stroke(255)

  push()
  scale(this.fbscale)
  strokeWeight(1.0/this.fbscale);
  //draw each component
  this.drawChassis(color(255,0,255));
  this.drawSwingarm(color(255,255,0));
  this.drawLinkage(color(0,255,255));

  this.drawDogbone(color(0,0,255));
  this.drawShock(color(255,0,0));
  stroke(255)
  fill(255)
  pop()
}

this.drawSwingarm = function(myColor){


  //get global drawing points
  // print(this.swingarmGlobal)
  points = this.getDrawPoints(this.swingarmGlobal,this.swingarm)
  fill(10)
  stroke(10)
  ellipse(points[2][0],-points[2][1],this.wheel_diameter,this.wheel_diameter)
  stroke(myColor)
  fill(myColor)
  triangle(points[0][0],-points[0][1],points[1][0],-points[1][1],points[2][0],-points[2][1])
}

this.drawLinkage = function(myColor){
  strokeWeight(1.0/this.fbscale)
  stroke(myColor)
  fill(myColor)
  //get global drawing points
  points = this.getDrawPoints(this.linkageGlobal,this.linkage)
  triangle(points[0][0],-points[0][1],points[1][0],-points[1][1],points[2][0],-points[2][1])
}

this.drawChassis = function(myColor){
  strokeWeight(1.0/this.fbscale)
  stroke(myColor)
  fill(myColor)
  //get global drawing points
  points = this.getDrawPoints(this.chassisGlobal,this.chassis)
  triangle(points[0][0],-points[0][1],points[1][0],-points[1][1],points[2][0],-points[2][1])
}

this.drawDogbone = function(myColor){
  stroke(myColor)
  strokeWeight(5.0/this.fbscale)
  fill(myColor)
  //get global drawing points
  points = this.getDrawPoints(this.linkageGlobal,this.linkage)
  points2 = this.getDrawPoints(this.swingarmGlobal,this.swingarm)
  line(points[1][0],-points[1][1],points2[1][0],-points2[1][1])
}

this.drawShock = function(myColor){
  strokeWeight(5.0/this.fbscale)
  stroke(myColor)
  fill(myColor)
  //get global drawing points
  points = this.getDrawPoints(this.chassisGlobal,this.chassis)
  points2 = this.getDrawPoints(this.linkageGlobal,this.linkage)
  line(points[2][0],-points[2][1],points2[2][0],-points2[2][1])
}

// this.drawUpperA = function(){
//   //get global drawing points
//   points = this.getDrawPoints(this.upperAGlobal,this.upperA)
//   //draw rear part of A-arm from p1 to p3
//   line(points[0][0],points[0][1],-points[0][2],points[2][0],points[2][1],-points[2][2])
//   //draw rear part of A-arm from p1 to p3
//   line(points[1][0],points[1][1],-points[1][2],points[2][0],points[2][1],-points[2][2])
//   //draw spheres at each point. Make small
//   for(let k = 0;k<3;k++){
//     push()
//     translate(points[k][0],points[k][1],-points[k][2])
//     sphere(0.005)
//     pop()
//   }
// }

// this.drawUpright = function(){
//   //get global drawing points
//   points = this.getDrawPoints(this.uprightGlobal,this.upright)
//   push()
//   translate(this.uprightGlobal[0],this.uprightGlobal[1],-this.uprightGlobal[2])
//   rotateZ((this.uprightGlobal[5]+this.upright[4][2]))
//   rotateY(-(this.uprightGlobal[4]+this.upright[4][1]))
//   rotateX(-(this.uprightGlobal[3]+this.upright[4][0]))
//   //draw origin
//   strokeWeight(10);
//   stroke(color(255,0,0))
//   // sphere(.01)
//   line(0,0,0,.05,0,0)
//   textFont(inconsolata)
//   push()
//   translate(.05,0,0)
//   fill(color(255,0,0))
//   stroke(255)
//   textSize(0.025)
//   rotateZ(PI/2)
//   rotateX(PI/2)
//   rotateY(PI)
//   text("X",0,-0.03)
//   pop()
//   stroke(color(0,255,0))
//   // sphere(.01)
//   line(0,0,0,0,.05,0)
//   push()
//   translate(0,.05,0)
//   fill(color(0,255,0))
//   stroke(255)
//   textSize(0.025)
//   rotateZ(PI/2)
//   rotateX(PI/2)
//   rotateY(PI)
//   text("Y",0,-0.03)
//   pop()
//
//
//   stroke(color(0,0,255))
//   // sphere(.01)
//   line(0,0,0,0,0,-.05)
//   push()
//   translate(0,0,-.05)
//   fill(color(0,0,255))
//   stroke(255)
//   textSize(0.025)
//   rotateZ(PI/2)
//   rotateX(PI/2)
//   rotateY(PI)
//   text("Z",0,-0.03)
//   pop()
//
//   pop()
//
//   //draw kingpin axis
//   line(points[0][0],points[0][1],-points[0][2],points[1][0],points[1][1],-points[1][2])
//   //draw line from upper BJ to tie rod
//   line(points[0][0],points[0][1],-points[0][2],points[2][0],points[2][1],-points[2][2])
//   //draw line from lower BJ to tie rod
//   line(points[1][0],points[1][1],-points[1][2],points[2][0],points[2][1],-points[2][2])
//
//   texts = ["urlbj","urubj","urtr","urwc"]
//   for(let k = 0;k<4;k++){
//     push()
//     translate(points[k][0],points[k][1],-points[k][2])
//     sphere(0.005)
//
//     textFont(inconsolata)
//     fill(color(255,255,0))
//     stroke(255)
//     textSize(0.025)
//     rotateZ(PI/2)
//     rotateX(PI/2)
//     rotateY(PI)
//     text(texts[k],0,-0.03)
//
//
//     pop()
//   }
//
//
//   push()
//   //now draw the wheel:
//   translate(this.uprightGlobal[0],this.uprightGlobal[1],-this.uprightGlobal[2])
//   //z rotation may need to be negated...
//   rotateZ((this.uprightGlobal[5]+this.upright[4][2]))
//   rotateY(-(this.uprightGlobal[4]+this.upright[4][1]))
//   rotateX(-(this.uprightGlobal[3]+this.upright[4][0]))
//   // rotateZ(this.uprightGlobal[0])
//   // rotateY(this.uprightGlobal[1])
//   // rotateX(this.uprightGlobal[2])
//   translate(this.upright[3][0],this.upright[3][1],-this.upright[3][2])
//
//   noFill()
//   // sphere(.01)
//   strokeWeight(1)
//   cylinder(.18,8*.0254)
//   pop()
// }
//
// this.drawTieRod = function(){
//   cpoints = this.getDrawPoints(this.chassisGlobal,this.chassis)
//   upoints = this.getDrawPoints(this.uprightGlobal,this.upright)
//   stroke(color(255,0,255))
//   line(cpoints[4][0],cpoints[4][1],-cpoints[4][2],upoints[2][0],upoints[2][1],-upoints[2][2])
//
//
//     push()
//     translate(cpoints[4][0],cpoints[4][1],-cpoints[4][2])
//     sphere(0.005)
//     pop()
//     push()
//     stroke(color(255,0,255))
//     translate(upoints[2][0],upoints[2][1],-upoints[2][2])
//     sphere(0.005)
//
//     pop()
//
//
//
// }
//
// this.drawChassis = function(){
//   cpoints = this.getDrawPoints(this.chassisGlobal,this.chassis)
//   chassis2 = varcopy(this.chassis)
//   chassis2[0][1]=0
//   chassis2[1][1]=0
//   chassis2[2][1]=0
//   cpoints2 = this.getDrawPoints(this.chassisGlobal,chassis2)
//   stroke(color(180,180,180))
//
//   texts = ["lar","laf","uar","uaf","ctr"]
//   for(let k=0;k<cpoints.length;k++){
//     push()
//     translate(cpoints[k][0],cpoints[k][1],-cpoints[k][2])
//     sphere(0.004)
//     textFont(inconsolata)
//     fill(color(255,255,0))
//     stroke(255)
//     textSize(0.025)
//     rotateZ(PI/2)
//     rotateX(PI/2)
//     rotateY(PI)
//     text(texts[k],0,-0.03)
//
//     pop()
//   }
//   //draw line from vehicle center to RLA
//   line(cpoints[0][0],cpoints[0][1],-cpoints[0][2],cpoints2[0][0],cpoints2[0][1],-cpoints2[0][2])
//   line(cpoints[1][0],cpoints[1][1],-cpoints[1][2],cpoints2[1][0],cpoints2[1][1],-cpoints2[1][2])
//   line(cpoints[2][0],cpoints[2][1],-cpoints[2][2],cpoints2[2][0],cpoints2[2][1],-cpoints2[2][2])
//   line(cpoints[3][0],cpoints[3][1],-cpoints[3][2],cpoints2[3][0],cpoints2[3][1],-cpoints2[3][2])
//   line(cpoints[0][0],cpoints[0][1],-cpoints[0][2],cpoints[1][0],cpoints[1][1],-cpoints[1][2])
//   line(cpoints[2][0],cpoints[2][1],-cpoints[2][2],cpoints[3][0],cpoints[3][1],-cpoints[3][2])
//   line(cpoints[0][0],cpoints[0][1],-cpoints[0][2],cpoints[2][0],cpoints[2][1],-cpoints[2][2])
//   line(cpoints[1][0],cpoints[1][1],-cpoints[1][2],cpoints[3][0],cpoints[3][1],-cpoints[3][2])
// }
//
 }



//following taken from: https://github.com/sloisel/numeric/blob/master/src/svd.js
svd= function svd(A) {
      var temp;
  //Compute the thin SVD from G. H. Golub and C. Reinsch, Numer. Math. 14, 403-420 (1970)
    var prec= Math.pow(2,-52) // assumes double prec
    var tolerance= 1.e-64/prec;
    var itmax= 50;
    var c=0;
    var i=0;
    var j=0;
    var k=0;
    var l=0;

    var u= varcopy(A);
    var m= u.length;

    var n= u[0].length;

    if (m < n) throw "Need more rows than columns"

    var e = new Array(n);
    var q = new Array(n);
    for (i=0; i<n; i++) e[i] = q[i] = 0.0;
    var v = rep([n,n],0);
  //  v.zero();

    function pythag(a,b)
    {
      a = Math.abs(a)
      b = Math.abs(b)
      if (a > b)
        return a*Math.sqrt(1.0+(b*b/a/a))
      else if (b == 0.0)
        return a
      return b*Math.sqrt(1.0+(a*a/b/b))
    }

    //Householder's reduction to bidiagonal form

    var f= 0.0;
    var g= 0.0;
    var h= 0.0;
    var x= 0.0;
    var y= 0.0;
    var z= 0.0;
    var s= 0.0;

    for (i=0; i < n; i++)
    {
      e[i]= g;
      s= 0.0;
      l= i+1;
      for (j=i; j < m; j++)
        s += (u[j][i]*u[j][i]);
      if (s <= tolerance)
        g= 0.0;
      else
      {
        f= u[i][i];
        g= Math.sqrt(s);
        if (f >= 0.0) g= -g;
        h= f*g-s
        u[i][i]=f-g;
        for (j=l; j < n; j++)
        {
          s= 0.0
          for (k=i; k < m; k++)
            s += u[k][i]*u[k][j]
          f= s/h
          for (k=i; k < m; k++)
            u[k][j]+=f*u[k][i]
        }
      }
      q[i]= g
      s= 0.0
      for (j=l; j < n; j++)
        s= s + u[i][j]*u[i][j]
      if (s <= tolerance)
        g= 0.0
      else
      {
        f= u[i][i+1]
        g= Math.sqrt(s)
        if (f >= 0.0) g= -g
        h= f*g - s
        u[i][i+1] = f-g;
        for (j=l; j < n; j++) e[j]= u[i][j]/h
        for (j=l; j < m; j++)
        {
          s=0.0
          for (k=l; k < n; k++)
            s += (u[j][k]*u[i][k])
          for (k=l; k < n; k++)
            u[j][k]+=s*e[k]
        }
      }
      y= Math.abs(q[i])+Math.abs(e[i])
      if (y>x)
        x=y
    }

    // accumulation of right hand gtransformations
    for (i=n-1; i != -1; i+= -1)
    {
      if (g != 0.0)
      {
        h= g*u[i][i+1]
        for (j=l; j < n; j++)
          v[j][i]=u[i][j]/h
        for (j=l; j < n; j++)
        {
          s=0.0
          for (k=l; k < n; k++)
            s += u[i][k]*v[k][j]
          for (k=l; k < n; k++)
            v[k][j]+=(s*v[k][i])
        }
      }
      for (j=l; j < n; j++)
      {
        v[i][j] = 0;
        v[j][i] = 0;
      }
      v[i][i] = 1;
      g= e[i]
      l= i
    }

    // accumulation of left hand transformations
    for (i=n-1; i != -1; i+= -1)
    {
      l= i+1
      g= q[i]
      for (j=l; j < n; j++)
        u[i][j] = 0;
      if (g != 0.0)
      {
        h= u[i][i]*g
        for (j=l; j < n; j++)
        {
          s=0.0
          for (k=l; k < m; k++) s += u[k][i]*u[k][j];
          f= s/h
          for (k=i; k < m; k++) u[k][j]+=f*u[k][i];
        }
        for (j=i; j < m; j++) u[j][i] = u[j][i]/g;
      }
      else
        for (j=i; j < m; j++) u[j][i] = 0;
      u[i][i] += 1;
    }

    // diagonalization of the bidiagonal form
    prec= prec*x
    for (k=n-1; k != -1; k+= -1)
    {
      for (var iteration=0; iteration < itmax; iteration++)
      { // test f splitting
        var test_convergence = false
        for (l=k; l != -1; l+= -1)
        {
          if (Math.abs(e[l]) <= prec)
          { test_convergence= true
            break
          }
          if (Math.abs(q[l-1]) <= prec)
            break
        }
        if (!test_convergence)
        { // cancellation of e[l] if l>0
          c= 0.0
          s= 1.0
          var l1= l-1
          for (i =l; i<k+1; i++)
          {
            f= s*e[i]
            e[i]= c*e[i]
            if (Math.abs(f) <= prec)
              break
            g= q[i]
            h= pythag(f,g)
            q[i]= h
            c= g/h
            s= -f/h
            for (j=0; j < m; j++)
            {
              y= u[j][l1]
              z= u[j][i]
              u[j][l1] =  y*c+(z*s)
              u[j][i] = -y*s+(z*c)
            }
          }
        }
        // test f convergence
        z= q[k]
        if (l== k)
        { //convergence
          if (z<0.0)
          { //q[k] is made non-negative
            q[k]= -z
            for (j=0; j < n; j++)
              v[j][k] = -v[j][k]
          }
          break  //break out of iteration loop and move on to next k value
        }
        if (iteration >= itmax-1)
          throw 'Error: no convergence.'
        // shift from bottom 2x2 minor
        x= q[l]
        y= q[k-1]
        g= e[k-1]
        h= e[k]
        f= ((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y)
        g= pythag(f,1.0)
        if (f < 0.0)
          f= ((x-z)*(x+z)+h*(y/(f-g)-h))/x
        else
          f= ((x-z)*(x+z)+h*(y/(f+g)-h))/x
        // next QR transformation
        c= 1.0
        s= 1.0
        for (i=l+1; i< k+1; i++)
        {
          g= e[i]
          y= q[i]
          h= s*g
          g= c*g
          z= pythag(f,h)
          e[i-1]= z
          c= f/z
          s= h/z
          f= x*c+g*s
          g= -x*s+g*c
          h= y*s
          y= y*c
          for (j=0; j < n; j++)
          {
            x= v[j][i-1]
            z= v[j][i]
            v[j][i-1] = x*c+z*s
            v[j][i] = -x*s+z*c
          }
          z= pythag(f,h)
          q[i-1]= z
          c= f/z
          s= h/z
          f= c*g+s*y
          x= -s*g+c*y
          for (j=0; j < m; j++)
          {
            y= u[j][i-1]
            z= u[j][i]
            u[j][i-1] = y*c+z*s
            u[j][i] = -y*s+z*c
          }
        }
        e[l]= 0.0
        e[k]= f
        q[k]= x
      }
    }

    //vt= transpose(v)
    //return (u,q,vt)
    for (i=0;i<q.length; i++)
      if (q[i] < prec) q[i] = 0

    //sort eigenvalues
    for (i=0; i< n; i++)
    {
    //writeln(q)
     for (j=i-1; j >= 0; j--)
     {
      if (q[j] < q[i])
      {
    //  writeln(i,'-',j)
       c = q[j]
       q[j] = q[i]
       q[i] = c
       for(k=0;k<u.length;k++) { temp = u[k][i]; u[k][i] = u[k][j]; u[k][j] = temp; }
       for(k=0;k<v.length;k++) { temp = v[k][i]; v[k][i] = v[k][j]; v[k][j] = temp; }
  //     u.swapCols(i,j)
  //     v.swapCols(i,j)
       i = j
      }
     }
    }

    return {U:u,S:q,V:v}
};

rep = function rep(s,v,k) {
    if(typeof k === "undefined") { k=0; }
    var n = s[k], ret = Array(n), i;
    if(k === s.length-1) {
        for(i=n-2;i>=0;i-=2) { ret[i+1] = v; ret[i] = v; }
        if(i===-1) { ret[0] = v; }
        return ret;
    }
    for(i=n-1;i>=0;i--) { ret[i] = rep(s,v,k+1); }
    return ret;
}
