var express = require("express");
var router = express.Router();
const UserModel = require("../models/userModel"); //routes se bahar aane ke liye do dots use kiye hai
const TodoModel = require("../models/todoModel"); //routes se bahar aane ke liye do dots use kiye hai

const fs = require("fs");

const upload = require("../utils/multer");

const passport = require("passport");
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(UserModel.authenticate()));

const { sendmail } = require("../utils/mail");

//  GET INDEX PAGE.
router.get("/", function (req, res, next) {
  res.render("index", { title: "Homepage", user: req.user });
});

//  GET SIGN-UP PAGE

router.get("/sign-up", function (req, res, next) {
  res.render("signup", { title: "SignUp", user: req.user });
});
//  POST SIGN-UP PAGE
router.post("/sign-up", async function (req, res, next) {
  try {
    const { username, password, email } = req.body;
    const user = await UserModel.register({ username, email }, password);
    res.redirect("/sign-in");
  } catch (error) {
    req.send(error.message);
  }
});

// GET SIGN PAGE
router.get("/sign-in", function (req, res, next) {
  res.render("signin", { title: "SignIn", user: req.user });
});
// POST SIGN PAGE
router.post(
  "/sign-in",
  passport.authenticate("local", {
    failureRedirect: "/sign-in",
    successRedirect: "/home",
  }),
  function (req, res, next) {}
);

// GET HOME PAGE
router.get("/home", isLoggedIn, async function (req, res, next) {
  try {
    console.log(req.user);
    const { todos } = await req.user.populate("todos");
    console.log(todos);
    res.render("home", { title: "Homepage", todos, user: req.user });
  } catch (error) {
    res.send(error);
  }
});

// GET PROFILE PAGE
router.get("/profile", isLoggedIn, async function (req, res, next) {
  try {
    res.render("profile", { title: "Profile", user: req.user });
  } catch (error) {
    res.send(error);
  }
});

// POST AVATAR PAGE
router.post(
  "/avatar",
  upload.single("avatar"),
  isLoggedIn,
  async function (req, res, next) {
    try {
      if (req.user.avatar !== "default.jpg") {
        fs.unlinkSync("./public/images/" + req.user.avatar);
      }
      req.user.avatar = req.file.filename;
      req.user.save();
      res.redirect("/profile");
    } catch (error) {
      res.send(error);
    }
  }
);


// GET SIGNOUT PAGE
router.get("/signout", async function (req, res, next) {
  req.logout(() => {
    res.redirect("/sign-in");
  });
});


// GET DELETE PAGE
router.get("/delete/:id", async function (req, res, next) {
  try {
    await UserModel.findByIdAndDelete(req.params.id);
    res.redirect("/profile");
  } catch (error) {
    res.send(error);
  }
});


// GET UPDATE-USER PAGE
router.get("/updateUser/:id", async function (req, res, next) {
  try {
    const user = await UserModel.findById(req.params.id);
    res.render("updateUser", { title: "Update", user, user: req.user });
  } catch (error) {
    res.send(error);
  }
});
// POST UPDATE-USER PAGE
router.post("/updateUser/:id", async function (req, res, next) {
  try {
    await UserModel.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/profile");
  } catch (error) {
    res.send(error);
  }
});


// GET GET-EMAIL PAGE
router.get("/get-email", function (req, res, next) {
  res.render("getemail", { title: "Forget-Password", user: req.user });
});

// POST GET-EMAIL PAGE
router.post("/get-email", async function (req, res, next) {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (user === null) {
      return res.send(
        `User not found. <a href="/get-email">Forget Password</a>`
      );
    }
    sendmail(req, res, user);
  } catch (error) {
    res.send(error);
  }
});

// GET CHANGE-PASSWORD PAGE
router.get("/change-password/:id", async function (req, res, next) {
  res.render("changepassword", {
    title: "Change Password",
    id: req.params.id,
    user: null,
  });
});

//  POST CHANGE-PASSWORD PAGE
router.post("/change-password/:id", async function (req, res, next) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (user.passwordResetToken === 1) {
      await user.setPassword(req.body.password);
      user.passwordResetToken = 0;
    } else {
      res.send(
        `Link expired try again. <a href="/get-email">Forget Password</a>`
      );
    }
    await user.save();
    res.redirect("/sign-in");
  } catch (error) {
    res.send(error);
  }
});

//  GET RESET PASSWORD PAGE
router.get("/reset/:id", isLoggedIn, async function (req, res, next) {
  res.render("reset", {
    title: "Reset Password",
    id: req.params.id,
    user: req.user,
  });
});
//  POST RESET PASSWORD PAGE
router.post("/reset/:id", isLoggedIn, async function (req, res, next) {
  try {
    await req.user.changePassword(req.body.oldpassword, req.body.password);
    await req.user.save();
    res.redirect("/profile");
  } catch (error) {
    res.send(error);
  }
});

// isLogggedIn function to check user is login or not
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/sign-in");
}

//.....................................................................

//  GET CREATE-TODO
router.get("/createtodo", isLoggedIn, async function (req, res, next) {
  res.render("createtodo", {
    title: "Create Todo",
    user: req.user,
  });
});

//  POST CREATE-TODO
router.post("/createtodo", isLoggedIn, async function (req, res, next) {
  try {
    const todo = new TodoModel(req.body);
    todo.user = req.user._id;
    req.user.todos.push(todo._id);
    await todo.save();
    await req.user.save();
    res.redirect("/home");
  } catch (error) {
    res.send(error);
  }
});

//  GET UPDATE-TODO
router.get("/updatetodo/:id", isLoggedIn, async function (req, res, next) {
  try {
    const todo = await TodoModel.findById(req.params.id);
    res.render("updatetodo", {
      title: "Update Todo",
      user: req.user,
      todo,
    });
  } catch (error) {
    res.send(error);
  }
});
//  POST UPDATE-TODO
router.post("/updatetodo/:id", isLoggedIn, async function (req, res, next) {
  try {
    await TodoModel.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/home");
  } catch (error) {
    res.send(error);
  }
});

// GET DELETE-TODO
router.get("/deletetodo/:id", isLoggedIn, async function (req, res, next) {
  try {
    await TodoModel.findByIdAndDelete(req.params.id);
    res.redirect("/home");
  } catch (error) {
    res.send(error);
  }
});

module.exports = router;
