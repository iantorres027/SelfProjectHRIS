"use strict"

var connection = new signalR.HubConnectionBuilder().withUrl("/authenticationHub").build();

const sessionTimeout = 31 * 60000; // 31 minutes
let authenticationInterval;
let isActiveAlert = false;
let lastMouseMovement;

connection.start().then(function () {
    $(document).ajaxStart(checkAuthentication);

    // Capture fetch requests
    const originalFetch = fetch;
    window.fetch = function (resource, init) {
        return originalFetch(resource, init)
            .then(response => {
                checkAuthentication();
                return response;
            });
    };
}).catch(function (err) {
    return console.error(err.toString());
});

$(document.body).bind("mousemove keypress", function () {   
    lastMouseMovement = new Date().getTime();
});

authenticationInterval = setInterval(function () {
    var currentTime = new Date().getTime();
    if (currentTime - lastMouseMovement >= 31 * 60000)
        checkauthentication();
}, 1000);

connection.on("IsAuthenticated", function (isAuthenticated) {
    if (!isAuthenticated && !isActiveAlert) {
        handleSessionExpired();
    }
});

function handleSessionExpired() {
    isActiveAlert = true;
    clearInterval(authenticationInterval);

    Swal.fire({
        title: 'Session Expired!',
        text: "Session Expired. You will need to log in again!",
        icon: 'warning',
        confirmButtonColor: '#3085d6'
    }).then(() => {
        location.reload();
    });

    setTimeout(() => {
        location.reload();
    }, 2000);
}

function checkAuthentication() {
    connection.invoke("CheckIfAuthenticated").catch(function (err) {
        return console.error(err.toString());
    });
}