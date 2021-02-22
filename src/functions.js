/*!
 * Short-functions.
 * 
 * @author SysError99
 * @license MIT
 */
const Crypto = require('crypto')
module.exports = {
    // - - - - - - - - - - - - - - - - - - - - Number - - - - - - - - - - - - - - - - - - - - 
    /**
     * Random an integer from zero to certain length from 0 to N - 1.
     * @param {number} length Length of an integer.
     * @returns {number} Randomized integer.
     */
    randomInterger: function(length) {return Math.floor(Math.random() * length)},
    // - - - - - - - - - - - - - - - - - - - - Array - - - - - - - - - - - - - - - - - - - - 
    /**
     * Randomly choose an element from array.
     * @param {array} arr A target array.
     * @returns {any} A value from random index of array.
     */
    randomChoose: function(arr) {return arr[Math.floor(Math.random() * arr.length)]},
    /**
     * Shuffle an array.
     * @param {array} arr Target array.
     * @returns {array} Shuffled array.
     */
    shuffle: function(arr){
        let shuffleArraySize = arr.length
        let shuffleRandom, shuffleTemp
        for(let shuffleIndex = 0; shuffleIndex < shuffleArraySize -1; shuffleIndex++){
            shuffleRandom = Math.floor(Math.random() * shuffleArraySize)
            shuffleTemp = arr[shuffleIndex]
            arr[shuffleIndex] = arr[shuffleRandom]
            arr[shuffleRandom] = shuffleTemp
        }
        return arr
    },
    /**
     * Merge an object into single one.
     * @param {object} objTarget Target object
     * @param {object} objSource Source object
     * @returns {object} Merged target object.
     */
    merge:function(objTarget,objSource){
        for(let objAttr in objSource){
            if(
                !Array.isArray(objectTarget[objAttr]) &&
                !Array.isArray(objSource[objAttr]) &&
                typeof objTarget[objAttr] === 'object'&&
                typeof objSource[objAttr] === 'object'
            ){
                this.merge(objTarget[objAttr],objSource[objAttr])
            }else objTarget[objAttr] = objSource[objAttr]
        }
        return objTarget
    },
    // - - - - - - - - - - - - - - - - - - - - JSON - - - - - - - - - - - - - - - - - - - - 
    /**
     * Parse JSON string.
     * @param {string} string String to parse.
     * @returns {object} A JSON object.
     */
    obj: function(string){
        try {return JSON.parse(string)}
        catch {return {}}
    },
    /**
     * Stringify a JSON object.
     * @param {*} jsobj An object to be stringified.
     * @returns {string} JSON string.
     */
    str: function(jsobj){return JSON.stringify(jsobj)},
    // - - - - - - - - - - - - - - - - - - - - Strings - - - - - - - - - - - - - - - - - - - - 
    /**
     * Generate hashed value.
     * @param {string} source Any string.
     * @returns {string} A hashed string.
     */
    hsh: function(source) { return Crypto.createHash('sha512').update(source).digest('hex') },
    /**
     * Remove illegal characters from file name.
     * @param {string} string String to be solved.
     */
    noIllegalCharacters: function(string){
        return string.replace(/[/\\?%*:|"<>]/g, '-').split('@').join('-').toLowerCase()
    },
    /**
     * Check variable type is as expected.
     * @param {any} value Any value to be tested
     */
    typeCorrect: function(value){
        let typeTest = false
        try{
            typeTest = (typeof value !== 'undefined' && value !== null)
        }catch(err){
            console.error(err)
            typeTest = false
        }
        return typeTest
    },
    /**
     * Generate unique text.
     * @param {number} length Text length.
     * @returns {number} A generated unique text.
     */
    uuid: function(length){
        let generatedUUID = ''
        let choice = [48,65,97]
        let choiceRange = [10,26,26]
        for(let i=0; i<length; i++){
            let currentChoice = Math.floor(Math.random() * 3)
            generatedUUID += String.fromCharCode(choice[currentChoice] + Math.floor(Math.random() * choiceRange[currentChoice]))
        }
        return generatedUUID
    }
}