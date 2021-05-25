import mongoose from "mongoose";

export interface IRoom{
    name? : string,
    uuid? : string,
    user_creator_id?: mongoose.Schema.Types.ObjectId,
    users_list: mongoose.Schema.Types.Map,
    observer_users_list:mongoose.Schema.Types.Map,
    participant_users_list:mongoose.Schema.Types.Map,
    max_number_participants?: number,
    active?: boolean,
    room_code?: string,
    encrypt_tag?: Buffer
}