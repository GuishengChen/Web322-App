
const mongoose = require('mongoose');
let Schema = mongoose.Schema;

// define the content schema
const commentSchema = new Schema({
  "authorName": String,
  "authorEmail": String,
  "subject": String,  
  "commentText": String,
  "postedDate": {
    type: Date,
    default: Date.now
  },
  "replies": [{ 
      comment_id: String,  
      authorName: String, 
      authorEmail: String, 
      commentText: String, 
      repliedDate: Date }]
});

// to be defined on new connection (see initialize) 
let Comment; 

// create new connection
// we are able to connect to our MongoDB instance 
module.exports.initialize = function () 
{
    return new Promise(function (resolve, reject) {

        let db = mongoose.createConnection("mongodb://web322:guisheng@ds031661.mlab.com:31661/web322_a6");
        db.on('error', (err)=>
        { 
            reject(err); // reject the promise with the provided error 
        }); 
        
        db.once('open', ()=>
        { 
           Comment = db.model("comments", commentSchema);            
           resolve();
        }); 
    }); 
}; 

// add a new Comment to the database 
module.exports.addComment = (data) =>
{
    return new Promise( function (resolve, reject) 
    {
        data.postedDate = Date.now();
        let newComment = new Comment(data);
        newComment.save( (err) => 
        {
            if(err) 
            {
                //console.log("There was an error saving the Kwik-E-Mart company");
                reject("There was an error saving the comment: " + err);
            } 
            else 
            {
                resolve(newComment._id);
            }
        });        
    });
};

// return all comments
module.exports.getAllComments = () =>
{
    return new Promise(function (resolve, reject) 
    {
        Comment.find()
        .sort({ postedDate : 1 })
        .exec()
        .then((comments) => 
        {
            //  comments will be an array of objects.
            // Each object will represent a document that matched the query
            resolve(comments);
        }).catch( (err)=> {

            // return promise and pass the error that was "caught" 
            // during the Comment.find() operation        
            reject(err);
        });
    });  
}

// add a new Reply to an existing Comment
module.exports.addReply = (data) =>
{
    return new Promise( function (resolve, reject) 
    {
        data.repliedDate  = Date.now();
        //update inner record
        Comment.update(
        {_id: data.comment_id}
        ,
        {$addToSet: {replies: data}}
        , 
        { multi: false })   
        .exec()
        .then(() => 
        {                
            resolve();
        }).catch((err) =>{
            console.log("data-service-comments::addReply():::fail!" + err);  
        });         
 
    });
}