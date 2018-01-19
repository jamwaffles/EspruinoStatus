import 'isomorphic-fetch'
import WebSocket from 'ws'


const wss = new WebSocket.Server({ port: 8080 });

console.info("Listening on 8080")

wss.on('connection', function connection(ws) {
	console.log("Client connected");

	let interval;

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.on('error', console.error)
  ws.on('close', () => {
  	clearInterval(interval);

  	console.info("Socket closed");
  })

  ws.send('something');

  interval = setInterval(() => {
  	if (ws.readyState === WebSocket.OPEN) {
      ws.send((new Date()).toLocaleTimeString('en-GB'))
    }
  }, 1000);
});