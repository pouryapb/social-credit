import mongoose from "mongoose";
const { Schema, model } = mongoose;

const memberSchema = new Schema({
  userId: { type: Number, index: true },
  username: { type: String, index: true },
  socialCredit: Number,
});

const chatSchema = new Schema({
  chatId: { typeL: Number, index: true },
  title: String,
  members: [memberSchema],
});

export default mongoose.models.Chat || model("Chat", chatSchema);
