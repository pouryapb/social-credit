import Chat from "../models/chat";

const updateUser = (userId, first_name) => {
  return Chat.findOneAndUpdate(
    { "members.userId": userId },
    { $set: { "members.$.first_name": first_name } }
  ).exec();
};

export default updateUser;
