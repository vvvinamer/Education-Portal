const firebase = require("firebase/app");

function onLoginClick(email, password) {
    if (!email || !password) {
        alert("Fill Credentials")
    } else {
        alert("else field");
        firebase.auth().signInWithEmailAndPassword(email, password).then(response => {
            alert(response);
        }).catch(error => {
            console.log(`error: `);
        });
    }
}

module.exports.onLoginClick = onLoginClick;