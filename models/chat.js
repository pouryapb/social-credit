import mongoose from "mongoose";
const { Schema, model } = mongoose;

const memberSchema = Schema({
  userId: { type: Number, unique: true },
  username: { type: String, unique: true },
  socialCredit: Number,
});

const chatSchema = Schema({
  chatId: { typeL: Number, unique: true },
  title: String,
  members: [memberSchema],
});

export default mongoose.models.Chat || model("Chat", chatSchema);
