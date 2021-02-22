/*!
 * Node Server, a scalable server to be connected with clients.
 * 
 * @author SysError99
 * @license Proprietary
 */
// *** - - - - - - - - - - Libraries - - - - - - - - - - ***
const WebSocket = require('ws')
const FileSystem = require('fs')
const MainServer = require('./server.main')
// - - - - - - - - - - - - Modules - - - - - - - - - - ***
const $ = require('./functions')
const _ = require('./server.constant')
const Action = require('./server.action')
const Data = require('./server.data')
const Map = require('./server.map')
// *** - - - - - - - - - - Server parameters - - - - - - - - - - ***
/**
 * Active clients.
 */
const client = []
/**
 * Client IP address connection limit list
 */
const client_ip_limit = {}
/**
 * Max clients can be connected to this server
 */
const max_clients = 1024
/**
 * Login Attempts Counter.
 */
const login_attempts = []
/**
 * connection mode
 */
const connection_mode = {}
if(_.HTTPS){
    connection_mode.server = require('https').createServer({
        cert: FileSystem.readFileSync(_.SSL_CERT),
        key: FileSystem.readFileSync(_.SSL_PKEY)
    })
    connection_mode.server.listen(parseInt(_.SERVER_PORT))
}else
    connection_mode.port = _.SERVER_PORT
/*
 * Server communication part.
 */
const websocket_server = new WebSocket.Server(connection_mode)
/**
 * If server is in shutdown state.
 */
let server_shutdown = false
/**
 * Client Authentication module
 */
const ClientAuth = {
    /**
     * Authenticate client
     * @param {object} clientObject Client object
     * @param {string} username Username
     * @param {string} password Password
     */
    authenticate: function(clientObject, username, password){
        if(clientObject.usr !== ''){
            clientObject.socket.send($.str({
                0: _.LOGIN_ALREADY
            }))
            return
        }
        if(
            (typeof username !== 'string' || username === '') ||
            (typeof password !== 'string' || password === '')  
        ){
            clientObject.socket.send($.str({
                0: _.LOGIN_INVALID
            }))
            return
        }
        for(let i=0; i<login_attempts.length; i++){
            if(login_attempts[i].usr === username){
                let loginAttempt = login_attempts[i].tout
                if(loginAttempt > 0){
                    clientObject.socket.send($.str({
                        0: _.LOGIN_TOO_MUCH,
                        1: loginAttempt
                    }))
                    return
                }
            }
        }
        ClientAuth.retrieveUsrInfo(clientObject,username,password)
    },
    /**
     * Retrieve user log-in information, then verify.
     * @param {object} clientObject Client object
     * @param {string} username Username
     * @param {string} password Password
     */
    retrieveUsrInfo: function(clientObject, username, password){
        MainServer.read('/usr/'+username, function(usrNotExistErr,usrInfoStr){
            if(usrNotExistErr){
                ClientAuth.attemptCount(clientObject, username)
                clientObject.socket.send($.str({
                    0: _.LOGIN_USR_NOT_EXIST
                }))
                return
            }
            ClientAuth.verifyPassword(clientObject, username, password, usrInfoStr)
        })
    },
    /**
     * Verify this user with given password, then load game data if matches.
     * @param {object} clientObject Client object
     * @param {string} username Username
     * @param {string} password Password
     * @param {string} usrInfoStr String of user info
     */
    verifyPassword: function(clientObject, username, password, usrInfoStr){
        let usrInfo = $.merge(Data.newAccount('','',''), $.obj(usrInfoStr))
        if(usrInfo.pwd !== $.hsh(password + _.SERVER_SALT)){ //wrong password
            ClientAuth.attemptCount(clientObject, username)
            clientObject.socket.send($.str({
                0: _.LOGIN_WRONG_PWD
            }))
            return
        }
        ClientAuth.retrieveUsrGameData(clientObject,username)
    },
    /**
     * Load game data, and bind user's game data with it.
     * @param {object} clientObject Client object
     * @param {string} username Username
     */
    retrieveUsrGameData: function(clientObject, username){
        MainServer.read('/game/'+username, function(GameDataNotExistErr, GameDataFile){
            if(GameDataNotExistErr){
                console.error('Can\'t find user data \"'+username+'\": '+GameDataNotExistErr)
                clientObject.socket.send($.str({
                    0: _.LOGIN_GAME_DATA_NOT_EXIST
                }))
                return
            }
            clientObject.usr = username
            clientObject.data = $.merge(Data.newGameData() , $.obj(GameDataFile))
            clientObject.socket.send($.str({
                0: _.LOGIN_SUCCESS,
            }))
            Map.display(clientObject)
            MainServer.socket.send($.str(['i',username])) // tell main server
        })
    },
    /**
     * Count wrong login attempt.
     * @param {object} clientObject Client object
     * @param {string} username Username
     */
    attemptCount: function(clientObject, username){
        if(clientObject.loginAttempt > 4){
            clientObject.loginAttempt = 0
            let loginAttemptFound = false
            for(let i=0; i<login_attempts.length; i++){
                if(login_attempts[i].usr === username){
                    login_attempts[i].time = login_attempts[i].time + 1
                    login_attempts[i].tout = Math.pow(2, login_attempts[i].time) * 60
                    break
                }
            }
            if(loginAttemptFound === false)
                login_attempts.push({
                    usr: username,
                    time: 1,
                    tout: 60
                })
        }else
            clientObject.loginAttempt = clientObject.loginAttempt + 1; // add
    }
}
/**
 * Client Registeration module
 */
