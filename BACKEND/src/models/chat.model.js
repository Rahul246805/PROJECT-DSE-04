const mongoose = require('mongoose');


const chatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    preferredModel: {
        type: String,
        default: 'llama-3.3-70b-versatile',
        trim: true,
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

chatSchema.pre('validate', function () {
    // Backfill legacy chat documents that were created before userId was added.
    if (!this.userId && this.user) {
        this.userId = this.user;
    }
});

const chatModel = mongoose.model("chat", chatSchema)


module.exports = chatModel;
