/*!
 * Game characters handler
 * 
 * @author SysError99
 * @license Proprietary
 */
const _ = require('./server.constant')
/**
 * Character properties
 */
const character = {
    [_.CHR_TIGER]: {
        pow: 1, vit: 1.25,
        ab:[ //abilities
            /*(chrObj) => {
    
            }*/
        ],
        ps:[ //passives
            /*(chrObj) => {
    
            }*/
        ]
    },
    [_.CHR_DEER]: {
        pow: 1.1, vit: 0.9, ab:[], ps:[]
    },
    [_.CHR_OX]: {
        pow: 1.25, vit: 0.75, ab:[], ps:[]
    },
    [_.CHR_WHITE_TIGER]: {
        pow: 1.35, vit: 1, ab:[], ps:[]
    },
    [_.CHR_BLUE_WOLF]: {
        pow: 1.5, vit: 0.75, ab:[], ps:[]
    }
}
/**
 * Handles character health cap.
 * @param {object} charObj Character object.
 * @param {number} charOp Character health operator.
 */
function hpOperate(charObj, charOp){
    let charStatus = character[charObj.id]
    let charMHp = 100 * charStatus.vit
    let charCalc = charObj.hp + charOp
    if(charCalc < 0) charCalc = 0
    else if(charCalc > charMHp) charCalc = charMHp
}
/**
 * Handles character mana cap.
 * @param {object} charObj Character object.
 * @param {number} charOp Character mana operator.
 */
function mpOperate(charObj, charOp){
    let charStatus = character[charObj.id]
    let charMHp = 100 * charStatus.pow
    let charCalc = charObj.hp + charOp
    if(charCalc < 0) charCalc = 0
    else if(charCalc > charMHp) charCalc = charMHp
}
module.exports = {
    /**
     * Create a new character.
     * @param {number} charId Character Id
     */
    new: function(charId){
        let charObj = {
            /**@type {number} Character ID*/
            id: charId,
            /**@type {object} Outfits pointer*/
            skn: {
                /**@type {number} Whole body outfits*/
                body: 0,
                hair: -1, ears: -1, eyes: -1, nose: -1, face: -1, mouth: -1, beard: -1, neck: -1,
                torso_u: -1, torso: -1, arm: -1, forearm: -1, hand: -1, finger: -1,
                hip: -1, pant_u: -1, pant: -1, leg: -1,
                ankle: -1, sock: -1, feet: -1,
            },
            /**@type {string} Character name*/
            name: '',
            /**@type {number} Character level*/
            lvl: 1,
            /**@type {number} Character experience points*/
            exp: 0,
            /**@type {number} Character hit points*/
            hp: 0,
            /**@type {number} Character mana points*/
            mp: 0, //mana
            /**@type {number} Character stamina points*/
            stm:100, //stamina
            /**@type {array} Character states*/
            st :[/*newState()*/],
            /**@type {number} Character chosen tool*/
            tool: -1,
        }
        hpOperate(charObj, 999999)
        mpOperate(charObj, 999999)
        return charObj
    },
    list: character,
    hpOperate: hpOperate,
    mpOperate: mpOperate
}