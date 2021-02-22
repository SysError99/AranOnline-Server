/**
 * AranOnline game units.
 * 
 * @author SysError99
 * @license Proprietary
 */
const _ = require('./server.constant')
/**
 * Unit database
 */
const unit = {
    [_.UNIT_LADYBUG]: {
        col: 1,
        hp: 100,
        mp: 100,
        loot: [
            {
                id: _.ITEM_STONE,
                amount: 3,
                chance: 0.75
            }
        ],
        scr:{
            spawn: null,
            step: null,
            die: null
        }
    }
}
module.exports = {
    /**
     * Create a new unit on the position.
     * @param {number} unitId Unit ID
     * @param {*} unitX unit X position
     * @param {*} unitY unit Y position
     */
    new: function(unitId, unitX, unitY){
        let unitData = unit[unitId]
        let newUnitLoot = []
        unit[unitId].loot.forEach(function(lootItem){
            for(let nL = 0; nL < lootItem.amount; nL++){
                if(Math.random() <= lootItem.chance)
                    newUnitLoot.push(lootItem.id)
            }
        })
        return {
            id: unitId,

            hp: unitData.hp,
            mhp:unitData.mhp,
            mp: unitData.mp,
            mmp:unitData.mmp,
            col: unitData.col,

            x: unitX,
            y: unitY,
            fx:0,
            fy:0,
            rot: 2,
            frame: 0,
            
            loot: newUnitLoot,
            scr: unitData.scr
        }
    }
}