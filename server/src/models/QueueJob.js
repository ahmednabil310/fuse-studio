const mongoose = require('mongoose')
const { Schema } = mongoose

const QueueJobSchema = new Schema({
  name: { type: String, required: [true, "can't be blank"] },
  messageId: { type: String, required: [true, "can't be blank"] },
  data: { type: Object },
  status: { type: String, default: 'pending' },
  accountAddress: { type: String },
  lastFinishedAt: { type: Date },
  failedAt: { type: Date },
  failReason: { type: String },
  failCount: { type: Number },
  communityAddress: { type: String }
}, { timestamps: true })

QueueJobSchema.index({ communityAddress: 1 })

QueueJobSchema.methods.fail = function (reason) {
  if (reason instanceof Error) {
    reason = reason.message
  }
  this.failReason = reason.toString()
  this.failCount = (this.failCount || 0) + 1
  this.status = 'failed'
}

QueueJobSchema.methods.failAndUpdate = function (reason) {
  try {
    if (reason instanceof Error) {
      reason = reason.message
    }
    return QueueJob.findByIdAndUpdate(this._id, { lastFinishedAt: Date.now(), status: 'failed', failReason: reason, $inc: { failCount: 1 } })
  } catch (error) {
    console.log(`failed to call failAndUpdate on ${this._id}`)
    return QueueJob.findByIdAndUpdate(this._id, { lastFinishedAt: Date.now(), status: 'failed', failReason: error.reason, $inc: { failCount: 1 } })
  }
}

QueueJobSchema.methods.successAndUpdate = function () {
  if (this.status === 'started') {
    return QueueJob.findByIdAndUpdate(this._id, { lastFinishedAt: Date.now(), status: 'succeeded' })
  } else {
    console.warn(`calling successAndUpdate on message with status ${this.status}`)
    return QueueJob.findByIdAndUpdate(this._id, { lastFinishedAt: Date.now() })
  }
}

const QueueJob = mongoose.model('QueueJob', QueueJobSchema)

module.exports = QueueJob
