const path = require('path')
const { extendAbiWithEvents } = require('@fuse/contract-utils')

const relPath = path.join(__dirname, '../')

extendAbiWithEvents(relPath, 'TokenFactory', 'BasicToken')
