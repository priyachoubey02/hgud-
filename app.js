  if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
  }
  const express = require("express");
  const app = express();
  const path = require("path");
  const mongoose = require("mongoose");
  const methodOverride = require("method-override");
  const ejsMate = require("ejs-mate");
  const ExpressError = require("./utils/ExpressError.js");
  const MONGO_URL = "mongodb://127.0.0.1:27017/majorproject";
  // const ATLAS_URL = process.env.ATLAS_DB_URL;
  const passport = require("passport");
  const LocalStrategy = require("passport-local");
  const User = require("./models/user.js");
  const session = require("express-session");
  const MongoStore = require('connect-mongo');
  const flash = require("connect-flash");

  const listingsRouter = require("./routes/listing.js");
  const reviewsRouter = require("./routes/review.js");
  const userRouter = require("./routes/user.js");


  app.use(methodOverride("_method"));
  app.engine("ejs", ejsMate);

  // store.on("error", () =>{
  //   console.log("error in sesssion store", err);
  // });
  const store = MongoStore.create({
    mongoUrl: MONGO_URL,
    crypto: {
      secret: "myfuck",
    },
    touchAfter: 24 * 3600,
  });

  const sessionOption = {
    store,
    secret: "mycodesecret",
    resave:false,
    saveUninitialized:true,
    cookie: {
      expires: Date.now() + 7*24*60*60*1000,
      maxAge: 7*24*60*60*1000,
      httpOnly: true,
    }
  };


  app.use(session(sessionOption));
  app.use(flash());

  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));

  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use((req, res, next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({extended: true}))



  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.use(express.static(path.join(__dirname, "/public")));



  main()
    .then(() =>{
      console.log("Connected to Monogo Database");
    })
    .catch((err) =>{
      console.log(err);
    });
  async function main(){
      await mongoose.connect(MONGO_URL);
  }



  app.listen(8080, () =>{
    console.log("The server is listening on port number 8080");
  });

  app.use("/listings", listingsRouter);
  app.use("/listings/:id/reviews", reviewsRouter);
  app.use("/", userRouter);



  app.get("/demo", async (req, res) =>{
    let fakeUser = new User({
      email: "kumaripriya.pk0201@gmail.com",
      username: "Priya"
    });
  let RegisterUser = await User.register(fakeUser, "hello");
  res.send(RegisterUser);
  });

  app.all("*", (req, res, next) =>{
    next(new ExpressError(404, "Page Not Found"));
  });

  app.use((err, req, res, next) =>{
    let{statusCode = 500, message = "Something Wrong"} = err;
    res.render("./listings/error.ejs", {message});
  });

