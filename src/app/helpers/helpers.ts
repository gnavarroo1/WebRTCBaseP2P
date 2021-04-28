

import * as crypto from 'crypto';


const iv= "M5fOpWyemepcww==";

export function validateUUID(uuid:string):boolean{
    if(uuid) {
        const v4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
        // console.log(v4.test(uuid))
        return v4.test(uuid);
    }
    return false;
}

export function encrypt(text: string , key: any, iv:any):any{

    try {
        let cipher = crypto.createCipheriv('aes-128-ccm', key, iv, {
            authTagLength: 16
        });
        var code = cipher.update(text, 'utf8', 'hex');
        code += cipher.final('hex');
        const tag = cipher.getAuthTag();

        return {
            success: true,
            data: {
                code: code,
                tag: tag
            }
        }
    } catch (e) {
        return {
            success: false,
            errorMsg: e.message
        }
    }



}


export function decrypt(text: string, key: any, iv:any,tag:any):any{
    try {
        let decipher = crypto.createDecipheriv('aes-128-ccm', key, iv, {
            authTagLength: 16
        });
        decipher.setAuthTag(tag);
        let decode = decipher.update(text, 'hex', 'utf8');
        decode += decipher.final('utf8')
        return {
            success :true,
            data:{
                decode: decode
            }
        }
    } catch (e) {
        return {
            success: false,
            errorMsg: e.message
        }
    }

}