const ClientReg = {
    /**
     * Create a new account.
     * @param {object} clientObject Client object
     * @param {string} username Username
     * @param {string} password Password
     * @param {string} email E-mail
     */
    register: function(clientObject, username, password, email){
        if(
            (typeof username !== 'string' || username === '') ||
            (typeof password !== 'string' || password === '') ||
            (typeof email    !== 'string' || email    === '') 
        ){
            clientObject.socket.send($.str({
                0: _.REGISTER_INVALID
            }))
            return
        }
        ClientReg.findUsr(clientObject, username, password, email)
    },
    /**
     * Find if that user is not exist, then continue.
     * @param {object} clientObject Client object
     * @param {string} username Username
     * @param {string} password Password
     * @param {string} email E-mail
     */
    findUsr: function(clientObject, username, password, email){
        let registerFileName = '/usr/' + username
        MainServer.access(registerFileName, function(usrFound){
            if(usrFound){
                clientObject.socket.send($.str({
                    0: _.REGISTER_USR_EXIST
                }))
                return
            }
            ClientReg.writeUsrInfo(clientObject, username, password, email)
        })
    },
    /**
     * Write user information, then continue.
     * @param {object} clientObject Client object
     * @param {string} username Username
     * @param {string} password Password
     * @param {string} email E-mail
     */
    writeUsrInfo: function(clientObject, username, password, email){
        let registerFileName = '/usr/' + username
        MainServer.write(registerFileName, $.str(Data.newAccount(email,$.hsh(password+_.SERVER_SALT))),function(usrRegisterErr){
            if(usrRegisterErr){
                console.error('Can\'t register a new user \"'+registerFileName+'\": '+usrRegisterErr)
                clientObject.socket.send($.str({
                    0: _.REGISTER_FAIL
                }))
                return
            }
            ClientReg.writeGameData(clientObject,username,password)
        })
    },
    /**
     * Write game data file.
     * @param {object} clientObject Client object
     * @param {string} username Username
     * @param {string} password Password
     */
    writeGameData: function(clientObject, username, password){
        MainServer.write('/game/' + username, $.str(Data.newGameData()),function(usrGameDataWriteErr){
            if(usrGameDataWriteErr){
                console.error('Can\'t write a new user data for \"' + username + '\": '+usrGameDataWriteErr)
                clientObject.socket.send($.str({
                    0: _.REGISTER_FAIL
                }))
                return
            }
            console.log('New user ' + username + ' has been registered!')
            clientObject.socket.send($.str({
                0: _.REGISTER_SUCCESS,
                1: username, 
                2: password
            }))
        })
    }
}
/**
 * Handle client actions (system & security)
 * @param {string} clientCmdStr Client command data (as string)
 * @param {object} clientObject Client Object
 */
