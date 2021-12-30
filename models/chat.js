import mongoose from "mongoose";
const { Schema, model } = mongoose;

const chatSchema = Schema({
  _id: Number,
  title: String,
  members: [
    {
      _id: Number,
      socialCredit: { type: Number, default: 100 },
    },
  ],
});

export default mongoose.models.Chat || model("Chat", chatSchema);
