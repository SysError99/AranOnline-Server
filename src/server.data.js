/*!
 * Account & game data management.
 * 
 * @author SysError99
 * @license Proprietary
 */
const _ = require('./server.constant')
const Character = require('./server.character')
const Map = require('./server.map')
const ItemTool = require('./server.item.tool')
module.exports = {
    /**
     * Create a client connection object.
     * @param {object} wsSocket Socket object from 'connection'
     * @param {string} remoteAddr IP address from HTTP GET request
     */
    newClient: function(wsSocket, remoteAddr){ //client object, when connect
        return {
            /**@type {string} Client IP address*/
            ip: remoteAddr,
            /**@type {WebSocket} WebSocket connection*/
            socket: wsSocket,
            /**@type {number} Login attempts*/
            loginAttempt: 0,

            /**@type {string} Username*/
            usr: '',
            /**@type {object} Data object (after logged in)*/
            data: null,

            /**@type {boolean} Commands issued switch*/
            cmded: false,
            /**@type {object} Active map*/
            map: null,
            /**@type {number} Map position X-coordinate*/
            mx: 0,
            /**@type {number} Map position Y-coordinate*/
            my: 0,
            /**@type {number} Fractional movement X-coordinate*/
            fx: 0,
            /**@type {number} Fractional movement Y-coordinate*/
            fy: 0,
            /**@type {number} Displayed animation frame*/
            frame: 0,
            rot: 0,

            /**@type {boolean} World walk cooldown*/
            worldWalkCooldown: false,
            /**@type {boolean} Map walk cooldown*/
            mapWalkCooldown: false
        }
    },
    /**
     * Create a new account object string.
     * @param {string} newIDEmail E-Mail address
     * @param {string} newIDPassword Password
     * @returns {string} A string of JSON object of a new account.
     */
    newAccount: function(newIDEmail, newIDPassword){ //new ID, when register
        return {
            email: newIDEmail,
            pwd: newIDPassword,
        }
    },
    /**
     * Create a new user game data
     * @returns {string} A string of JSON object of a new game data for a new account.
     */
    newGameData: function(){
        //random spawn location
        let spawnFound = false
        let spawnX, spawnY
        while(!spawnFound){
            spawnX = Math.floor(Math.random() * _.MAP_MAX_X)
            spawnY = Math.floor(Math.random() * _.MAP_MAX_Y)
            switch(Map.container.world[spawnX][spawnY]){
                //allowed spawn location
                case 'g':
                case 'j':
                case 'd':
                case 'b':
                    spawnFound = true
                    break
            }
        }
        return {
            //general data
            name: 'Player',
            mainChar: 0,
            exp: 0,
            rp: 0,
            gp: 0,

            adultContent: false,

            //world location
            wx:spawnX,
            wy:spawnY,
            
            //vehicle
            activeVehicle: '',
            boat: {
                id: -1
            },
            ship:{
                id: -1
            },
            air:{
                id: -1
            },

            //characters
            chr: [Character.new(_.CHR_TIGER)],
            
            //inventory
            inv: [ItemTool.newItem(_.ITEM_STONE,40), ItemTool.newTool(_.TOOL_AXE,1,1)],
            
            //team
            team:[0,-1,-1,-1,-1],
        }
    }
}