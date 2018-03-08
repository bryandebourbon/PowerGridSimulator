// Initialize Firebase
var config = {
    apiKey: "AIzaSyBb2wL0Zu7sd5SSFArD_5tYvWiZsT7HFJ4",
    authDomain: "power-grid-simulator.firebaseapp.com",
    databaseURL: "https://power-grid-simulator.firebaseio.com",
    projectId: "power-grid-simulator",
    storageBucket: "power-grid-simulator.appspot.com",
    messagingSenderId: "1052485562020"
}
firebase.initializeApp(config);

var guid = function () {
    var s4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}