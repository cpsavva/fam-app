// Initialize Firebase
var config = {
    apiKey: "AIzaSyCRfzoY76tvHoB3RUbvU5pJoHylG4L3hI8",
    authDomain: "fam-app-94e72.firebaseapp.com",
    // authDomain: "http://127.0.0.1:8080", // this should match the one on your firebase console
    databaseURL: "https://fam-app-94e72.firebaseio.com",
    storageBucket: "fam-app-94e72.appspot.com",
    messagingSenderId: "665693601471"
};

firebase.initializeApp(config);

//------Database Reference--------
var database = firebase.database();
var dbRef = database.ref();
var auth = firebase.auth();

var connectedRef = database.ref(".info/connected");

var membersRef = database.ref("/members"); //members data
var currentUsersRef = database.ref("/currentUsers"); //to count number of ppl online
var bookmarksRef = database.ref("/bookmarks");

var currentUser = {}; //setting globally

$(document).ready(function() {

   $('input').parsley(); //parsleyJS library

    $('#btnSignupSubmit').on('click', function() {
        
        var email = $('#txtSignupEmail').val().trim();
        var password = $('#txtSignupPassword').val().trim();
        firebaseSignup(email, password);
        
    });

    $('#btnSigninSubmit').on('click', function() {
        
        var email = $('#txtSigninEmail').val().trim();
        var password = $('#txtSigninPassword').val().trim();
        firebaseSignin(email, password);
       
        
    });

    $("#btnSignout").on('click', function() {
        
        firebase.auth().signOut().then(function() {
            console.log("Signedout successfully");
        }, function(error) {
            console.log(error.message);
        });

        location.reload();
        
    });

    $("#btnReset").click(function() {
        $(':input', '#signupDiv').val("");
        
    });

    $("#btnGoogleSignin").click(function() {
        firebaseGoogleSignin();
        
    });

    $("#btnGoogleSignup").click(function() {
        firebaseGoogleSignin();
        
    
      
    });

    $("#btnProfile").click(function() {
        fetchUserProfile();
       
        
    });

    $('#profile-close').on('click', function(){
        $("#profileDiv").empty();
        
    })


    function firebaseSignup(email, password) {
        var newUserPromise =
            firebase.auth().createUserWithEmailAndPassword(email, password);

        console.log('firebaseSignup(), newUserPromise', newUserPromise);

        newUserPromise.catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            if (errorCode == 'auth/weak-password') {
                alert('The password is too weak.');
            } else {
                alert(errorMessage);
            }
            console.log(error);
        });

        newUserPromise.then(function(user) {
            console.log("firebaseSignup(), Signed up successfully", user);
            $('#signupModal').hide('hide');

            // add user info to database
            addToDatabase(user);

            // location.reload(); //refreshes before other actions are done??
        });
    }


    function firebaseSignin(email, password) {
        var userObjPromise = firebase.auth().signInWithEmailAndPassword(email, password);

        userObjPromise.catch(function(error) {
            console.log(error.code);
            console.log(error.message);
            $('#errorStatus').html("Signin failed, try again");
        });

        userObjPromise.then(function(user) {
            console.log("firebaseSignin(), Signed in successfully", user);
            $('#signinModal').hide('hide');
            
            //quick fix to resolve reload, review again
            // location.reload();
        });
    }

    function firebaseGoogleSignin() {
        console.log("in firebaseGoogleSignin()");

        var provider = new firebase.auth.GoogleAuthProvider();
        var result = firebase.auth().signInWithPopup(provider);

        console.log("firebaseGoogleSignin() ", result);

        result.then(function(result) {

            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;

            // The signed-in user info.
            var user = result.user;
            console.log('firebaseGoogleSignin()-user ', user);

            //add google user too? 
            addToDatabase(user);

            $('#signinModal').hide('hide');
            $('#signupModal').hide('hide');

            // location.reload();

        });

        result.catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;

            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            // $('#errorStatus').html("Signin failed, try again");
        });
    }


    firebase.auth().onAuthStateChanged(function(firebaseUser) {
        if (firebaseUser) {
            console.log('onAuthStateChanged(), User logged in', firebaseUser);
            $('#status').html("Welcome " + firebaseUser.displayName);
            $('#status').prop('disabled', false);
        } else {
            console.log("onAuthStateChanged(), not logged in");
            $('#status').html("Not logged in");
            $('#status').prop('disabled', true);
        }

        // setCurrentUser(); //todo: this is a better
    });

    //keep track of number of users
    connectedRef.on("value", function(snapshot) {
        if (snapshot.val() === true) {
            console.log("New connection to the database");
            // Add user to the connections list.
            var con = currentUsersRef.push(true);
            // Remove user from the connection list when they disconnect.
            con.onDisconnect().remove();
        } else {
            console.log("New disconnection to the database");
        }
    });

    currentUsersRef.on("value", function(snapshot) {
        console.log("Number of connections", snapshot.numChildren());
        $("#connected-viewers").prepend(snapshot.numChildren());
    });


    function addToDatabase(user) {

        console.log("addToDatabase(), adding user to database", user.displayName, user.email);

        var displayName;
        var zipcode;

        if (user.displayName == null) {
            displayName = $("#txtSignupUserName").val().trim();
        } else {
            displayName = user.displayName;
        }

        zipcode = $("#txtSignupZipcode").val().trim();

        var member = {};
        member.displayName = displayName;
        member.zipcode = zipcode;
        member.email = user.email;

        membersRef.child(displayName).set(member);

        updateUserInfo(user);
        // setCurrentUser();
    }


    function updateUserInfo(user) {

        console.log("updateUserInfo(), User logged in ", user);

        if (user.displayName == null) {
            console.log("updateUserInfo(user), display name is" + user.displayName);
            user.updateProfile({
                displayName: $("#txtSignupUserName").val().trim()
            }).then(function() {
                $('#status').html("Welcome " + user.displayName); //check again, quickhack
                console.log("updateUserInfo(), User updated successfully with ",  $("#txtSignupUserName").val().trim());
                // location.reload();
            }, function(error) {
                console.log(error.message);
            });
        } else {
            console.log('updateUserInfo(), User info not updated');
        }
    }

    //setting global variable of current user (why do I lose scope while bookmarking)

    function setCurrentUser() {
        currentUser = firebase.auth().currentUser; //set the global variable;   
        console.log("setCurrentUser(), current user=", currentUser);

        if (currentUser) {
            console.log("setCurrentUser(), User logged in ", currentUser.displayName);
        } else {
            console.log('setCurrentUser(), No user logged in');
        }
    }

    function fetchUserProfile() {

        var user = firebase.auth().currentUser;

        console.log("fetchUserProfile() for user=", user);

        membersRef.once("value")
            .then(function(membersSnapshot) {
                var profileObj = membersSnapshot.child(user.displayName).val();

                console.log("fetchUserProfile()", profileObj);

                var profileDivSection = $("<div>");
                profileDivSection.attr("class", "profileClass");
                profileDivSection.css("background-color", "#e9e9e9");
                profileDivSection.css("padding", "15px");
                profileDivSection.css("color", "#000000");
                profileDivSection.css("font-size", "20px");
                profileDivSection.css("border", "2px solid #000000");
                profileDivSection.css("margin-top", "10px");

                var userProfile = "<table class='profileTable'>";

                 Object.keys(profileObj).forEach(function(key) {
                    userProfile += '<tr><td class="capitalize">' + key + "</td><td>" + profileObj[key] + '</td></tr>';
                });

                profileDivSection.html(userProfile);
                $("#profileDiv").append(profileDivSection);

            });

            //reading  bookmarks from database

            bookmarksRef.child(user.displayName).once('value', function(bookmarksSnapshot) {

                var bookmarksObj = bookmarksSnapshot.val();
                console.log("bookmarks snapshot", bookmarksObj);

                if(bookmarksObj != null){

                    var bookmarkDivSection = $("<div>");
                        bookmarkDivSection.attr("class", "profileClass");
                        bookmarkDivSection.css("background-color", "#e9e9e9");
                        bookmarkDivSection.css("padding", "15px");
                        bookmarkDivSection.css("color", "#000000");
                        bookmarkDivSection.css("font-size", "20px");
                        bookmarkDivSection.css("border", "2px solid #000000");
                        bookmarkDivSection.css("margin-top", "10px");

                    var bookmarkP = '<p style="font-size: 24px; font-weight: bold;font-decoration: underline"> Your Bookmarks  </p>';

                    Object.keys(bookmarksObj).forEach(function(key) {
                        bookmarkP += '<p>' + bookmarksObj[key] + '</p>';
                    });
                    bookmarkDivSection.html(bookmarkP);

                    $("#profileDiv").append(bookmarkDivSection);

                }else{
                    console.log("No bookmarks for the user");
                }
            });

    }



    //TODO 
    // function fetchUserProfile() {

    //     var user = firebase.auth().currentUser;

    //     console.log("fetchUserProfile() for user=", user);

    //     console.log("fetchUserProfile() membersRef", membersRef);

    //     membersRef.once("value")
    //         .then(function(membersSnapshot) {
    //             var profileObj = membersSnapshot.child(user.displayName).val();

    //             console.log("fetchUserProfile()", profileObj);

    //             var profileDivSection = $("<div>");
    //             profileDivSection.attr("class", "profileClass");
    //             profileDivSection.css("background-color", "#e9e9e9");
    //             profileDivSection.css("padding", "15px");
    //             profileDivSection.css("color", "#000000");
    //             profileDivSection.css("font-size", "20px");
    //             profileDivSection.css("border", "2px solid #000000");
    //             profileDivSection.css("margin-top", "10px");

    //             var userProfile = "<table class='profileTable'>";

    //              Object.keys(profileObj).forEach(function(key) {
    //                 userProfile += '<tr><td class="capitalize">' + key + "</td><td>" + profileObj[key] + '</td></tr>';
    //             });

    //              console.log(userProfile);

    //             profileDivSection.html(userProfile);
    //             $("#profileDiv").append(profileDivSection);

    //         });

    //     //reading  bookmarks from database

    //     bookmarksRef.child(user.displayName).once('value', function(bookmarksSnapshot) {

    //         var bookmarksObj = bookmarksSnapshot.val();
    //         console.log("bookmarks snapshot", bookmarksObj);
            
    //         var trashIcon = '<span class="trash" style="float: right"><a href="#"><i class="fa fa-trash-o fa-lg" aria-hidden="true" style="color:red"></i></a></span>';

    //         if(bookmarksObj != null){

    //             var bookmarkDivSection = $("<div>");
    //                 bookmarkDivSection.attr("class", "profileClass");
    //                 bookmarkDivSection.css("background-color", "#e9e9e9");
    //                 bookmarkDivSection.css("padding", "15px");
    //                 bookmarkDivSection.css("color", "#000000");
    //                 bookmarkDivSection.css("font-size", "20px");
    //                 bookmarkDivSection.css("border", "2px solid #000000");
    //                 bookmarkDivSection.css("margin-top", "10px");


    //             var bookmarkP = [];

    //             bookmarkP.push('<p style="font-size: 24px; font-weight: bold;font-decoration: underline"> Your Bookmarks  </p>');

    //             Object.keys(bookmarksObj).forEach(function(key) {
    //                 bookmarkP.push('<p>' + bookmarksObj[key] + '' + trashIcon + '</p>');
    //             });

    //             // console.log("Appending bookmarks - ", bookmarkP);

    //             bookmarkDivSection.html(bookmarkP);
    //             $("#profileDiv").append(bookmarkDivSection);

    //         }else{
    //             console.log("No bookmarks for the user");
    //         }
    //     });

    // }


    // //working on this still

    // $('#profileDiv').on('click', '.trash',function(){       
    //     var index = $('.trash').index(this);
        
    //     event.preventDefault();
    //     var currentUser = firebase.auth().currentUser;       

    //     if(currentUser != null){

    //         console.log("Delete the bookmark Item for currentUser=", currentUser);
    //         var displayName = currentUser.displayName;

    //         if(!jQuery.isEmptyObject(currentUser)){ //check for null condition
    //             // $(this).html("");

    //             bookmarksRef.child(displayName).once('value', function(snap){
    //                 console.log("bookmarks snapshot", snap.val());
    //             });


                
    //             // if(displayName != null && bookmarksRef != null){     
    //             //     console.log( bookmarksRef.child(displayName)) ; 
    //             //     // ref.child(key).remove();  
    //             //     bookmarksRef.child(displayName).remove();
    //             // }else{
    //             //     console.log("User displayname is Null");
    //             // }       

    //          }else{
    //              // console.log("The user is not logged in to favorite!");
    //          }

    //      }

    // });

});

