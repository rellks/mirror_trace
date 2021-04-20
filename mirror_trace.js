const materials = {
		'mirror' : [true, true, true, true],
		'file_names' : [ "https://rellks.github.io/mirror_trace/Star-easy.png", "https://rellks.github.io/mirror_trace/Star-medium.png", "https://rellks.github.io/mirror_trace/Star-hard.png", "https://rellks.github.io/mirror_trace/Star.png"],
		'xstarts' : [447, 452, 452, 452],
		'ystarts' : [172, 165, 165, 165],		
		'xmids' : [447, 452, 452, 452],
		'ymids' : [638, 652, 652, 652],
		'xends' :  [447, 452, 452, 452],
		'yends' :  [172, 165, 165, 165]
	}
	
	// this script can save screenshots of completed trials.  
	// to use this feature, set saveTrace to true and set saveScript to your server.  Your server will need a php script for accepting the files.
	// the php script is posted on github
	const saveScript = "https://calin-jageman.net/mirror_trace/save.php"
 	const saveTrace = false;

	//image dimensions
	const mywidth = 900;
	const myheight = 675;
	
	const startRadius = 10;
	const endRadius = 15;
	const midRadius = 20;

	const minPathLength = 200; // minimum length of path to complete trace

	let numRestarts = 0;
	let firstTry = true;

	let score;
	let timeDiff;
	let trialnumber;
	let MID;
	let drawing;
	let finished;
	let timeFinished;
	let canvas;
	let ctx;
	let canvas_mirror;
	let ctx_mirror;
	let crossings;
	let distance_total;
	let distance_current;
	let distance_inline;
	let distance_offline;
	let startTime;
	let endTime;
	let lastRefresh;
	let currentRefresh;
	let inline;
	let imagePath;	
	let xstart;
	let ystart;	
	let xend;
	let yend;	
	let xmid;
	let ymid;
	let imageObj;
	let mouse;
	let mirror;
	let mouseold;
	let windowInterval;

	let taskTime; //total time between first start and pressing enter/time over
	
	let prevPrevInline; // track two seconds ago - out of bounds
	let prevPrevCrossings; // track two seconds ago - out of bounds
	let prevPrevMouse; // track two seconds ago - not moving

	let prevInline; // track one second ago - out of bounds
	let prevCrossings;  // track one second ago - out of bounds
	let prevMouse;  // track one second ago - not moving

	let passedMid; // true if user has passed upper middle of star, inidicates if end point should be active
	let completed; // inidicates if user made it to the end point; True if user makes it to the end point
	let pathLength;

function betterPos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}
	
