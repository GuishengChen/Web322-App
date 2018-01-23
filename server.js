
 /*********************************************************************************
    *		WEB322:	Assignment 7
    *		I	declare	that	this	assignment	is	my	own	work	in	accordance	with	Seneca		Academic	Policy.		
    *		No	part	of	this	assignment	has	been	copied	manually	or	electronically	from	any	other	source
    *		(including	web	sites)	or	distributed	to	other	students.
    *	.
    *		Name:	_Guisheng Chen____	Student	ID:	072605140___	Date:	__Jan 05 2018__
    *
    *		Online	(Heroku)	URL:	_https://fierce-coast-90345.herokuapp.com____
    *
    ********************************************************************************/	
var express = require("express");
var app = express();
var http = require("http");
var path = require("path");
var dataService = require("./data-service.js");
var dataServiceComments = require("./data-service-comments.js");
var fs=require('fs');
var dataServiceAuth=require("./data-service-auth.js");
var clientSessions=require("client-sessions");
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');


var HTTP_PORT = process.env.PORT || 8080;
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
 // Setup client-sessions 
 app.use(clientSessions({   cookieName: "session", // this is the object name that will be added to 'req'   
 secret: "web322_A7", // this should be a long un-guessable string. 
 duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)   
 activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute) 
})); 
app.use(function(req, res, next) {   
    res.locals.session = req.session;   
    next(); 
});  

function ensureLogin(req, res, next) { 
    if (!req.session.user) {     res.redirect("/login"); 
    } else { 
      next(); 
    } 
  }  
  
app.engine(".hbs", exphbs({
  extname: ".hbs",
  defaultLayout: 'layout',
  helpers: {
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
}));
app.set("view engine", ".hbs");


//call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}
    // setup a 'route' to listen on the default url path (http://localhost)
    app.get("/", function(req,res){
        res.render("home");
    });
    
    // setup another route to listen on /about
    app.get("/about", function(req,res){
        dataServiceComments.getAllComments().then( (dataFromPromise) =>
        {
          res.render("about", { data: dataFromPromise });        
        })
        .catch( (errorMsg)=> {
          res.render("about");       
        });
    });


    app.get("/employee/:empNum",ensureLogin, (req, res) => {
        
          // initialize an empty object to store the values
          let viewData = {};
        
          dataService.getEmployeeByNum(req.params.empNum)
          .then((data) => {
            viewData.data = data; //store employee data in the "viewData" object as "data"
          }).catch(()=>{
            viewData.data = null; // set employee to null if there was an error 
          }).then(dataService.getDepartments)
          .then((data) => {
            viewData.departments = data; // store department data in the "viewData" object as "departments"
            
              // loop through viewData.departments and once we have found the departmentId that matches
              // the employee's "department" value, add a "selected" property to the matching 
              // viewData.departments object
        
             for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.data.department) {
                  viewData.departments[i].selected = true;
                }
              }
        
          }).catch(()=>{
            viewData.departments=[]; // set departments to empty if there was an error
          }).then(()=>{
              if(viewData.data == null){ // if no employee - return an error
                  res.status(404).send("Employee Not Found");
              }else{
                res.render("employees", { viewData: viewData }); // render the "employee" view
              }
          });
        });
        



         app.post("/employee/update", ensureLogin,(req, res) => {
            dataService.updateEmployees(req.body)
            .then(()=>{
                res.redirect("/employees");
            })
            .catch((err)=>{
                console.log(err.message);
            })
        });
          

         app.get("/employees/add",ensureLogin, function(req,res){
            dataService.getDepartments().then( (data) =>
            {
              res.render("addEmployee", {departments: data});
            })
            .catch( (errorMsg)=> {
              res.render("addEmployee", {departments: []});  
            });
        });
        
        app.post("/employees/add", ensureLogin,(req, res) => {
            dataService.addEmployee(req.body)
            .then(()=>{
                res.redirect("/employees");
            })
            .catch((err)=>{
                console.log(err.message);
            });
        });
        
        
     app.get("/managers",ensureLogin, function(req, res){
         dataService.getManagers()
         .then((data)=>{
            res.render("employeesList", { data: data, title: "Employees (Managers)" }); 
             })
         .catch((err)=>{
            res.render("employeesList", { data: {}, title: "Employees (Managers)" });
            }) ;
     })


 app.get("/employees",ensureLogin,function(req, res){
        if(req.query.status){
            dataService.getEmployeesByStatus(req.query.status)
            .then((data)=>{
                res.send(data);
            })
            .catch((err)=>{
                console.log(err);
            }) ;
        }else if(req.query.department){
            dataService.getEmployeesByDepartment(req.query.department)
            .then((data)=>{
                res.send(data);
                 })
             .catch((err)=>{
                 console.log(err);
                }) ;
        }else if(req.query.manager){
            dataService.getEmployeesByManager(req.query.manager)
            .then((data)=>{
                res.send(data);
                 })
             .catch((err)=>{
                 console.log(err);
                }) ;
        }
         else  {
            dataService.getAllEmployees()
            .then((data)=>{
               res.render("employeesList", { data: data , title: "Employees"}); 
                 })
             .catch((err)=>{
                res.render("employeesList", { data: {}, title: "Employees" }); 
                }) ;}
     }) 


    app.get("/departments", ensureLogin,function(req, res){
        dataService.getDepartments()
        .then((data)=>{
         res.render("departmentList", { data: data, title: "Departments" });
             })
         .catch((err)=>{
         res.render("departmentList", { data: {}, title: "Departments" });
            }) ;})
   /* 
    dataService.initialize()
    .then(()=>{
        // setup http server to listen on HTTP_PORT
        app.listen(HTTP_PORT, onHttpStart);
    })
    .catch((err)=>{
        console.log(err);
    });
*/


