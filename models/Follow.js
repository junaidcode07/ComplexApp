const { ObjectId } = require("mongodb")
const User = require("./User")

const usersCollection = require("../db").db().collection("users")
const followsCollection = require("../db").db().collection("follows")


let Follow = function (followUsername, authorId) {
    this.followUsername = followUsername
    this.authorId = authorId
    this.errors = []
}

Follow.prototype.cleanUp = function () {
    if (typeof (this.followUsername) != "string") { this.followUsername = "" }

}

Follow.prototype.validate = async function (action) {
    //followed username must exist in the database
    let followedAccount = await usersCollection.findOne({ username: this.followUsername })
    if (followedAccount) {
        this.followedId = followedAccount._id
    } else {
        this.errors.push("You cannot follow a user that does not exist.")

    }
    let doesFollowAlreadyExist = await followsCollection.findOne({followedId:this.followedId, authorId: new ObjectId(this.authorId)})
    if(action == "create") {
       if(doesFollowAlreadyExist) { this.errors.push("you are already following this user.")}
    }

    if(action == "delete") {
        if(!doesFollowAlreadyExist) { this.errors.push("you cannot stop following someone you do not already follow.")}
     }

     // should not be able to follow yourself.
     
     if (this.followedId.equals(this.authorId))  {this.errors.push("You cannot follow yourself")}
}

Follow.prototype.create = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")
        if (!this.errors.length) {
          await followsCollection.insertOne({followedId : this.followedId, authorId : new ObjectId(this.authorId)})
          resolve()
        } else {
          reject(this.errors)
        }
        
    })
}

Follow.prototype.delete = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("delete")
        if (!this.errors.length) {
          await followsCollection.deleteOne({followedId : this.followedId, authorId : new ObjectId(this.authorId)})
          resolve()
        } else {
            reject(this.errors)
          }
    })
}


Follow.isVisitorFollowing = async function(followedId, visitorId) {
    let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectId(visitorId)})
    if (followDoc) {
      return true
    } else {
      return false
    }
  }

Follow.getFollowersById = function(id) {
   try {
    return new Promise (async (resolve, reject) => {
        let followers = await followsCollection.aggregate([
        //In this square bracket, we want to provide an array of operations.Each operation is represented by an object.
          {$match: {followedId: id}},
        //We're looking in the user's collection for documents where the I.D. matches the author I.D. from the follow document.
          {$lookup: {from: "users", localField : "authorId", foreignField : "_id", as: "userDoc"}},
        //spelling out what should exist in the object
          {$project: {
              username : {$arrayElemAt : ["$userDoc.username", 0]},
              email : {$arrayElemAt : ["$userDoc.email", 0]}
          }}
        ]).toArray()

        followers = followers.map(function(follower) {
           // when you call the user constructor and when it is true, it automatically figure out the gravatar based on the email.
           let user = new User(follower, true)
           return {username : follower.username, avatar : user.avatar}
        })

        resolve(followers)
    })
   } catch {
       reject()
   }
}

Follow.getFollowingById = function(id) {
    try {
     return new Promise (async (resolve, reject) => {
         let followers = await followsCollection.aggregate([
         //In this square bracket, we want to provide an array of operations.Each operation is represented by an object.
           {$match: {authorId: id}},
         //We're looking in the user's collection for documents where the I.D. matches the author I.D. from the follow document.
           {$lookup: {from: "users", localField : "followedId", foreignField : "_id", as: "userDoc"}},
         //spelling out what should exist in the object
           {$project: {
               username : {$arrayElemAt : ["$userDoc.username", 0]},
               email : {$arrayElemAt : ["$userDoc.email", 0]}
           }}
         ]).toArray()
 
         followers = followers.map(function(follower) {
            // when you call the user constructor and when it is true, it automatically figure out the gravatar based on the email.
            let user = new User(follower, true)
            return {username : follower.username, avatar : user.avatar}
         })
 
         resolve(followers)
     })
    } catch {
        reject()
    }
 }

 Follow.countFollowersById = function(id) {
    return new Promise(async(resolve, reject) =>{
      let followerCount = await followsCollection.countDocuments({followedId: id})
      resolve(followerCount)
    })
  }

  Follow.countFollowingById = function(id) {
    return new Promise(async(resolve, reject) =>{
      let followingCount = await followsCollection.countDocuments({authorId: id})
      resolve(followingCount)
    })
  }


module.exports = Follow