async function clientCmdParse(clientCmdStr, clientObject){
    let clientCmd
    try {
        clientCmd = $.obj(clientCmdStr)
    }catch{
        clientCmd = null
    }
    /*msg:string -> data:{
        0: command
        :
        n: argument
    }
    */
    if(clientCmd !== null) {
        switch(clientCmd[0]){
            case _.LOGIN:
                /*
                1: username
                2: password
                */
                ClientAuth.authenticate(clientObject, clientCmd[1], clientCmd[2])
                break
            //register
            case _.REGISTER_MOBILE:
                clientCmd [1] = $.uuid(16)
                clientCmd [2] = $.uuid(16)
                clientCmd [3] = 'none'
            case _.REGISTER:
                /*
                    1: username
                    2: password
                    3: email
                */
                ClientReg.register(clientObject, clientCmd[1], clientCmd[2], clientCmd[3])
                break
            case _.TERMINATE:
                if(clientCmd[1] === _.SERVER_KEY){
                    client.forEach(function(terminateClient){
                        terminateClient.socket.send($.str({
                            0: _.SERVER_SHUTDOWN
                        }))
                        terminateClient.socket.close()
                    })
                    server_shutdown = true // flag
                    setInterval(function(){
                        if(client.length <= 0 && Object.keys(Map.container.active_map).length <= 0 && MainServer.idle()) process.exit(0)
                    },1)
                }
                break
            default:
                if(clientObject.usr !== '' && clientObject.data !== null) //logged in
                    Action.perform(clientCmd, clientObject)
                else
                    clientObject.socket.send($.str({0: _.LOGIN_FIRST}))
                break
        }
    }else clientObject.socket.send({0: _.INPUT_INVALID})
}
setInterval(function(){ //0.01 seconds
    client.forEach(async function(clientObject){
        clientObject.cmded = false
        clientObject.mapWalkCooldown = false
        if(clientObject.map !== null)
            Map.entities(clientObject)
    })
},25)
setInterval(function(){ // 0.2 seconds
    //auto-display-entities
    client.forEach(function(clientObject){
        clientObject.worldWalkCooldown = false
    })
},200)
setInterval(function(){ // one second
     // login attempts manager
    login_attempts.forEach(function(lAItem){
        if(lAItem.tout > 0)
            lAItem.tout = lAItem.tout - 1
    })
},1000)
MainServer.read('/world/'+_.SERVER_PORT,function(worldErr, worldFile){// World map loader.
    if(worldErr)
        throw 'Fatal error in world loading: ' + worldErr
    else
        Map.container.world = $.obj(worldFile)
})

websocket_server.on('connection', function(webSocket, request){ // client connect
    if(typeof client_ip_limit[request.socket.remoteAddress] === 'undefined')
        client_ip_limit[request.socket.remoteAddress] = 0
    if(server_shutdown === true){
        webSocket.send($.str({0: 'serverShutdown',}))
        webSocket.close()
    }else if(client.length < max_clients && client_ip_limit[request.socket.remoteAddress] < 10){
        let thisClient = Data.newClient(webSocket, request.socket.remoteAddress)
        client_ip_limit[request.socket.remoteAddress]++ //ip login limit
        client.push(thisClient)
        webSocket.on('message',function(data){
            if(thisClient.cmded === false){
                thisClient.cmded = true
                clientCmdParse(data, thisClient)
            }
        })
        webSocket.on('close', function(){ //disconnect
            if(thisClient.usr !== '' && thisClient.data !== null){ 
                MainServer.write('/game/'+thisClient.usr, $.str(thisClient.data), function(clientDataSaveErr){
                    if(clientDataSaveErr){
                        console.error('Can\'t save user data: ' + clientDataSaveErr)
                    }
                })
            }
            if(thisClient.map !== null){
                Map.unload(thisClient)
            }
            if(client_ip_limit[thisClient.ip] <= 1){
                delete client_ip_limit[thisClient.ip];
            }else{
                client_ip_limit[thisClient.ip]--;
            }
            for(let crp=0; crp < client.length; crp++){
                if(client[crp] === thisClient){
                    client.splice(crp, 1)
                    break
                }
            }
            MainServer.socket.send($.str(['o',thisClient.usr])) //tell main
        })
    }else{ //decline connection, full connection
        webSocket.send($.str({0: 'connectionFull',}))
        webSocket.close()
    }
})
console.log(' *** AranOnline Server running on port '+_.SERVER_PORT+' ***')