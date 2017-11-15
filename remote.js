
// Load Hnode library
var hnode = require('./Hnode');

// Create new server
var server = new hnode.Server();

// Event: when a new node is detected
server.on('newnode', function(node) {

  // Event: when the node start
  node.on('start', function(node){ console.log('start '+this.ip+' '+this.name) });

  // Event: when the node goes online
  node.on('online', function(node){ console.log('online '+this.ip+' '+this.name) });

  // Event: when the node goes offline
  node.on('offline', function(node){ console.log('offline '+this.ip+' '+this.name) });

  // Event: when the node stop
  node.on('stop', function(node){ console.log('stop '+this.ip+' '+this.name) });

  // Event: when the node stop
  node.on('fps', function(fps){ console.log('FPS '+this.name+' '+fps) });

  // Manual locked rate
  node.lockRate(1000/40);

});

var patternSize = 5
var averageLight = 0.5

function winStick() {
  this.wins = []
  for (var k=0; k<90/patternSize; k++) this.wins.push(new window())

}

function window() {
  this.isOn = (Math.random() < averageLight);
  // this.isOn = true;
}

var GROUPS = []
GROUPS[0] = [
              {'name': 'Hnode-24', 'basecolor': [255,0,0], 'windows': []}, 
              {'name': 'Hnode-16', 'basecolor': [255,0,0], 'windows': []},
            ]

GROUPS[1] = [
              {'name': 'Hnode-12', 'basecolor': [255,0,0], 'windows': []},
              {'name': 'Hnode-13', 'basecolor': [255,0,0], 'windows': []},
              {'name': 'Hnode-25', 'basecolor': [255,0,0], 'windows': []},
]
GROUPS[2] = [
              {'name': 'Hnode-19', 'basecolor': [255,0,0], 'windows': []},
              {'name': 'Hnode-23', 'basecolor': [255,0,0], 'windows': []},
]
GROUPS[3] = [
              {'name': 'Hnode-15', 'basecolor': [255,0,0], 'windows': []},
]


Object.keys(GROUPS).forEach(function(key) {
    Object.keys(GROUPS[key]).forEach(function(nn) {
      for (var s=0; s<4; s++)  {
        GROUPS[key][nn]['windows'][s] = new winStick()
      }
    })
});

console.log(GROUPS[0][0]['windows'])
// return

//AMP
function factor(f, arr) {
  return arr.map(function(e) {
    return Math.round(e*f);
  });
}

//FX
function scintil(arr, depth) {
  var f = Math.round(Math.random()*depth-depth/2)
  var new_array = arr.map(function(e) {
    e = e + f;
    return e;
  });
  return new_array;
}

// Receive remote UDP
const dgram = require('dgram');
const udpserver = dgram.createSocket('udp4');
udpserver.on('error', (err) => {
  console.log(`udpserver error:\n${err.stack}`);
  server.close();
});
udpserver.on('message', (msg, rinfo) => {
  msg = String(msg)
  msg = msg.replace(/,/g, '');
  msg = msg.split(' ')

  var group = msg[0]
  var master = msg[1]
  var colors = [parseInt(msg[2]), parseInt(msg[3]), parseInt(msg[4])]
  colors = factor(master/255, colors)

  if (GROUPS[group])
    for (var nodeName in GROUPS[group])
      GROUPS[group][nodeName]['basecolor'] = colors

});
udpserver.on('listening', () => {
  const address = udpserver.address();
  console.log(`Remote control server listening on ${address.port}`);
});
udpserver.bind(4037);

var count = 0


function buildings() {

  // pick a random group
  var group = GROUPS[Math.floor(Math.random()*GROUPS.length)];

  // pick a random box
  var box = group[Math.floor(Math.random()*group.length)];

  // pick a random stick
  var stick = box['windows'][Math.floor(Math.random()*box['windows'].length)];

  // count lighted windows
  var on = 0;
  var off = 0;
  for(var c=0; c<stick.wins.length; c++)
    if (stick.wins[c].isOn) on+=1
    else off += 1
  var prop = on/(on+off)

  // pick a random window
  var onOff = (prop > averageLight)
  var win = stick.wins[Math.floor(Math.random()*stick.wins.length)];
  var unlock = 0
  while (win.isOn != onOff && unlock<20) {
    win = stick.wins[Math.floor(Math.random()*stick.wins.length)];
    unlock +=1
  }
  win.isOn = !win.isOn

}

function show() {
  for (var gr=0; gr<GROUPS.length; gr++)
    for (var nn=0; nn<GROUPS[gr].length; nn++) {
      node = server.getNodeByName(GROUPS[gr][nn]['name']);
      colors = GROUPS[gr][nn]['basecolor']
      if (node) {
        for (var stick=0; stick<4; stick++)
          for (var wn=0; wn<GROUPS[gr][nn]['windows'][stick].wins.length; wn++)
              for (var i=0; i<patternSize; i++) {
                if (i >= 2 && GROUPS[gr][nn]['windows'][stick].wins[wn].isOn) c = colors
                else c = [0,0,0]
                node.setLed(stick, wn*patternSize+i, c);
              }
      }
    }
    count += 1
    // if (count%4 == 0) 
    buildings()

}

// Bind animation to Server sequencer
server.on('tick', show);

// Set Server sequencer timing @ 50 FPS
server.setRate(1000/30);


// Start server
server.start();
