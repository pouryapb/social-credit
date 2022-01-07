import Chat from "../models/chat";

const updateUser = async (userId, first_name) => {
  await Chat.findOneAndUpdate(
    { "members.userId": userId },
    { $set: { "members.$.first_name": first_name } }
  ).exec();
};

export default updateUser;
