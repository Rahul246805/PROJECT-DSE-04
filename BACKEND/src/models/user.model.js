const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
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
