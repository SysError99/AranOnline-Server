/*!
 * An extension to read/write I/O safely.
 * 
 * @author SysError99
 * @license MIT
 */
const FileSystem = require('fs')
const io = {amount: 0}
/**
 * IO started
 * @param {string} str Location.
 */
function ioStart(str){
    io[str] = true
    io.amount++
}
/**
 * IO Ended
 * @param {string} str Location.
 */
function ioEnd(str){
    delete io[str]
    io.amount--
}
/**
 * Callback when data access is finished
 * @callback pendingCompletedCallback
 */
/**
 * Wait until pending IO is finished
 * @param {string} str Location
 * @param {pendingCompletedCallback} callback Callback when pending IO is finished.
 */
function ioWait(str,callback){
    let waitIoObj = setInterval(function(){
        if(typeof io[str] === 'undefined'){
            clearInterval(waitIoObj)
            callback()
        }
    },1)
}
module.exports = {
    fs: FileSystem,
    /**
     * Callback after data access is finished.
     * 
     * @callback accessCallback
     * @param error If error occured.
     */
    /**
     * Asynchronously test user file permission on a specific path.
     * @param {string} path File path.
     * @param {number} mode Mode number
     * @param {accessCallback} callback Callback after execution is successful.
     */
    access: function(path, mode, callback){
        ioWait(path, function(){
            ioStart(path)
            FileSystem.access(path, mode, function(accessErr){
                ioEnd(path)
                callback(accessErr)
            })
        })
    },
    /**
     * Is IO empty (free) now?
     * @returns {boolean} Is IO empty?
     */
    empty: function(){
        return io.amount <= 0
    },
    /**
     * Callback for data read.
     * 
     * @callback readCallback
     * @param {string} error Error when read file.
     * @param {string} data Data received.
     */
    /**
     * Asynchronously read file on a specific path.
     * @param {string} path File path.
     * @param {readCallback} callback Callback after execution is successful.
     * @callback 
     */
    read: function(path, callback){
        ioWait(path, function(){
            ioStart(path)
            FileSystem.readFile(path, 'utf-8' ,function (fileReadErr, data){
                ioEnd(path)
                callback(fileReadErr, data)
            })
        })
    },
    /**
     * Callback for data write.
     * 
     * @callback writeCallback
     * @param {string} error Error when write file.
     */
    /**
     * Asynchronously write file on a specific path.
     * @param {string} path File path.
     * @param {string} data Data to be written in.
     * @param {writeCallback} callback Callback after execution is successful.
     */
    write: function(path, data, callback){
        ioWait(path, function(){
            ioStart(path)
            FileSystem.writeFile(path, data, function(fileReadErr){
                ioEnd(path)
                callback(fileReadErr)
            })
        })
    }
}