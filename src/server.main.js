/*!
 * Main server communication library.
 * 
 * @author SysError99
 * @license Proprietary
 */
/**
 * WebSocket Library.
 */
const WebSocket = require('ws')
const $ = require('./functions')
const _ = require('./server.constant')
/**
 * Current IO amount.
 */
const io = {amount: 0}
/**
 * Logged - in clients (from this server & other servers)
 */
const logged_in = []
/**
 * Message templates for using with main server.
 */
const websocket_main_server_message = ['MainServer: ', ' has logged in!', ' has logged out!']
/**
 * Main server connection object
 */
const main_server = {socket: '', http:null, https:false}
if(_.MAIN_HTTPS){
    main_server.socket = new WebSocket('wss://'+_.MAIN_URL+':'+String(_.MAIN_PORT))
    main_server.http  = require('https')
    main_server.https = true
}else{
    main_server.socket = new WebSocket('ws://'+_.MAIN_URL+':'+String(_.MAIN_PORT))
    main_server.http  = require('http')
}
main_server.socket.on('message', function(wslsResponse){ // message from main
    let wslsMsg = $.obj(wslsResponse)
    switch(wslsMsg[0]){
        case 'i':
            //logging in
            logged_in.push(wslsMsg[1])
            console.log(websocket_main_server_message[0] + wslsMsg[1] + websocket_main_server_message[1])
            break
        case 'o':
            //logging out
            for(let wslsIndex = 0; wslsIndex < logged_in.length; wslsIndex++){
                if(logged_in[wslsIndex] === wslsMsg[1]){
                    logged_in.splice(wslsIndex,1)
                    break
                }
            }
            console.log(websocket_main_server_message[0] + wslsMsg[1] + websocket_main_server_message[2])
            break
        //file access
        case 'a':
            access.shift()(wslsMsg[1])
            break
    }
})
/**
 * Access callback stack
 */
const access = []
module.exports = {
    socket: main_server.socket,
    /**
     * Callback when file access is completed.
     * @callback accessCallback
     * @param {boolean} accessErr If file is not exist/protected.
     */
    /**
     * Check if file exists/not protected.
     * @param {string} location File location
     * @param {accessCallback} callback callback when task is finshed.
     */
    access: function(location, callback){
        main_server.socket.send($.str(['a',location]))
        access.push(callback)
    },
    /**
     * If there is no I/O at the time
     * @returns {boolean} Is there any IO now?
     */
    idle: function(){
        return io.amount <= 0
    },
    /**
     * Check if this user is already logged in.
     * @param {string} usr Username.
     * @returns {boolean} Did user logged in?
     */
    loggedIn:function(usr){
        let loginAlready = false
        for(let i=0; i<logged_in.length; i++){
            if(logged_in[i] === usr){
                loginAlready = true
                break
            }
        }
        return loginAlready
    },
    /**
     * Callback after data reading is finished.
     * @callback readCallback
     * @param {string} err If this read encounters error.
     * @param {string} data Data received from server.
     */
    /**
     * Perform GET to load data from main server.
     * @param {string} location Location of data
     * @param {readCallback} callback Callback when task is finshed.
     */
    read: function(location, callback){
        io.amount++
        return new Promise(function(readResolve, readReject){
            let readGetOptions = {
                hostname: _.MAIN_URL,
                port: _.MAIN_EXPRESS_PORT,
                path: '/load'+location,
                method: 'GET'
            }
            let readReq = main_server.http.request(readGetOptions, function(readRes){
                if(readRes.statusCode !== 200){
                    readReject('server Error '+String(readRes.statusCode))
                    readRes.resume()
                    return
                }
                let readRawData = ''
                readRes.setEncoding('utf8')
                readRes.on('data', function(chunk){
                    readRawData += chunk
                })
                readRes.on('end', function(){
                    if(readRawData === 'fail')
                        readReject('data not exist!')
                    else
                        readResolve(readRawData)
                })
            })
            readReq.on('error', function(httpErr){
                readReject('Can\'t perform GET request on '+location+'::'+httpErr.message)
            })
            readReq.end()
        }).then(function(readData){
            callback(false,readData)
        },function(readErr){
            callback(readErr, '')
        }).finally(function(){
            io.amount--
        })
    },
    /**
     * Callback after data writing is finished.
     * @callback writeCallback
     * @param {string} err If this write encounters error.
     */
    /**
     * Perform POST to save data from main server.
     * @param {string} location Location of data
     * @param {string} data Data to be written into
     * @param {writeCallback} callback Callback when task is finshed.
     */
    write: function(location, data, callback){
        io.amount++
        return new Promise(function(writeResolve, writeReject){
            let writePostOptions = {
                hostname: _.MAIN_URL,
                port: _.MAIN_EXPRESS_PORT,
                path: '/save'+location,
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-length': Buffer.byteLength(data)
                }
            }
            let writeReq = main_server.http.request(writePostOptions, function(writeRes){
                if(writeRes.statusCode !== 200){
                    writeReject('error code occured before POST: '+String(writeRes.statusCode))
                    return
                }
                let writeRawData = ''
                writeRes.setEncoding('utf8')
                writeRes.on('data', function(chunk){
                    writeRawData += chunk
                })
                writeRes.on('end', function(){
                    if(writeRawData === 'success')
                        writeResolve(false)
                    else
                        writeReject('error code occured while POST')
                })
            })
            writeReq.on('error', function(httpErr){
                writeReject('Can\'t perform POST request on '+location+'::'+httpErr.message)
            })
            writeReq.write(data)
            writeReq.end()
        }).then(function(writeStatus){
            callback(writeStatus)
        },function(writeStatusFail){
            callback(writeStatusFail)
        }).finally(function(){
            io.amount--
        })
    },
}