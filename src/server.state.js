/*!
 * Objects & players states.
 * 
 * @author SysError99
 * @license Proprietary
 */
const _ = require('./server.constant')
/**
 * State properties list.
 */
const state = [
    {
        name: 'regeneration',
        action: []
    }
]
module.exports = {
    list: state,
    /**
     * Create a new character/object state
     * @param {number} newStateId State Id
     */
    new: function(newStateId, newStateLvl, newStateTurn){
        return {
            /**@type {number} State ID*/
            id: newStateId,
            /**@type {number} State level*/
            lvl: newStateLvl,
            /**@type {number} State turns left*/
            turn: newStateTurn
        }
    }
}