function findPos(obj) {
    var curleft = 0, curtop = 0;
    //document.getElementById("status").innerHTML = "Find pos: ";
    
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
            document.getElementById("status").innerHTML += obj.id + " Left: " + obj.offsetLeft + "Top: " + obj.offsetTop + " / ";
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function saveCanvas() {

	// Get the canvas screenshot as PNG
	var screenshot = Canvas2Image.saveAsPNG(canvas_mirror, true);

	// This is a little trick to get the SRC attribute from the generated <img> screenshot
	canvas_mirror.parentNode.appendChild(screenshot);
	screenshot.id = "canvasimage";	
	data =  screenshot.src; 
	canvas_mirror.parentNode.removeChild(screenshot);

	// Send the screenshot to PHP to save it on the server
	var url = saveScript;
	
    jQuery.ajax({
    
	    type: "POST", 
	    url: url,
	    dataType: 'text',
	    data: {
		id : MID,
		trial : trialnumber,
		score : score,
		distance_inline : distance_inline,
		distance_offline : distance_offline,
		timeDiff : timeDiff,
		crossings : crossings,
		base64data : data
	    }
	});
}
function onPaint() {
	if(mirror) {
	ctx_mirror.lineTo(mywidth-mouse.x, myheight-mouse.y);
	} else {
	ctx_mirror.lineTo(mouse.x, mouse.y);
	}
	ctx_mirror.stroke();
};

// draw start, middle, end circle points
function drawSMECircles(){
	ctx_mirror.globalAlpha=1;

	// TODO comment out; Display mid and end circles -------
	/*ctx_mirror.beginPath();
	ctx_mirror.arc(mywidth - xmid, myheight - ymid, midRadius, 0, 2 * Math.PI, false);
	ctx_mirror.fillStyle = 'blue';
	ctx_mirror.fill();

	ctx_mirror.beginPath();
	ctx_mirror.arc(mywidth - xend, myheight - yend, endRadius, 0, 2 * Math.PI, false);
	ctx_mirror.fillStyle = 'red';
	ctx_mirror.fill();*/

	// --------

	ctx_mirror.beginPath();
	ctx_mirror.arc(mywidth - xstart, myheight - ystart, startRadius, 0, 2 * Math.PI, false);
	ctx_mirror.fillStyle = '#add8e6'; //light blue
	ctx_mirror.fill();
}

function getNewImageObj(){
//load the image to trace
var imageObj = new Image();
imageObj.onload = function() {
 ctx_mirror.drawImage(imageObj, 0, 0, mywidth, myheight);
 ctx_mirror.globalAlpha=0.4;
 ctx.globalAlpha=0.4;

drawSMECircles();
 
ctx_mirror.beginPath();

 ctx_mirror.globalAlpha=1;
 ctx.globalAlpha=1;
 document.getElementById("status").innerHTML = "Click the blue circle to start."; 
};
imageObj.crossOrigin="anonymous";
imageObj.src=imagePath;

return imageObj;
}

function captureMouseMovement(e){
	{
	    //get mouse coordinates
		mouse.x = e.pageX - this.offsetLeft;
		mouse.y = e.pageY - this.offsetTop;
		
		//update status
		var pos = betterPos(canvas, e);
		//var pos = findPos(this);
                //var x = e.pageX - pos.x;
                //var y = e.pageY - pos.y;
		var x = pos.x;
		var y = pos.y;
		mouse.x = x;
		mouse.y = y;
		
		//document.getElementById("status").innerHTML = "x = " + x + " y = " + y + " mousex = " + mouse.x + " mousey = " + mouse.y;
		 
		 if (mirror) {
			var coord = "x=" +  (mywidth-x) + ", y=" + (myheight-y);
		} else {
			var coord = "x=" +  (x) + ", y=" + (y);
		}

		if (mirror) {
                      var p = ctx_mirror.getImageData(mywidth-mouse.x, myheight-mouse.y, 1, 1).data; 
		} else {
		      var p = ctx_mirror.getImageData(mouse.x, mouse.y, 1, 1).data; 
		}
		
		var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);

		var cendRadius = Math.sqrt(Math.pow(mouse.x - xend, 2) + Math.pow(mouse.y-yend, 2));
		if (drawing && passedMid && cendRadius < endRadius && pathLength > minPathLength) {
			completed = true;
			handleKeyDown({keyCode:13});
		}
		var cmidRadius = Math.sqrt(Math.pow(mouse.x - xmid, 2) + Math.pow(mouse.y-ymid, 2));
		if (drawing && cmidRadius < midRadius ) {
			console.log("passed midpoint of star");
			passedMid = true;
		}
		 		 		 
		 //do drawing if in drawing mode
		 if(drawing) {
		    
		    if (mouseold.x - mouse.x + mouseold.y - mouse.y != 0) {
				distance_current = Math.sqrt(  Math.pow(mouseold.x - mouse.x, 2) + Math.pow(mouseold.y - mouse.y, 2) )
			} else {
				distance_current = 0;
			}

			//check to see where we are drawing
			if (p[0]+p[1]+p[2] < 200) {
				if(inline) {
					distance_inline = distance_inline + distance_current;
				} else {
					inline = true;
					crossings = crossings+ 1;
					distance_inline = distance_inline + (0.5*distance_current);
					distance_offline = distance_offline + (0.5*distance_current);
					ctx_mirror.beginPath();
					if(mirror) {
						ctx_mirror.moveTo(mywidth-mouse.x, myheight-mouse.y);
						
					} else {
						ctx_mirror.moveTo(mouse.x, mouse.y);
					}
				}
			}  else {
				if(inline) {
					inline = false;
					crossings = crossings + 1;
					distance_inline = distance_inline + (0.5*distance_current);
					distance_offline = distance_offline + (0.5*distance_current);
					ctx_mirror.beginPath();
					if(mirror) {
						ctx_mirror.moveTo(mywidth-mouse.x, myheight-mouse.y);
					} else {
						ctx_mirror.moveTo(mouse.x, mouse.y);
					}
				} else {
					distance_offline = distance_offline + distance_current;
				}
			} 
				
			distance_total = distance_total + distance_current;	
			score = distance_inline / distance_total;
			pathLength = distance_inline;
			endTime = new Date();
			timeDiff = (endTime - startTime)/1000;
			
			if (inline) {
				ctx_mirror.strokeStyle = 'red';
			} else {
				ctx_mirror.strokeStyle = 'blue';
			}

			if (mirror) {
				ctx_mirror.lineTo(mywidth-mouse.x, myheight-mouse.y);
			} else {
				ctx_mirror.lineTo(mouse.x, mouse.y);
			}
			ctx_mirror.stroke();		
			document.getElementById("status").innerHTML = "Score = " + Math.round(score *100) +"% ";
			//document.getElementByID("status").innerHTML = p[0]+p[1]+p[2];

		} else {
		    if(!finished) {
			currentRefresh = new Date();
			if (currentRefresh - lastRefresh > (1000/30) ) {
				ctx_mirror.drawImage(imageObj, 0, 0, mywidth, myheight);
				

				ctx_mirror.fillStyle = 'green';
				ctx_mirror.globalAlpha=0.4;

				drawSMECircles();

				ctx_mirror.beginPath();
				ctx_mirror.globalAlpha=1
				
				if (mirror) {
					ctx_mirror.arc(mywidth-mouse.x, myheight-mouse.y, 4, 0, 2 * Math.PI, false);
				} else {
					ctx_mirror.arc(mouse.x, mouse.y, 4, 0, 2 * Math.PI, false);
				}
				ctx_mirror.fillStyle = 'green';
				ctx_mirror.fill();

				ctx_mirror.beginPath();

				lastRefresh = currentRefresh
				document.getElementById("status").innerHTML = "Click the blue circle to start."; 
			}
			} 
		}
		 //store current coordinates
		 mouseold.x = mouse.x;
		 mouseold.y = mouse.y;
		 
	}
}

