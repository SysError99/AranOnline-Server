/*!
 * Game objects.
 * 
 * @author SysError99
 * @license Proprietary
 */
const _ = require('./server.constant')
/**
 * Object data
 */
const object = {
    [_.OBJ_CHEST]:{
        hp: 100,
        col: true,
        type: 'object',
        loot: [
            {
                id: _.ITEM_STONE,
                amount: 1,
                chance: 0.75
            }
        ],
        scr: {
            spawn: null,
            step: null,
            die: null
        }
    }
}
module.exports = {
    list: object,
    /**
     * Create a new Object for the map.
     * @param {number} objId Object ID to be created
     * @param {number} objX X-coordinate to be placed in.
     * @param {number} objY Y-coordinate to be placed in.
     */
    new: function(objId, objX, objY){
        let objData = object[objId]
        let newObjLoot = []
        object[objId].loot.forEach(function(lootItem){
            for(let nL = 0; nL < lootItem.amount; nL++){
                if(Math.random() <= lootItem.chance)
                    newObjLoot.push(lootItem.id)
            }
        })
        return {
            /**@type {number} Object ID*/
            id: objId,
            
            /**@type {number} Object current hit points*/
            hp: objData.hp,
            /**@type {number} Object max hit points*/
            mhp: objData.hp,

            /**@type {boolean} Collision of this object*/
            col: objData.col,
            /**@type {number} X-coordinate*/
            x: objX,
            /**@type {number} Y-coordinate*/
            y: objY,
            /**@type {number} Fractional movement X-coordinate*/
            fx:0,
            /**@type {number} Fractional movement Y-coordinate*/
            fy:0,
            /**@type {number} Rotation*/
            rot: 2,
            /**@type {number} Displayed animation frame*/
            frame: 0,
            
            /**@type {array} Items in loot*/
            loot: newObjLoot,
            /**@type {object} list of scripts used in this object*/
            scr: objData.scr
        }
    },
}