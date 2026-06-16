const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    avatarUrl: {
        type: String,
        trim: true,
        default: '',
    },
    authProvider: {
        type: String,
        trim: true,
        default: 'local',
    },
    fullName: {
        firstName: {
            type: String,
            trim: true,
            default: '',
        },
        lastName: {
            type: String,
            trim: true,
            default: '',
        }
    },
    password: {
        type: String,
    }
    ,
    passwordResetToken: {
        type: String,
    },
    passwordResetExpires: {
        type: Date,
    },
},
    {
        timestamps: true
    }
)

const userModel = mongoose.model("user", userSchema)


module.exports = userModel