// setup http server to listen on HTTP_PORT
dataService.initialize()
.then( dataServiceComments.initialize )
.then( dataServiceAuth.initialize )
.then( () => {
  app.listen(HTTP_PORT, onHttpStart);
})
.catch( (errorMsg) => {
  console.log("unable to start dataService");
});

    app.get("/departments/add", ensureLogin,(req,res) => {     
        res.render("addDepartment"); 
      });

    app.post("/departments/add", ensureLogin,(req, res) => {
        dataService.addDepartment(req.body)
        .then(()=>{
            res.redirect("/departments");
        })
        .catch((err)=>{
            console.log(err.message);
        });
    });
    
    app.post("/department/update", ensureLogin,(req, res) => {
        dataService.updateDepartment(req.body)
        .then(()=>{
            res.redirect("/departments");
        })
        .catch((err)=>{
            console.log(err.message);
        })
    });

    app.get("/department/:departmentid", ensureLogin,function(req, res){
        dataService.getDepartmentById(req.params.value)
        .then((data)=>{
           res.render("department", { data: data }); 
            })
        .catch((err)=>{
          res.status(404).send("department Not Found"); 
           }) ;
        });

        app.get("/employee/delete/:empNum", ensureLogin, (req,res) => {
            dataService.deleteEmployeeByNum(req.params.empNum).then( () =>
            {
              res.redirect("/employees");      
            })
            .catch( (errorMsg)=> {
              res.status(500).send("Unable to Remove Employee / Employee not found");        
            });
        });

        app.post("/about/addComment", (req, res) => { 
            dataServiceComments.addComment(req.body).then( () =>
            {
              res.redirect("/about");
            }).catch((err)=>
            {
              console.log(err);
            });
        }); 

        // setup POST route to update replies and redirect page
app.post("/about/addReply", (req, res) => { 
    dataServiceComments.addReply(req.body).then( () => {
      res.redirect("/about"); 
    }).catch((err)=>
    {
      console.log(err);
    });
});

// login route
app.get("/login", function(req,res){
    res.render("login", {});
  });

  // register route
app.get("/register", function(req,res){
    res.render("register", {});
  });

  // register route POST
app.post("/register", function(req,res){
    
      dataServiceAuth.registerUser(req.body).then( (dataFromPromise) =>
      {
        res.render("register", { successMessage: "User created" });
      })
      .catch( (err)=> {
        res.render("register", { errorMessage: err, user: req.body.user });
      });
    });

// create the user session by login
app.post("/login", function(req,res) {
    
      dataServiceAuth.checkUser(req.body).then(()=>
      {
        req.session.user = {
          username: req.body.user
        }; 
        res.redirect('/employees'); 
      })
      .catch((err)=> {
       
        res.render("login", {errorMessage: err, user: req.body.user});
      });
    });

    // logout route
app.get("/logout", function(req,res) {
    req.session.reset();
    res.redirect("/");
  });

        //set up 404 by app.use    
    app.use((req, res)=>{
        res.status(404).send("Page Not Found");
    })