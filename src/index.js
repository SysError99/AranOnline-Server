/*!
 * AranOnline Main server, for tracking logged in users & being a central database.
 * 
 * @author SysError99
 * @license Proprietary
 */
// Libraries
const WebSocket = require('ws')
const BodyParser = require('body-parser')
const Express = require('express')
const IOSafe = require('./io.safe')
// Modules
const $ = require('./functions')
const _ = require('./server.constant')
/**
 * String for warn that system can't read the file.
 */
const read_err_str = 'Can\'t read file: '
/**
 * String for warn that system can't write the file.
 */
const write_err_str = 'Can\'t write file: '
/**
 * Connected servers
 */
const servers = []
/**
 * Client list from all servers.
 */
const clients = []
/**
 * WebSocket server
 */
const websocket_server = new WebSocket.Server({port: _.MAIN_PORT})
websocket_server.on('connection',function(webSocket, request){
    if(verify(request.socket.remoteAddress)){
        //add server
        let thisServer = {
            socket: webSocket
        }
        servers.push(thisServer)
        console.log('New Server \"'+request.socket.remoteAddress+'\" Joined!')
        webSocket.on('message',function(data){
            let dataObject = $.obj(data)
            switch(dataObject[0]){
                //auth
                case 'i':
                    //login
                    clients.push(dataObject[1])
                    //broadcast
                    servers.forEach(function(sv){sv.socket.send($.str([dataObject[0],dataObject[1]]))})
                    break
                case 'o':
                    //logout
                    for(let i = 0; i < clients.length; i++){
                        if(clients[i] === dataObject[1]){
                            clients.splice(i, 1)
                            break
                        }
                    }
                    //broadcast
                    servers.forEach(function(sv){sv.socket.send($.str([dataObject[0],dataObject[1]]))})
                    break
                //file access
                case 'a': //does it exist?
                    new Promise(function(){
                        IOSafe.access('.'+dataObject[1]+'.json', IOSafe.fs.constants.F_OK, function(accessErr){
                            if(accessErr)
                                webSocket.send($.str([dataObject[0],false]))
                            else
                                webSocket.send($.str([dataObject[0],true]))
                        })
                    })
                    break
            }
        })
        //destroy when dc
        webSocket.on('close',function(){
            for(let s=0; s<servers.length; s++){
                if(servers[s] === thisServer){
                    servers.splice(s,1)
                    console.log('A server left!')
                    break
                }
            }
        })
    }else webSocket.terminate() //decline
})
/**
 * Verify imcoming ip address
 * @param {string} ip Incoming IP address.
 * @returns {boolean} allowed?
 */
function verify(ip){
    if(_.MAIN_INTERNAL_ONLY === false)
        return true 
    else{
        for(let v=0; v < _.MAIN_INTERNAL_ADDR.length; v++){
            if(_.MAIN_INTERNAL_ADDR[v] === ip)
                return true
        }
        return false
    }
}
/**
 * Express application
 */
const app = Express()
app.use(BodyParser.text({limit: '64mb'}));
app.use(BodyParser.urlencoded({limit: '64mb', extended: false }));
app.get('/load/:type/:id', async function(request, response){
    if(verify(request.ip))
        IOSafe.read('./' + request.params.type + '/' + request.params.id + '.json', function(readErr, readData){
            if(readErr){
                console.error(read_err_str+request.params.id+' R: '+readErr)
                response.send('fail')
            }
            else
                response.send(readData)
        })
    else
        response.send('fail')
})
app.post('/save/:type/:id',async function(request,response){
    if(verify(request.ip))
        IOSafe.write('./' + request.params.type + '/' + request.params.id + '.json', request.body, function(writeErr){
            if(writeErr){
                console.error(write_err_str+request.params.id+' R: '+writeErr)
                response.send('fail')
            }else
                response.send('success')
        })
    else
        response.send('fail')
})
/**
 * HTTP Server.
 */
const http = {server: null}
if(_.MAIN_HTTPS){
    http.server = require('https').createServer({
        cert: _.MAIN_SSL_CERT,
        key:  _.MAIN_SSL_PKEY
    },app)
    http.server.listen(_.MAIN_EXPRESS_PORT)
}else
    app.listen(_.MAIN_EXPRESS_PORT,function(){})
console.log('- AranOnline Main Server -')