# STRATUM
NodeJS Server / esp8266+W5500 Node

You can find a basic usage in demo.js

### Install
`npm install --save hemisphere-project/stratum-hnode`


### Basic usage
```js
var hnode = require('hnode')();   // load and instanciate the library
var server = new hnode.Server();  // instantiate a server
server.start();                   // start the server
```

### Options
```js
var hnode = require('hnode')({
  // This are the default options
  PORT_SERVER: 3737,            // Working UDP port
  TIME_TICK: 100,               // Watchdog timer ms
  TIME_OFFLINE: 1000,           // Offline Time
  TIME_GONE: 3000,              // Gone Time
  NLEDS_STRIPS: 90,             // N leds per strips
  NSTRIPS_CLIENT: 4,            // N strips per client
  log : msg => console.log(msg) // custom log function (to write in file, etc)
});
var server = new hnode.Server()
server.start()
```

### API
#### Server methods:
  `.getNodeByIP( ip )`      
      return a Node or undefined

  `.getNodeByName( name )`  
       return a Node or undefined

  `.getAllNodes()`  
      return an array with all known Nodes

  `.setAll( rgb )`  
      apply one color (rgb array) to every leds, rgb = [r,g,b]

  `.blackout()`  
      switch off every leds

#### Server events:
  `.on('newnode', function(node){ ... })`   
       triggered when a new Node is discovered

  `.on('tick', function(node){ ... })`
       server ticker, can be use as main sequencer

#### Node methods:
  `.setLed( strip, led, rgb )`   
       apply rgb array to a specific led, rgb = [r, g, b]
       array[3]

  `.setStrip( led, rgbs )`   
       apply rgbs array of array to a strip, rgbs = [ [r, g, b],  [r, g, b], ... ]
       array[NUM_LEDS_PER_STRIP][3]

  `.setAll( rgbs )`   
       apply a whole set of 4 strips, rgbs = [ [ [r, g, b],  [r, g, b], ... ], ... ]
       array[NSTRIPS_PER_CLIENTS][NUM_LEDS_PER_STRIP][3]

  `.randomize()`   
       randomize all values of the node's leds

#### Node attributes (read-only):
  `.name`   
  `.ip`

#### Node events:
  `.on('start', function(node){ ... }) `  
       triggered when a node is started

  `.on('online', function(node){ ... })`   
       triggered when a node goes online

  `.on('offline', function(node){ ... }) `  
       triggered when a node goes offline

  `.on('stop', function(node){ ... }) `  
       triggered when a node is stopped
       
       
## TODO:
- Server presence broadcast beacon + Arduino auto-catch server IP
- Arduino client MAC address, and derivative name
