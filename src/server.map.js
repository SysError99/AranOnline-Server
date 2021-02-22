/*!
 * Map system.
 * 
 * @author SysError99
 * @license Proprietary
 */
const $ = require('./functions')
const _ = require('./server.constant')
const MainServer = require('./server.main')
const Obj = require('./server.object')
/**
 * Map container.
 */
const map = {
    world:null,
    active_map:{}
}
const block_floor = [
    _.BLOCK_GRASS,
    _.BLOCK_WATER,
    _.BLOCK_WALL_WOOD,
    _.BLOCK_FLOOR_WOOD,
    _.BLOCK_ROCK,
    _.BLOCK_FLOOR_ROCK,
    _.BLOCK_SAND,
    _.BLOCK_COAL,
]
/**
 * Fill an element in circle way.
 * @param {array} array A target aray
 * @param {number} centerX X-coordinate of center of the circle.
 * @param {number} centerY Y-coordinate of center of the circle.
 * @param {number} radius Radius of the circle
 * @param {any} whatToFill What thing you want ot fill
 */
function fillCircle(array, centerX, centerY, radius, whatToFill){
    for(let i = centerX - radius; i <= centerX + radius; i++){
        for(let j = centerY - radius; j <= centerY + radius; j++){
            if(insideMap(i,j)){
                if((i-centerX)*(i-centerX) + (j-centerY)*(j-centerY) <= radius*radius) {
                    array[i][j] = whatToFill
                }
            }
        }
    }
    return array
}
/**
 * If this point is inside the map
 * @param {number} imX Position X
 * @param {number} imY Position Y
 */
function insideMap(imX,imY){
    return (
        imX >= 0 &&
        imX < _.MAP_MAX_X &&
        imY >= 0 &&
        imY < _.MAP_MAX_Y
    )
}
/**
 * Write into a map block array safely.
 * @param {array} mapArray A Map object.
 * @param {number} mapX X-postition of write location.
 * @param {number} mapY Y-position of write location.
 * @param {any} data Data to be write in.
 */
function mapWrite(mapArray, mapX, mapY, data){
    if(insideMap(mapX,mapY)){
        if(Array.isArray(mapArray)){
            if(!Array.isArray(mapArray[mapX])) mapArray[mapX] = []
            mapArray[mapX][mapY] = data
        }else console.error('mapWrite() tried to write on a non-array.')
    }else console.error('mapWrite() tried to write at out-bounds location.')
}
/**
 * Create a new map
 * @param {number} mapX X-coordinate of the map
 * @param {number} mapY Y-coordinate of the map
 * @param {string} filename File name of the map
 */
