const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

//auth
const auth = require("../middlewire/auth")

//for uploading file
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

//Cloudinary Configuration 
cloudinary.config({ 
    cloud_name: 'da1wbfxc1', 
    api_key: '342648165963697', 
    api_secret: 'XSwxCX0szere_8Csbhi4eAu7DFs' 
  });

//collection
const TunerUser = require('../model/Tuner_schema')

//router
const router = new express.Router();

//middlewire
router.use(bodyparser.urlencoded({ extended: true }));
router.use(bodyparser.json())
router.use(cors());
router.use(fileUpload({
    useTempFiles: true
}))

//Registration
router.post("/register", async (req, res) => {
    // console.log(req.body)
    const email = req.body.email;
    const user = await TunerUser.findOne({ email: email });
    if (user) {
        res.status(400).send({
            message: "Email already exist"
        })
    } else {
        const dp_files = req.files.photo;
        cloudinary.uploader.upload(dp_files.tempFilePath, async (err, result) => {
            try {
                if (!err) {
                    const dp = await result.url;
                    // console.log("dp==>" + dp)
                    const userData = await new TunerUser({
                        imgfile: dp,
                        name: req.body.name,
                        email: req.body.email,
                        phone: req.body.phone,
                        profession: req.body.profession,
                        password: req.body.password
                    })
                    // console.log("before hash===>" + userData)
                    //hasing password
                    await userData.save()
                    // console.log("data sending to db is ==>" + userData);
                    res.status(200).send({
                        status: "sucessfully registered",
                        data: userData
                    })
                }
            } catch (err) {
                res.status(401).send({
                    message: err.message
                })
            }
        })
    }
})

//login
router.post("/login", async (req, res) => {
    // console.log(req.body);
    const enteredUsername = req.body.username;
    const enteredPassword = req.body.password;

    const loginUserData = await TunerUser.findOne({ email: enteredUsername });
    // console.log(loginUserData)

    if (loginUserData) {
        const checkPassword = await bcrypt.compare(enteredPassword, loginUserData.password);
        console.log(checkPassword);
        if (checkPassword) {
            const token = await loginUserData.generateAuthToken();
            console.log(` logintoken from rout.js==> ${token}`)

            console.log("login sucessfully");

            res.status(200).send({
                status: "login sucessfully",
                token: token,
                user: loginUserData
            })
        } else {
            console.log("password not match");
            res.status(500).send({
                status: 500,
                message: "invalid credential"
            })
        }
    } else {
        console.log("userdata not match");
        res.status(500).send({
            status: 500,
            message: "invalid credential"
        })
    }
})
//logout
router.post("/logout", auth, async (req, res) => {
    try {
        console.log(`this user is logged out ==> ${req.user.name}`)
        //logout from all devices
        req.user.tokens = [];
        req.user.save();

        res.status(200).send({
            msg: "logout Successfuly",
            // user: user
        });
    } catch (err) {
        res.status(501).send({
            msg: "err in logout",
            err: err.message
        })
    }
})

//Upload 

router.put("/myvideos", auth, async (req, res) => {
    try {
        const user = req.user;
        const video_files = req.files.video; // retrieve the file data from the request body

        cloudinary.uploader.upload_large(video_files.tempFilePath,{ resource_type: "video" }, async (error, result) => {
            if (error) {
                // Handle error
                console.error(error);
                return res.status(500).json({
                    message: 'Failed to upload video'
                })
            } else {
                const video = await result.url;
                console.log(video);

                user.videoes.push({
                    video: {
                        vfile: video,
                        name: req.body.name,
                        description: req.body.description,
                        category: req.body.category,
                        visibility: req.body.visibility,
                    }
                });

                await user.save();

                res.status(200).json({
                    message: "File uploaded successfully"
                });
            }
        })
    } catch (error) {
        res.status(500).json({
            message: "Failed to upload file"
        });
    }
})



//Home
//Search
//Myvideoes

module.exports = router;