function handleMouseDown(){
	var currentRadius = Math.sqrt(Math.pow(mouse.x - xstart, 2) + Math.pow(mouse.y-ystart, 2));
	
	if(!finished && !drawing && (currentRadius < startRadius)) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx_mirror.drawImage(imageObj, 0, 0, mywidth, myheight);
		ctx_mirror.fillStyle = 'red';
		ctx_mirror.globalAlpha=0.4;
		ctx_mirror.beginPath();
		ctx_mirror.fill();
		ctx_mirror.globalAlpha=1
		
		drawing = true;
		finished = false;

		ctx_mirror.beginPath();
		if (mirror) {
			ctx_mirror.moveTo(mywidth-mouse.x, myheight-mouse.y);
		} else {
			ctx_mirror.moveTo(mouse.x, mouse.y);
		}	
		if (firstTry){
			firstTry = false;
			startTime = new Date();
			const TIMEOUT_5MIN = 5*60*1000; // (5min) * (60sec/min) * (1000ms/sec)
			fiveMinTimeout = setTimeout(() => handleKeyDown({keyCode:13}), TIMEOUT_5MIN);
			oneSecInterval = setInterval(() => handleOneSecInterval(startTime), 1000);
		}
	}
}

function handleOneSecInterval(startTime){
	const TIMEOUT_5MIN = 5*60*1000; // (5min) * (60sec/min) * (1000ms/sec)
	const curTime = new Date();
	const diff = curTime - startTime;
	const remaining = (TIMEOUT_5MIN - diff)/1000;
	document.getElementById("time").innerHTML = "Time Remaining: " + Math.round(remaining) + "s.\nPress enter when finished.";

	if(drawing && (prevPrevCrossings === prevCrossings ) && (prevCrossings === crossings) && !prevPrevInline && !prevInline && !inline){
		console.log('out of bounds > 2sec')
		numRestarts++;
		console.log(numRestarts);
		resetStates();
	}  

	if(drawing && (prevPrevMouse.x - mouse.x + prevPrevMouse.y - mouse.y === 0) &&
	(prevMouse.x - mouse.x + prevMouse.y - mouse.y === 0)){
		console.log('not moving > 2 sec')
		numRestarts++;
		console.log(numRestarts);
		resetStates();
	} 
	
	// set next states
	if(drawing){
		prevPrevInline = prevInline;
		prevPrevCrossings = prevCrossings;
		prevInline = inline;
		prevCrossings = crossings;
	
		prevPrevMouse.x = prevMouse.x;
		prevPrevMouse.y = prevMouse.y

		prevMouse.x = mouse.x;
		prevMouse.y = mouse.y
	}
}


