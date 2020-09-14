const materials = {
		'mirror' : [true],
		'file_names' : [ "https://rellks.github.io/mirror_trace/Star.png"],
		'xstarts' : [200],
		'ystarts' : [100],
		'xends' :   [],
		'yends' :    []
	}
	
	// this script can save screenshots of completed trials.  
	// to use this feature, set saveTrace to true and set saveScript to your server.  Your server will need a php script for accepting the files.
	// the php script is posted on github
	const saveScript = "https://calin-jageman.net/mirror_trace/save.php"
	const saveTrace = false;

	//image dimensions
	const mywidth = 400;
	const myheight = 300;

	let score = 0;
	let timeDiff = 0;
	let trialnumber = 0;
	let MID = 0;
	let drawing = false;
	let finished = false;
	let timeFinished = 0;
	let canvas;
	let ctx;
	let canvas_mirror;
	let ctx_mirror;
	let crossings = 0;
	let distance_total = 0;
	let distance_current = 0;
	let distance_inline = 0;
	let distance_offline = 0;
	let startTime = 0;
	let endTime = 0;
	let lastRefresh = 0;
	let currentRefresh = 0;
	let inline = false;
	let imagePath = materials.file_names[trialnumber];	
	let xstart = materials.xstarts[trialnumber];
	let ystart = materials.ystarts[trialnumber];;
	let startRadius = 10;
	let imageObj;
	let mouse;
	let mirror;
	let mouseold;

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
function getNewImageObj(){
//load the image to trace
var imageObj = new Image();
imageObj.onload = function() {
 ctx_mirror.drawImage(imageObj, 0, 0, mywidth, myheight);
 ctx_mirror.globalAlpha=0.4;
 ctx.globalAlpha=0.4;
 
 ctx.beginPath();
  if (mirror) {
	  ctx.arc(xstart, ystart, startRadius, 0, 2 * Math.PI, false);
  } else {
	  ctx.arc(xstart, ystart, startRadius, 0, 2 * Math.PI, false);
  }
 ctx.fillStyle = 'green';
 ctx.fill();
 ctx_mirror.globalAlpha=1;
 ctx.globalAlpha=1;
 document.getElementById("status").innerHTML = "Click the green circle to begin this trial"; 
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
				//ctx_mirror.beginPath();
	            if (mirror) {
				//	ctx_mirror.arc(mywidth - xstart, myheight - ystart, startRadius, 0, 2 * Math.PI, false);
				} else {
				//	ctx_mirror.arc(xstart, ystart, startRadius, 0, 2 * Math.PI, false);
				}
	           // ctx_mirror.fill();
				ctx_mirror.globalAlpha=1
				
				ctx_mirror.beginPath();
				if (mirror) {
					ctx_mirror.arc(mywidth-mouse.x, myheight-mouse.y, 4, 0, 2 * Math.PI, false);
				} else {
					ctx_mirror.arc(mouse.x, mouse.y, 4, 0, 2 * Math.PI, false);
				}
				ctx_mirror.fillStyle = 'green';
				ctx_mirror.fill();
				lastRefresh = currentRefresh
				document.getElementById("status").innerHTML = "Click the green circle to begin this trial"; 
			}
			} else {
				document.getElementById("status").innerHTML = "Finished with score = " + Math.round(score *100) + "%<BR> Click next to continue."; 
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
		startTime = new Date();
		ctx_mirror.beginPath();
		if (mirror) {
			ctx_mirror.moveTo(mywidth-mouse.x, myheight-mouse.y);
		} else {
			ctx_mirror.moveTo(mouse.x, mouse.y);
		}		
	}
	

}
function handleKeyDown(event){
	if (event.keyCode === 13){
		console.log('enter key pressed!');
		drawing = false;
		finished = true;
		if (saveTrace) {
			saveCanvas();
			//call save function
		}		
	}
}

function resetStates(){
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
startTime = 0;
endTime = 0;
lastRefresh = 0;
currentRefresh = 0;
startRadius = 10;


	//drawing contexts for cursor area and mirrored area
	canvas = document.querySelector('#paint');
	ctx = canvas.getContext('2d');
	canvas_mirror = document.querySelector('#mirror');
	ctx_mirror = canvas_mirror.getContext('2d');
	
	//defines data structure for mouse movement
	mouse = {x: 0, y: 0};	
	mouseold = {x: 0, y: 0};	

	/* Drawing on Paint App */
	ctx_mirror.lineWidth = 1.2;
	ctx_mirror.lineJoin = 'round';
	ctx_mirror.lineCap = 'round';
	ctx_mirror.strokeStyle = 'blue';
}

function do_mirror_cyclic() {	
	//load materials
	imagePath = materials.file_names[trialnumber];	
	mirror = materials.mirror[trialnumber];
	xstart = materials.xstarts[trialnumber];
	ystart = materials.ystarts[trialnumber];;
	
	resetStates();
	imageObj = getNewImageObj();

	canvas.addEventListener('mousedown', event => handleMouseDown(event), false);

	/* Mouse Capturing Work */
	canvas.addEventListener('mousemove', () => captureMouseMovement(), false);
	
	window.addEventListener('keydown', event => handleKeyDown(event), false);

}
