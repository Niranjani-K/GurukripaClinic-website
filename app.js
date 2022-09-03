const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var _ = require('lodash');
var path = require('path');
const methodOverride = require('method-override');
const marked = require('marked');
const ejs = require('ejs')
var dotenv = require('dotenv');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var alert = require('alert');


const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(session({
    key: 'user_sid',
    secret: 'gurukripaclinicadminloginforher',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 200000,
    }

    })
);


var favicon = require('serve-favicon');
app.use(favicon(__dirname+ '/public/images/favicon.ico'));

dotenv.config();
const url = process.env.MONGODB_URL;
mongoose.connect(url,{ useNewUrlParser: true });

const postSchema = new mongoose.Schema( {
    title: {
        require: true ,
        type : String
    },
    content: {
        type: String
    },
    markdown: {
        type:String , 
        required: true
    },
    date: {
        type: Date,
       default: Date.now()
    },
});

const Post = mongoose.model("Post", postSchema);

const holidaySchema = new mongoose.Schema ({
    holiday : {
        type : String
    }
});
const Holiday = mongoose.model("Holiday", holidaySchema);

var adminPassword = process.env.ADMIN_PSSWD;

//Start of admin routes

app.post("/admin",async(req,res) => {
    try {
        const password = req.body.password;
        
        if(password === adminPassword){
            var email = doc_gmail
            req.session.email = email;
            res.status(201).redirect('/admin/adminPage');

        }else{
            
            res.render("admin",{exists:true});
        }
    }catch (error){
        res.status(400).send("Invalid details");
    }
})

app.route("/admin/adminPage").get(async(req,res) => {
    if(req.session.email && req.cookies.user_sid){
        res.render('adminPage')
    }else{
        res.redirect("/admin");
    }
})
app.route("/admin/posts").get(async(req,res) => {
    if(req.session.email && req.session){
        Post.find({}, function(err, posts){

            res.render("posts" , {posts: posts});
        })
    }else{
        res.redirect("/admin");
    }
})
app.route("/admin/posts/:id").get(async(req,res) => {
    if(req.session.email && req.cookies.user_sid){
        Post.findOne({_id : req.params.id}, function(err, post) {
            if(!err){
                if(post == null) {
                    res.redirect('/admin/posts');
                }
                else{
                    res.render('adminEdit', {post: post})
                }   
            }
          });
    }
    else{
        res.redirect("/admin");
    }
})


app.route("/admin/compose").get(async(req,res) => {
    if(req.session.email && req.cookies.user_sid){
        res.render('compose');
    }else{
        res.redirect("/admin");
    }
})


app.post("/admin/compose",async(req,res) => {
    if(req.session.email && req.session){
        const post = new Post({
            title: req.body.title,
            content: req.body.content,
            markdown: req.body.markdown,
    
        });
    
         post.save(function(err){
            if(!err){
                res.redirect("/admin/posts");
            }
        });
    }else{
        res.redirect("/admin");
    }

})


app.get("/admin/posts/delete/:id",async(req,res) => {
    if(req.session.email && req.cookies.user_sid){
        Post.findByIdAndRemove(req.params.id,function(err){
            if(!err){
                res.redirect('/admin/posts');
            }      
        })
    }else{
        res.redirect("/admin");
    }
})
app.get("/admin/posts/edit/:id",async(req,res) => {
    if(req.session.email && req.cookies.user_sid){
        Post.findById(req.params.id,function(err,post){
            if(!err){
                res.render('edit',{post:post});
            }
        })
    }else{
        res.redirect("/admin");
    }
})

app.put('/admin/posts/:id',(req,res) =>{
    if(req.session.email && req.cookies.user_sid){
            Post.findByIdAndUpdate(req.params.id,{
                title:req.body.title,
                content:req.body.content,
                markdown:req.body.markdown,
            },function(err,update){
                if(err) {
                        console.log("error");
                }else{
                    res.redirect('/admin/posts/' + req.params.id );
                }
            });

    }else{
        res.redirect("/admin");
    }
})

