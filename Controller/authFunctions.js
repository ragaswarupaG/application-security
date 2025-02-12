const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Member = require("../Database/member");
const UserOTPVerification = require('../Database/userOTP');
const nodemailer = require('nodemailer');

const JWT_SECRET = '4ed4227a979e9bfc053b2f4ba8780fea7553fcafc8061148ddc1976d664badc699b85806ffed12c1b3f3f02066dfea1925eca9967b3161c35b72c368ee6c04df';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 1 * 60 * 1000; // 1 min





const memberSignup = async (req, role, res) => {
    try {
        if (req.username.trim() === "" || req.password.trim() === "" || req.email.trim() === "") {
            return res.status(400).json({
                message: "Please fill up all the details."
            });
        }

        if (req.username.length < 5) {
            return res.status(400).json({
                message: "User name should have at least 5 characters."
            });
        }

        const usernamePattern = /^[A-Za-z0-9]+$/; // only allows alphabets & numbers
        if (!usernamePattern.test(req.username)) {
            return res.status(400).json({
                message: "User name can only contain letters and numbers."
            });
        }

        let usernameNotTaken = await validateMemberName(req.username);
        if (!usernameNotTaken) {
            return res.status(400).json({
                message: 'Member is already registered with this user name.'
            });
        }

        let emailNotRegistered = await validateEmail(req.email);
        if (!emailNotRegistered) {
            return res.status(400).json({
                message: 'Email is already registered.'
            });
        }

        const passwordValidationMessage = getPasswordValidationMessage(req.password);
        if (passwordValidationMessage) {
            return res.status(400).json({
                message: passwordValidationMessage
            });
        }

        const password = await bcrypt.hash(req.password, 12);
        const newMember = new Member({
            ...req,
            password,
            role,
            verified: false
        });

        
        await newMember
        .save()
        .then((result) => {
            sendOTPVerificationEmail(result,res)

        })
        .catch((err) => {
            console.log(err)
            return res.status(500).json({
                message: `An error occured`
            });
        })

    } catch (err) {
        return res.status(500).json({
            message: `${err.message}`
        });
    }
};






// send otp

const sendOTPVerificationEmail = async ({ _id , email} , res) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

        const mailOptions = {
            from: 'raga.tpgig2425@gmail.com',
            to: email,
            subject: "Verify your email",
            html: `<p>Enter ${otp} in the app to verify your email and complete the sign-up process!</p>`
        };

        
        // hashing the OTP
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        const newOTPVerification =  new UserOTPVerification({
        
           userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000
        });

        await newOTPVerification.save();


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail(mailOptions);
        res.json({
            status: "Pending",
            message: "A link to activate your account has been emailed to the address provided.",
            data: {
                
                userId: _id,
                email,
            }
        });
    } catch (error) {
        res.json({
            status: "FAILED",
            message: ("hello" , error.message)
        });
    }
};



function getPasswordValidationMessage(password) {
    const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const uppercaseRegex = /[A-Z]/;
    const numericRegex = /[0-9]/;

    if (password.length <= 12) {
        return 'Password must be more than 12 characters.';
    }
    if (!specialCharacterRegex.test(password)) {
        return "Please make sure to include 1 special character in your password.";
    }
    if (!uppercaseRegex.test(password)) {
        return "Please make sure to have 1 uppercase letter in your password.";
    }
    if (!(/[a-zA-Z]/).test(password)) {
        return "Please make sure to have a mix of numbers & letters in your password.";
    }
    if (!numericRegex.test(password)) {
        return "Please make sure to include a number in your password.";
    }

    return null;
}

const validateMemberName = async (username) => {
    let member = await Member.findOne({ username });
    return member ? false : true;
};

const validateEmail = async (email) => {
    let member = await Member.findOne({ email });
    return member ? false : true;
};






const memberLogin = async (req, role, res) => {
    let { username, password } = req;
    const member = await Member.findOne({ username });
        

    if (req.username.trim() === "" || req.password.trim() === "") {
        return res.status(400).json({
            message: "Please fill up all the details."
        });
    }

    if (!member) {
        return res.status(400).json({
            message: "Username is not found. Invalid login credentials.",
            attemptsLeft: 5 ,
            
        });
    }


    if (!member.verified || member.verified === false) {
        return res.status(403).json({
            message: 'Please verify your email before logging in.',
            userId: member._id, 
            email: member.email
        });
    }

   
 


    if (member.lockout && member.lockoutExpires > Date.now()) {
        const remainingTime = member.lockoutExpires - Date.now();
        const remainingSeconds = Math.floor(remainingTime / 1000);

        console.log(member.failedLoginAttempts)

        return res.status(403).json({
          
            message: `Account locked. Try again later`,
           
            lockoutExpires: member.lockoutExpires,
            attemptsLeft: 0 ,
            remainingTimeLeft: remainingSeconds
           
            

        }),
        console.log("Account locked. Try again after" , remainingSeconds ,"seconds.");
    }

    if (member.lockout && member.lockoutExpires < Date.now()) {
        member.failedLoginAttempts = 0;
        console.log(member.failedLoginAttempts)
        member.lockout = false;
        member.lockoutExpires = null;
        await member.save();

        return res.status(403).json({
            message: "Account unlocked. You may try again.",
            attemptsLeft: 5, 
        });
    }

 

    if (member.role !== role) {
        return res.status(403).json({
            message: "Please make sure you are logging in from the right role."
        });
    }

    let isMatch = await bcrypt.compare(password, member.password);
    if (isMatch) {
        member.failedLoginAttempts = 0;
        member.lockout = false;
        member.lockoutExpires = null;
        await member.save();

        let token = jwt.sign(
            {
                role: member.role,
                username: member.username,
                email: member.email
            },
            process.env.APP_SECRET,
            { expiresIn: "3 days" }
        );

        let result = {
            username: member.username,
            role: member.role,
            email: member.email,
            token: token,
            expiresIn: 168
        };

        return res.status(200).json({
            ...result,
            message: 'You are now logged in.'
        });
    } else {
        member.failedLoginAttempts += 1;
        let attemptsLeft = MAX_ATTEMPTS - member.failedLoginAttempts;   // this
 
        console.log("failed attempts" , member.failedLoginAttempts)
        console.log("remaining attempts" , attemptsLeft)
        

        if (member.failedLoginAttempts >= MAX_ATTEMPTS) {
            member.lockout = true;
            member.lockoutExpires = Date.now() + LOCKOUT_DURATION;
            attemptsLeft = 0;
        }
        await member.save();

        return res.status(403).json({
            message: "Incorrect username or password.",
            attemptsLeft : attemptsLeft,
            
           
        });
    }
};













const memberAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(403).json({
        message: "Missing Token"
    });
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.APP_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({
            message: "Wrong Token"
        });
        req.username = decoded.username;
        next();
    });
};

const checkRole = (roles) => async (req, res, next) => {
    let { username } = req;
    const member = await Member.findOne({ username });
    if (!roles.includes(member.role)) {
        return res.status(401).json('Sorry, you do not have access to this route.');
    }
    next();
};

module.exports = {
    memberSignup,
    memberLogin,
    checkRole,
    memberAuth,
    sendOTPVerificationEmail
};



