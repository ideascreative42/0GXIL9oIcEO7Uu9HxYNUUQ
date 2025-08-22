const path=require('path')
const jwt=require('jsonwebtoken');


const pool=require(path.resolve(__dirname, './pg'))



const JWT_ACCESS_SECRET_BUFFERED=Buffer.from(process.env.JWT_ACCESS_SECRET,'base64url')
const JWT_REFRESH_SECRET_BUFFERED=Buffer.from(process.env.JWT_REFRESH_SECRET,'base64url')
const ACCESS_TOKEN_EXP=process.env.ACCESS_TOKEN_EXP
const REFRESH_TOKEN_EXP=process.env.REFRESH_TOKEN_EXP

class Jwtx{
    static newAT(uid , r="u"){
        // r stands as role
        return jwt.sign({uid , r}, JWT_ACCESS_SECRET_BUFFERED , {algorithm : 'HS256',expiresIn : ACCESS_TOKEN_EXP});
    }

    static newRT(uid , ver , r="u"){
        return jwt.sign({uid, ver , r}, JWT_REFRESH_SECRET_BUFFERED , {algorithm : 'HS256',expiresIn : REFRESH_TOKEN_EXP});
        //add its exp timeline or how much is left from it to req
    }

    static async verify(AT , RT , req , res){
        try{
            //it will through an error if invalid or exp 
            return jwt.verify(AT, JWT_ACCESS_SECRET_BUFFERED, { algorithms: ['HS256']})
        }
        catch(err){
            try{
                if(err?.name !=="TokenExpiredError") {
                    res.clearCookie('ACCESS_TOKEN',{httpOnly: true , secure: true , sameSite:'lax',partitioned: true}); res.clearCookie('REFRESH_TOKEN',{httpOnly: true , secure: true , sameSite:'lax',partitioned: true,})
console.log('34')
                    throw new Error("invalid jwt")
                }
                let RT_obj;
                //doing this so in case of invalid refresh, we delete em from cookies
                try{
                    RT_obj = this.verifyRT(RT)
                }
                catch(errr){
                    res.clearCookie('ACCESS_TOKEN',{httpOnly: true , secure: true , sameSite:'lax',partitioned: true}); res.clearCookie('REFRESH_TOKEN',{httpOnly: true , secure: true , sameSite:'lax',partitioned: true})

                    throw new Error(errr)
                }

                const Is_RT_Valid=await pool.query(`
                    SELECT rt_version 
                    FROM users
                    WHERE id=$1 AND rt_version=$2`
                ,[RT_obj.uid , RT_obj.ver])

                if(Is_RT_Valid.rowCount===0) {
                    res.clearCookie('ACCESS_TOKEN',{httpOnly: true , secure: true , sameSite:'lax',partitioned: true}); res.clearCookie('REFRESH_TOKEN',{httpOnly: true , secure: true , sameSite:'lax',partitioned: true})
console.log('56')
                    throw new Error("expired jwt")
                }

                const refreshedAT=this.newAT(RT_obj.uid , RT_obj.uid.r)

                // 2 * 24 * 60 * 60 * 1000 for refresh / 2 days
                res.cookie('ACCESS_TOKEN',refreshedAT ,{httpOnly: true,secure: true,sameSite: 'lax',partitioned: true,maxAge: Number(process.env.AT_RF_COOKIE_EXP)})
                

                return RT_obj;
            }
            catch(error){console.log('68')
                throw new Error("unauthenticated");
            }
        }
    }

    static verifyRT(RT){
        return jwt.verify(RT, JWT_REFRESH_SECRET_BUFFERED, { algorithms: ['HS256']})
    }

    static newAndDeactivePrev(){}
}



const jwthandler=async (req,res,next)=>{
    try{
        if(!req.cookies.ACCESS_TOKEN || !req.cookies.REFRESH_TOKEN)

        {
            console.log("88")
            throw new Error("not authenticated")

        }

        console.log("access:" , req.cookies.ACCESS_TOKEN ,"refresh:", req.cookies.REFRESH_TOKEN)

        const JwtVerifyRes=await Jwtx.verify(req.cookies.ACCESS_TOKEN , req.cookies.REFRESH_TOKEN , req , res)
        
        req.user={
            verified:true,
            uid:JwtVerifyRes.uid,
            r:JwtVerifyRes.r,
        }
        console.log('meow')

        return next();
    }
    catch(err){
        console.log(err)
        console.log("hello" , err)
        return res.json({ok:false, error:"not authenticated" , redirect:`${process.env.DOMAIN}/login`})
    }
}

module.exports={Jwtx , jwthandler}
