const { Schema, model } = require("mongoose");
const crypto = require("crypto");

const MemberSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "public", "teacher", "student"],
    },

    password: {
      type: String,
      required: true,
    },

    verified: {
      type: Boolean,
      default: false
    },

    failedLoginAttempts: { type: Number, default: 0 },
    lockout: { type: Boolean, default: false },
    lockoutExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = model("member", MemberSchema);