function mapNew(mapX, mapY, filename){
    if(mapX >= 0 && mapX < _.MAP_MAX_X && mapY >= 0 && mapY < _.MAP_MAX_Y){
        //generate
        let mapType = map.world[mapX][mapY]
        let mapDefaultBlock
        let mapEntities = []
        let mapEntityCount = _.MAP_MAX_X * _.MAP_MAX_Y
        switch(mapType){
            default: //grass
                mapDefaultBlock = _.BLOCK_GRASS
                let mapTrees = [_.BLOCK_TREE,_.BLOCK_TREE,_.BLOCK_TREE_1,_.BLOCK_TREE_2]
                let mapBushes = [_.BLOCK_BUSH,_.BLOCK_BUSH_FLOWER,_.BLOCK_BUSH_GRASS]
                let mapStonesAndPebbles = [_.BLOCK_STONE,_.BLOCK_PEBBLE]
                for(let mapEntityNumber = 0; mapEntityNumber < 3888; mapEntityNumber++) mapEntities.push($.randomChoose(mapTrees))
                for(let mapEntityNumber = 0; mapEntityNumber < 256; mapEntityNumber++) mapEntities.push(_.BLOCK_TREE_DEAD)
                for(let mapEntityNumber = 0; mapEntityNumber < 2400; mapEntityNumber++){
                    mapEntities.push($.randomChoose(mapBushes))
                    mapEntities.push($.randomChoose(mapStonesAndPebbles))
                }
                break
        }
        while(mapEntities.length < mapEntityCount)
            mapEntities.push(mapDefaultBlock)
        $.shuffle(mapEntities)
        //write
        let mapBlk = []
        let mapBlkDmg = []
        for(let mnI = 0; mnI < _.MAP_MAX_X; mnI++){
            for(let mnJ = 0; mnJ < _.MAP_MAX_Y; mnJ++){
                let mapEntity =  mapEntities.pop()
                if(block_floor.indexOf(mapEntity) > -1)
                    mapWrite(mapBlk,mnI,mnJ, [mapEntity, -1] )
                else
                    mapWrite(mapBlk,mnI,mnJ, [mapDefaultBlock, mapEntity] )
                mapWrite(mapBlkDmg,mnI,mnJ, 0)
            }
        }
        //write map features
        switch(mapType){
            default: //grass
                for(let mapNewLake = 0; mapNewLake < 1 + $.randomInterger(3); mapNewLake++){
                    let mapNewLakeX = $.randomInterger(_.MAP_MAX_X)
                    let mapNewLakeY = $.randomInterger(_.MAP_MAX_Y)
                    let mapNewLakeSize = 18 + $.randomInterger(6 + 1)
                    fillCircle(mapBlk, mapNewLakeX, mapNewLakeY, mapNewLakeSize, [_.BLOCK_SAND, -1] )
                    fillCircle(mapBlk, mapNewLakeX, mapNewLakeY, Math.floor(mapNewLakeSize * 0.8), [_.BLOCK_WATER, -1] )
                }
                break
        }
        return {
            /**@type {string} Map file name (for loading or saving)*/
            file: filename,
            /**@type {object} Players in the map (client object)*/
            player:[/*clientid [n]*/],
            /**@type {array} Blocks on the map*/
            block: mapBlk,
            /**@type {array} Block damage dealt*/
            blockDamage: mapBlkDmg,
            /**@type {array} Objects on the map*/
            object: [/*Obj.new()*/]
        }
    }else{
        console.error('Requested map is out of range!: ' + String(mapX) + ',' + String(mapY))
        return null
    }
}
/**
 * Load clientObject to the map.
 * @param {object} clientObject Client object
 */
function mapLoad(clientObject){
    let mapX = clientObject.data.wx
    let mapY = clientObject.data.wy
    let mapLocation = _.SERVER_PORT + '_' + String(mapX) + '_' + String(mapY)
    if(typeof map.active_map[mapLocation] !== 'object') {
        MainServer.read('/map/' + mapLocation,function(mapError,mapData){
            if(mapError){
                //can't load a map
                map.active_map[mapLocation] = mapNew(mapX, mapY, mapLocation)
                console.log('Map \'' + mapLocation + '\' can\'t be loaded! Creating a new map!')
            }else{
                //existsing map
                map.active_map[mapLocation] = $.obj(mapData)
                console.log('Map \'' + mapLocation + '\' has been loaded!')
            }
            mapClientSet(clientObject, map.active_map[mapLocation])
            mapDisplay(clientObject)
        })
    }else {
        mapClientSet(clientObject, map.active_map[mapLocation])
        mapDisplay(clientObject)
    }
}
/**
 * Unload clientObject from the map.
 * @param {object} clientObject Client object.
 */
