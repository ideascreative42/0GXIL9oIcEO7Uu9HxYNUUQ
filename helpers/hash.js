const bcrypt=require('bcrypt');

const hash=async (pass)=>{
    return await bcrypt.hash(pass,10)
}
const compare_hash=async (pass , hashed)=>{
    return await bcrypt.compare(pass , hashed)
}

module.exports={hash , compare_hash}