function handleKeyDown(event){
	if (event.keyCode === 13){
		console.log('enter key pressed!');
		clearInterval(oneSecInterval);
		clearTimeout(fiveMinTimeout);
		drawing = false;
		finished = true;

		const curTime = new Date();
		taskTime = (curTime - startTime)/1000;

		document.getElementById("status").innerHTML = "Finished with score = " + Math.round(score *100) + "%<BR> Click next to continue."; 
		document.getElementById("time").innerHTML = ""; 
			if (saveTrace) {
			saveCanvas();
			//call save function
		}		
	}
}

function resetStates(){
	console.log('resetting states');
	//states to track
	drawing = false;
	finished = false;
	score = 0;
	timeDiff = 0;
	timeFinished = 0;
	inline = false;
	crossings = 0;
	distance_total = 0;
	distance_current = 0;
	distance_inline = 0;
	distance_offline = 0;
	lastRefresh = 0;
	currentRefresh = 0;

	prevInline = true;
	prevCrossings = 0;
	prevMouse = {x: -1, y: -1};
	prevPrevMouse = {x: -1, y: -1};
	prevPrevInline = true;
	prevPrevCrossings = 0;
	imageObj = getNewImageObj();

	passedMid = false;
	completed = false;
	pathLength = 0;
}

function do_mirror_cyclic() {	
	//load materials
	imagePath = materials.file_names[trialnumber];	
	mirror = materials.mirror[trialnumber];
	xstart = materials.xstarts[trialnumber];
	ystart = materials.ystarts[trialnumber];	
	xend = materials.xends[trialnumber];
	yend = materials.yends[trialnumber];	
	xmid = materials.xmids[trialnumber];
	ymid = materials.ymids[trialnumber];

	//drawing contexts for cursor area and mirrored area
	canvas = document.querySelector('#mirror');
	ctx = canvas.getContext('2d');
	canvas_mirror = document.querySelector('#mirror');
	ctx_mirror = canvas_mirror.getContext('2d');

	//defines data structure for mouse movement
	mouse = {x: 0, y: 0};	
	mouseold = {x: 0, y: 0};	

	taskTime = -1;

	/* Drawing on Paint App */
	ctx_mirror.lineWidth = 1.2;
	ctx_mirror.lineJoin = 'round';
	ctx_mirror.lineCap = 'round';
	ctx_mirror.strokeStyle = 'blue';
		
	resetStates();
	
	canvas.addEventListener('mousedown', () => handleMouseDown(), false);
	/* Mouse Capturing Work */
	canvas.addEventListener('mousemove', event => captureMouseMovement(event), false);
	
	window.addEventListener('keydown', event => handleKeyDown(event), false);

}