function mapUnload(clientObject){
    for(let getOutMapClientPosition = 0; getOutMapClientPosition < clientObject.map.player.length; getOutMapClientPosition++){
        if(clientObject.map.player[getOutMapClientPosition] === clientObject){
            clientObject.map.player.splice(getOutMapClientPosition, 1)
            break
        }
    }
    if(clientObject.map.player.length <= 0){
        let mapFile = clientObject.map.file
        MainServer.write('/map/' + mapFile, $.str(clientObject.map),function(mapSaveErr){
            if(mapSaveErr){
                console.error('There\'s a problem when saving a map: '+mapSaveErr)
            }else console.log('Map \'' + mapFile + '\' has been saved!')
            delete map.active_map[mapFile]
        })
    }
    clientObject.map = null
    mapDisplay(clientObject)
}
/**
 * Set player position on the map.
 * @param {object} clientObject client object
 * @param {object} mapObject map object
 */
function mapClientSet(clientObject, mapObject){
    mapObject.player.push(clientObject)
    clientObject.map = mapObject
    clientObject.mx = 128
    clientObject.my = 128
    clientObject.fx = 0
    clientObject.fy = 0
}
/**
 * Render surroundings of current position.
 * @param {object} clientObject Client object.
 */
function mapDisplay(clientObject){
    let displayType, displayResult
    if(clientObject.map === null){ // world
        displayType = _.DISPLAY_WORLD
        displayResult = ''
        let displayX = clientObject.data.wx
        let displayY = clientObject.data.wy
        for(let disY = -_.DISPLAY_RADIUS_Y; disY <= _.DISPLAY_RADIUS_Y; disY++){
            for(let disX = -_.DISPLAY_RADIUS_X; disX <= _.DISPLAY_RADIUS_X; disX++){
                let displayTargetX = displayX + disX
                let displayTargetY = displayY + disY
                if(insideMap(displayTargetX, displayTargetY)){
                    displayResult += map.world[displayTargetX][displayTargetY]
                }else{
                    displayResult += '.' //blank
                }
            }
        }
    }else{ //map
        let displayX = clientObject.mx
        let displayY = clientObject.my
        displayType = _.DISPLAY_MAP
        displayResult = {}
        displayResult [_.DISPLAY_BLOCK_BOT] = ''
        displayResult [_.DISPLAY_BLOCK_TOP] = ''
        displayResult [_.DISPLAY_BDMG] = ''
        for(let disY = -_.DISPLAY_RADIUS_Y; disY <= _.DISPLAY_RADIUS_Y; disY++){ //block
            for(let disX = -_.DISPLAY_RADIUS_X; disX <= _.DISPLAY_RADIUS_X; disX++){
                let displayTargetX = displayX + disX
                let displayTargetY = displayY + disY
                if(insideMap(displayTargetX, displayTargetY)){
                    displayResult [_.DISPLAY_BLOCK_BOT] += String(clientObject.map.block[displayTargetX][displayTargetY][_.BLOCK_BOT]) + '_'
                    displayResult [_.DISPLAY_BLOCK_TOP] += String(clientObject.map.block[displayTargetX][displayTargetY][_.BLOCK_TOP]) + '_'
                    displayResult [_.DISPLAY_BDMG] += String(clientObject.map.blockDamage[displayTargetX][displayTargetY]) + '_'
                }else{
                    displayResult [_.DISPLAY_BLOCK_BOT] += '_'
                    displayResult [_.DISPLAY_BLOCK_TOP] += '_'
                    displayResult [_.DISPLAY_BDMG] += '_'
                }
            }
        }
        mapEntities(clientObject)
    }
    clientObject.socket.send($.str({
        0: _.DISPLAY,
        1: displayType,
        2: displayResult,
    }))
}
/**
 * Display all entites and players
 * @param {object} clientObject Client object
 */
