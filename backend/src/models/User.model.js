import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    FullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:false,  
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    phoneNumber:{
        type:String,
        required:true,
        unique:true,
        match:/^\d{10}$/
    }
});  

const User = mongoose.model('User', userSchema);    
export default User;