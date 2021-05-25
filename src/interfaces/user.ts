export interface IUser{
    firstname?: string,
    lastname?: string,
    username?: string,
    email?: string,
    is_temporary?: boolean,
    salt?: string,
    hash?: string
}