function mapEntities(clientObject){
    let displayX = clientObject.mx
    let displayY = clientObject.my
    let displayObjects = []
    let displayPlayers = []
    if(clientObject.map.object.length > 0){ //object
        clientObject.map.object.forEach(function(displayObject){
            let displayObjectPosX = displayX - displayObject.x
            let displayObjectPosY = displayY - displayObject.y
            if (displayObjectPosX >= -_.DISPLAY_RADIUS_X &&
                displayObjectPosX <=  _.DISPLAY_RADIUS_X &&
                displayObjectPosY >= -_.DISPLAY_RADIUS_Y &&
                displayObjectPosY <=  _.DISPLAY_RADIUS_Y ){
                displayObjects.push({
                    i: displayObject.id,
                    x: displayObject.x - (displayX - 4),
                    y: displayObject.y - (displayY - 6),
                    o: displayObject.rot,
                    f: displayObject.frame
                })
            }
        })
    }
    clientObject.map.player.forEach(function(displayPlayer){ //player
        if(displayPlayer !== clientObject){
            let displayPlayerPosX = displayX - displayPlayer.mx
            let displayPlayerPosY = displayY - displayPlayer.my
            if (displayPlayerPosX >= -_.DISPLAY_RADIUS_X &&
                displayPlayerPosX <=  _.DISPLAY_RADIUS_X &&
                displayPlayerPosY >= -_.DISPLAY_RADIUS_Y &&
                displayPlayerPosY <=  _.DISPLAY_RADIUS_Y ){
                displayPlayers.push({
                    n: displayPlayer.data.name,
                    c: displayPlayer.data.chr[displayPlayer.data.mainChar].id,
                    s: displayPlayer.data.chr[displayPlayer.data.mainChar].skn.body,
                    x: displayPlayer.mx - (displayX - 4),
                    y: displayPlayer.my - (displayY - 6),
                    0: displayPlayer.fx,
                    1: displayPlayer.fy,
                    o: displayPlayer.rot,
                    f: displayPlayer.frame
                })
            }
        }
    })
    if(displayObjects.length > 0 || displayPlayers.length > 0)
        clientObject.socket.send($.str({
            0: _.DISPLAY,
            1: _.DISPLAY_ENTITY,
            2: displayObjects,
            3: displayPlayers
        }))
}
/**
 * Send its fractional position to client.
 * @param {object} clientObject Client object.
 */
function mapDispFraction(clientObject){
    clientObject.socket.send($.str({
        0: _.DISPLAY,
        1: _.DISPLAY_FRACTION,
        2: clientObject.fx,
        3: clientObject.fy
    }))
}
/**
 * Check is that location on the world is able to move to
 * @param {object} clientObject Client object
 * @param {number} walkX Position X
 * @param {number} walkY Position Y
 * @returns {boolean} Able to move to?
 */
function worldWalk(clientObject,walkX,walkY){
    let worldWalkAllow = false
    let worldWalkActiveVehicle = clientObject.data.activeVehicle
    if(worldWalkActiveVehicle === 'air') worldWalkAllow = true
    else {
        switch(map.world[walkX][walkY]){
            case 'o': //ocean
            case 's': //sea
                if(worldWalkActiveVehicle === 'ship'){
                    worldWalkAllow = true
                }else if(worldWalkActiveVehicle === 'boat'){
                    if(Math.random() > 0.75) worldWalkAllow = true
                    else slowMovement(clientObject)
                }else clientObject.socket.send($.str({0: _.MOVE_SHIP_NEED}))
                break
            case 'g': //grass
                if(worldWalkActiveVehicle === '') worldWalkAllow = true
                else clientObject.socket.send($.str({0: _.MOVE_FOOT_NEED}))
                break
            case 'j': //jungle
            case 'd': //desert
            case 'f': //frozen
                if(worldWalkActiveVehicle === '') {
                    if(Math.random() > 0.25) worldWalkAllow = true 
                    else slowMovement(clientObject)
                }else clientObject.socket.send($.str({0: _.MOVE_FOOT_NEED}))
                break
            case 'r': //river
                if(worldWalkActiveVehicle === 'boat'){
                    if(Math.random() > 0.25) worldWalkAllow = true
                    else slowMovement(clientObject)
                }else clientObject.socket.send($.str({0: _.MOVE_BOAT_NEED}))
                break
            case 'm': //mountain
            case 'v': //vulcano
                clientObject.socket.send($.str({0: _.MOVE_BLOCKED}))
                break
        }
    }
    return worldWalkAllow
}
/**
 * Check if that location in the map is able to move to.
 * @param {object} clientObject Client object.
 * @param {number} walkX X-coordinate to move to
 * @param {number} walkY Y-coordinate to move to
 * @returns {boolean} Able to move to?
 */
