import mongoose from "mongoose";
const { Schema, model } = mongoose;

const memberSchema = new Schema({
  userId: { type: Number, index: true },
  username: { type: String, index: true },
  first_name: { type: String, index: true },
  socialCredit: Number,
});

const chatSchema = new Schema({
  chatId: { type: Number, index: true },
  title: String,
  members: [memberSchema],
});

export default mongoose.models.Chat || model("Chat", chatSchema);
