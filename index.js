let http = require('http')
let request = require('request')
let path = require('path')
let fs = require('fs')

// Set a the default value for --host to 127.0.0.1
let argv = require('yargs')
	.default('host','127.0.0.1')
	.argv

// Build the destinationUrl using the --host value
let destinationUrl = argv.host	

// Get the --port value
// If none, default to the echo server port, or 80 if --host exists
let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80)

// Update our destinationUrl line from above to include the port
destinationUrl = argv.host + ':' + port

destinationUrl = argv.url || argv.host + ':' + port

let logPath = argv.log && path.join(__dirname, argv.log)
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout


http.createServer((req,res) => {
	if (req.headers['x-destination-url'] != null) {
		destinationUrl = req.headers['x-destination-url']
	}
	console.log(`Proxying request to: ${destinationUrl} + ${req.url}`)

	// proxy code
	let options = {
		headers: req.headers,
		url: `http://${destinationUrl}${req.url}`
	}
	options.method = req.method
	
	// Log the proxy request headers and content in the **server callback**
	let downstreamResponse = req.pipe(request(options))
	logStream.write('Proxy Server Response headers: ' + JSON.stringify(downstreamResponse.headers) + '\n')
	req.pipe(logStream, {end: false})

	downstreamResponse.pipe(res)

}).listen(8001)

http.createServer((req, res) => {
    console.log(`Request received at: ${req.url}`)
    for (let header in req.headers) {
    	res.setHeader(header, req.headers[header])
	}

	// Log the req headers and content in the **server callback**
	logStream.write('\nEcho Server Request headers: ' + JSON.stringify(req.headers) + '\n')
	req.pipe(logStream, {end: false})

    req.pipe(res)

}).listen(8000)