function mapWalk(clientObject,walkX,walkY){
    let mapWalkAllow = false
    let mapWalkActiveVehicle = clientObject.data.activeVehicle
    if(mapWalkActiveVehicle === 'air') mapWalkAllow = true
    else{
        //block
        for(let mW = _.BLOCK_BOT; mW <= _.BLOCK_TOP; mW++){
            switch(clientObject.map.block[walkX][walkY][mW]){
                case _.BLOCK_NONE:
                case _.BLOCK_GRASS:
                case _.BLOCK_PEBBLE:
                case _.BLOCK_SAND:
                case _.BLOCK_DOOR_WOOD:
                case _.BLOCK_FLOOR_WOOD:
                case _.BLOCK_FLOOR_ROCK:
                case _.BLOCK_GROUND_DIRT:
                case _.BLOCK_GROUND_DRY:
                case _.BLOCK_GROUND_FINE:
                case _.BLOCK_GROUND_WATER:
                case _.BLOCK_GROUND_WET:
                    if(mapWalkActiveVehicle === '') mapWalkAllow = true
                    else clientObject.socket.send($.str({0: _.MOVE_FOOT_NEED}))
                    break
                case _.BLOCK_WATER:
                    if(mapWalkActiveVehicle === 'boat') mapWalkAllow = true
                    else clientObject.socket.send($.str({0: _.MOVE_BOAT_NEED}))
                    break
                default:
                    mapWalkAllow = false
                    break
            }
        }
    }return mapWalkAllow
}
/**
 * Warn a player that we are moving slow.
 * @param {object} slowMovementClient Client object.
 */
function slowMovement(slowMovementClient){
    slowMovementClient.socket.send($.str({0: _.MOVE_SLOW}))
}
module.exports = {
    /**
     * Map container.
     */
    container: map,
    load: mapLoad,
    unload: mapUnload,
    /**
     * Move client through map.
     * @param {object} clientObject Client object.
     * @param {number} cmd command
     */
    clientMove: function(clientObject, cmd){
        let moveDirX = 0
        let moveDirY = 0
        switch(cmd){
            case _.MOVE_UP: 
                moveDirY = -1
                clientObject.rot = 1
                break
            case _.MOVE_DOWN:
                moveDirY = 1
                clientObject.rot = 3
                break
            case _.MOVE_LEFT:
                moveDirX = -1
                clientObject.rot = 2
                break
            case _.MOVE_RIGHT:
                moveDirX = 1
                clientObject.rot = 0
                break
        }
        if(clientObject.map === null){ //world walk
            moveDirX = clientObject.data.wx + moveDirX
            moveDirY = clientObject.data.wy + moveDirY
            if(insideMap(moveDirX,moveDirY)){
                if(worldWalk(clientObject,moveDirX,moveDirY)) {
                    clientObject.data.wx = moveDirX
                    clientObject.data.wy = moveDirY
                }
            }
        }else{ //map walk
            moveDirX = clientObject.mx + moveDirX
            moveDirY = clientObject.my + moveDirY
            if(insideMap(moveDirX,moveDirY)){
                if(mapWalk(clientObject,moveDirX,moveDirY)){
                    clientObject.mx = moveDirX
                    clientObject.my = moveDirY
                }
            }
        }
        if(clientObject.frame < 3)
            clientObject.frame++
        else
            clientObject.frame = 0
        mapDisplay(clientObject) //update clientObject map screen
    },
    display: mapDisplay,
    entities: mapEntities
}