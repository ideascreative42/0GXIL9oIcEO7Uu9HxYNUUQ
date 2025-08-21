const joi=require('joi')

const authValidation=joi.object({
    username:joi.string().min(4).max(24).lowercase().required(),
    pass:joi.string().min(8).max(24).required()
})

const story_title_validation=joi.string().min(2).max(64).required();

const story_id_validator=joi.string().length(16).required()

const gpt_req_validation =joi.string().min(8).max(6000).required()

const story_validator=joi.string().min(1).max(5000).required()

const key_validator=joi.string().min(1).max(700).required()



module.exports={authValidation,story_title_validation,story_id_validator , gpt_req_validation ,story_validator 
    ,key_validator
}