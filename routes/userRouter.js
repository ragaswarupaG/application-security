const router = require('express').Router();
const bcrypt = require('bcrypt');
const UserOTPVerification = require('../Database/userOTP');
const { application } = require('express');
const Member = require("../Database/member");
const {
    memberSignup , memberLogin , memberAuth , checkRole, sendOTPVerificationEmail
} = require('../Controller/authFunctions');

//admin registration route

router.post("/register-admin" , (req,res) => {
    memberSignup(req.body , "admin" , res);
});

// public registration route

router.post("/register-public" , async (req,res) => {
    memberSignup(req.body , "public" , res);
});


// teacher registration route 

router.post("/register-teacher" , async (req,res) => {
    memberSignup(req.body , "teacher" , res);
});

//student registration route 

router.post("/register-student" , async (req,res) => {
    memberSignup(req.body , "student" , res);
});




// admin login route

router.post("/login-admin", async (req,res) => {
    await memberLogin(req.body , "admin" , res);
});


// public login route
router.post("/login-public", async (req,res) => {
    await memberLogin(req.body , "public" , res);
});



// teacher login route

router.post("/login-teacher", async (req,res) => {
    await memberLogin(req.body , "teacher" , res);
});



//student login route

router.post("/login-student", async (req,res) => {
    await memberLogin(req.body , "student" , res);
});



// public unprotected route

router.get(
    "/public" , (req,res) => {
        return res.status(200).json('Public Domain');
    });


//admin protected route

router.get(
    "/admin-protected" ,
    memberAuth,
    checkRole(['admin']),
    async (req,res) => {
        return res.json(`welcome ${req.username}`)
    }
);

// general public protected route
router.get(
    "/public-protected" ,
    memberAuth,
    checkRole(['public']),
    async (req,res) => {
        return res.json(`welcome ${req.username}`)
    }
);

// Teacher protected route

router.get(
    "/teacher-protected" ,
    memberAuth,
    checkRole(['teacher']),
    async (req,res) => {
        return res.json(`welcome ${req.username}`)
    }
);

// student protected route

router.get(
    "/student-protected" ,
    memberAuth,
    checkRole(['student']),
    async (req,res) => {
        return res.json(`welcome ${req.username}`)
    }
);




// put id in the route

// validate otp

router.post("/verifyOTP"   , async (req,res) => {
    console.log("in")
    try{
        let{ userId , otp} = req.body;

        if (!userId || !otp){
            throw Error("Empty OTP details are not allowed!");
        }else{
            const UserOTPVerificationRecords = await UserOTPVerification.find({
                userId,
            });

            console.log(UserOTPVerificationRecords)  
            console.log("THIS IS OTP" , otp)
            console.log("THIS IS userId" , userId)
           

            if (UserOTPVerificationRecords.length <= 0){
                throw new Error("Account record does not exist or has been verified already. Please sign up or login")
            }else{
                const {expiresAt} = UserOTPVerificationRecords[0];
                const hashedOTP = UserOTPVerificationRecords[0].otp;

                if (expiresAt < Date.now()){
                    UserOTPVerification.deleteMany({userId});
                    throw new Error("Code has expired. Please request again")
                } else{
                    const validOTP = await bcrypt.compare(otp , hashedOTP);

                    if(!validOTP){
                        //if otp entered is WRONG
                        throw new Error("Invalid code passed. Please check your mail")
                    }else{
                       await Member.updateOne({_id: userId} , {verified: true});
                       await UserOTPVerification.deleteMany({userId});

                  
                       res.json({

                        status: "Verified",
                        message: 'User email verified succesffully.'


                       });
                    }
                }
            }
        }
    } catch (error){
        res.json({
            status: "Failed",
            message: error.message
        });
    }
});



router.post("/resendOTP" , async (req, res) =>{
    try{
        let {userId , email} = req.body;

        console.log(userId)
        console.log(email)

        if(!userId || !email){
            throw Error("Please enter your details")
        }else{
            await UserOTPVerification.deleteMany({userId});
            sendOTPVerificationEmail({_id: userId , email}, res);
        }


    }catch (error){
        res.json({
            status: "Failed",
            message: error.message,
        })

    }
})


module.exports = router;