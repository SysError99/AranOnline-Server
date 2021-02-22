/*!
 * Client game action handler.
 * 
 * @author SysError99
 * @license Proprietary
 */
const $ = require('./functions')
const _ = require('./server.constant')
const Map = require('./server.map')
/**
 * Handle client commands (gameplay actions)
 * @param {ojbect} clientCmd Client command (as object)
 * @param {object} clientObject Client object
 */
function action(clientCmd, clientObject){
    switch(clientCmd[0]){
        //overall status
        case _.GET_STATUS:
            clientObject.socket.send($.str({
                0: _.PLAYER_STATUS,
                name: clientObject.data.name,
                exp: clientObject.data.exp,
                rp: clientObject.data.rp,
                gp: clientObject.data.gp,
                chr: clientObject.data.chr[clientObject.data.mainChar].id,
                skn: clientObject.data.chr[clientObject.data.mainChar].skn.body
            }))
            break
        case _.PLAYER_RENAME:
            /*
            1: new name
                */
            clientObject.data.name = clientCmd[1]
            clientObject.socket.send($.str({
                0: _.RENAME_SUCCESS
            }))
            break
        //movement
        case _.MOVE_UP:
        case _.MOVE_DOWN:
        case _.MOVE_LEFT:
        case _.MOVE_RIGHT:
            if(clientObject.worldWalkCooldown === false && clientObject.mapWalkCooldown === false){
                Map.clientMove(clientObject,clientCmd[0])
                if(clientObject.map === null)
                    clientObject.worldWalkCooldown = true
                else
                    clientObject.mapWalkCooldown = true
            }
            break
        case _.GET_IN:
                if(clientObject.map === null)
                    Map.load(clientObject)
                else
                    Map.unload(clientObject)
            break
        case _.BLOCK_HIT:

            break
    }
}
module.exports = {
    perform: action
}