app.get('/admin/holiday',async(req,res) => {
    if(req.session.email && req.cookies.user_sid){
        res.render('holiday');
    }else{
        res.redirect('/admin');
    }
}).post('/admin/holiday', async(req,res) => {
    if(req.session.email && req.cookies.user_sid){
    const holiday = new Holiday ({
        holiday  : req.body.holiday
    });
    holiday.save(function(err){
        if(!err){
            alert("Holiday added")
            res.redirect('/admin/adminPage')
        }
    });
}else{
    res.redirect("/admin");
}
    
})

app.get('/admin/appointment/remove-holiday',async(req,res) => {
    if(req.session.email && req.cookies.user_sid){
    Holiday.deleteMany({},function(err){
        if(!err){
            alert("Holiday deleted");
            res.redirect('/admin/adminPage');
        }else{
            console.log(err)
        }
    })
}else{
    res.redirect("/admin");
}
    
});

app.get("/admin/logout",async(req,res)=>{
    if (req.session.email && req.cookies.user_sid) {
        res.clearCookie("user_sid");
        res.redirect("/");
      } 
      else {
        res.redirect("/admin");
      }
})
// End of admin routes

app.get("/",function(req,res){
    res.render('home');
})



app.get("/:title",function(req,res){
    const title = req.params.title;
    if(title === "updates"){
        Post.find({}, function(err, posts){
            res.render("updates" , {posts: posts});
        })
    }else if(title == "appointment"){
        Holiday.find({},function(err,holiday){
            if(!err){
                res.render("appointment" , {holiday : holiday})
            }else{
                res.render("appointment")
            }
        })
        
    }else if(title == "book-appointment"){
        Holiday.find({},function(err,holiday){
           
            if(!err){
                res.render("book-appointment" , {holiday : holiday})
            }else{
                res.render(title)
            }
            
        })
    }
    else if(title == "admin"){
        res.render("admin",{exists:false});
    }
    else res.render(title);
})




app.get('/updates/:id', function (req, res) {
    Post.findOne({_id: req.params.id}, function(err, post) {
        if(!err){
            if(post == null) {
                res.redirect('/updates');
            }
            else{
                res.render('post', {post: post})
            }    
        }
      });    
});

app.put('/updates/:id',(req,res) =>{
    Post.findByIdAndUpdate(req.params.id,{
        title:req.body.title,
        content:req.body.content,
        markdown:req.body.markdown,
    },function(err,update){
        if(err) {
                console.log("error");
        }else{
            res.redirect('/updates/' + req.params.id );
        }
   });
})

const doc_gmail = process.env.DOCTOR_GMAIL;
const contact_gmail = process.env.GMAIL_CONTACT;
const psswd_gmail = process.env.GMAIL_PSSWD;

app.post('/book-appointment',(req,res) => {
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var app_date = new Date(req.body.AppDate);
    var day = app_date.getDate();
    var month = app_date.getMonth()+1;
    var year = app_date.getFullYear();
    var app_time = req.body.AppTime;
    if(req.body.message){
        var msg = req.body.message;
        var messageToDoctor = name + ' has booked an appointment on  ' + day + '-' + month + '-' + year  + ' at time slot ' + app_time + ' their phone number is ' + phone  + ' and their email is ' + email + '.' + '\n Their message was ' + msg;
    }else{
        var messageToDoctor = name + ' has booked an appointment on  ' + day + '-' + month + '-' + year  + ' at time slot ' + app_time + ' their phone number is ' + phone  + ' and their email is ' + email + '.' ;
    }
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: contact_gmail,
          pass: psswd_gmail
        }
    });
    
      var messageToPatient = 'Thank you for booking an appointment at GuruKripa Clinic . Your appointment is scheduled on  ' + day + '-' + month + '-' + year  + ' between ' + app_time;
      var sub = 'Appointment booked by ' + name;

      var mailOptions = {
        from: contact_gmail,
        to: doc_gmail,
        subject: sub,
        text : messageToDoctor 
      };

      var mailOptions2 = {
        from:contact_gmail,
        to: email,
        subject:'Appointment booked ',
        text: messageToPatient
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
            console.log('Appointment booked');
        }
      });
      transporter.sendMail(mailOptions2, function(error, info){
        if (error) {
          res.redirect('Error-Booking')
        } else {
            res.redirect('confirm-App');
        }
      });

})



app.listen(process.env.PORT || 3000,function(){
    console.log("Server started succesfully");
});































