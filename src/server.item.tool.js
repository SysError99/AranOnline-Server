/*!
 * Game Items & Tools Management.
 * 
 * @author SysError99
 * @license Proprietary
 */
const _ = require('./server.constant')
/**
 * Tool data list
 */
const tool = {
    [_.TOOL_PICKAXE]: {
        pow: 9, mpow: 0,
        blk:[
            _.BLOCK_STONE,
            _.BLOCK_ROCK,
            _.BLOCK_COAL
        ],
        obj: [],
        use: null,
        action: [_.ACTION_ATTACK],
        passive: [],
    },
    [_.TOOL_AXE]: {
        pow: 9, mpow: 0,
        blk:[
            _.BLOCK_TREE,
            _.BLOCK_TREE_1,
            _.BLOCK_TREE_2,
            _.BLOCK_TREE_DEAD,
            _.BLOCK_WALL_WOOD,
            _.BLOCK_DOOR_WOOD,
            _.BLOCK_FLOOR_WOOD,
            _.BLOCK_BED_0,
            _.BLOCK_BOOKSHELF_0
        ],
        obj:[],
        use: null,
        action: [_.ACTION_ATTACK],
        passive: [],
    },
    [_.TOOL_SHOVEL]: {
        pow: 9, mpow: 0,
        blk: [
            _.BLOCK_GRASS,
            _.BLOCK_GROUND_DIRT,
            _.BLOCK_GROUND_DRY,
            _.BLOCK_GROUND_FINE,
            _.BLOCK_GROUND_WATER,
            _.BLOCK_GROUND_WET
        ],
        obj: [],
        use: null,
        action: [],
        passive: [],
    },
    [_.TOOL_SWORD]: {
        pow: 9, mpow: 0,
        blk: [],
        obj: [],
        use: null,
        action: [_.ACTION_ATTACK],
        passive: []
    },
    [_.TOOL_FISHING]: {
        pow: 9, mpow: 0,
        blk: [],
        obj: [],
        use: function(clientObject){

        },
        action: [],
        passive: [],
    },
    [_.TOOL_WATERING]: {
        pow: 0, mpow: 0,
        blk: [],
        obj: [],
        use: function(clientObject){

        },
        action: [],
        passive: []
    }
}
module.exports = {
    list: tool,
    /**
     * Create a new item
     * @param {number} itemId Item ID.
     * @param {number} itemAmount Amount of the item (leave empty if others)
     */
    newItem: function(itemId, itemAmount){
        return {
            type: _.ITEM_TYPE_SUPPLY,
            id: itemId,
            amount: (typeof itemAmount === 'number') ? itemAmount : 0
        }
    },
    /**
     * Create a new tool.
     * @param {number} toolId Tool ID.
     * @param {number} toolLv Level of the tool.
     * @param {number} toolSlv Skill level of the tool.
     */
    newTool: function(toolId, toolLv, toolSlv){
        return {
            /**@type {number} Item type (tool)*/
            type: _.ITEM_TYPE_TOOL,
            /**@type {number} Item ID*/
            id: toolId,
            /**@type {number} Item level*/
            lv: toolLv,
            /**@type {number} Item skill level*/
            slv: toolSlv
        }
    },
    /**
     * Indicates if that tool is usable fot the target.
     * @param {object} toolData Data object of the tool.
     * @param {number} toolTargetType Target type.
     * @param {number} toolTargetId Target Id
     * @returns {boolean} Is the tool suitable for target.
     */
    toolCondition: function(toolData, toolTargetType, toolTargetId) {
        return (toolTargetType === _.TOOL_TARGET_BLOCK && toolData.blk.indexOf(toolTargetId) > -1) || (toolTargetType === _.TOOL_TARGET_OBJ && toolData.obj.indexOf(toolTarget) > -1)
    },
    /**
     * Calculate base power of the tool.
     * @param {object} toolPower Tool data.
     * @param {object} toolObj Tool object.
     */
    toolNormalPowerCalc: function(toolData, toolObj) {
        return toolData.pow * (1 + 0.1 * toolObj.lv) * ((Math.random() < 0.05 + 0.001 * toolObj.slv) ? (1.05 + 0.001 * toolObj.slv) : 1) // Tool Power * Level * critical
    }
}