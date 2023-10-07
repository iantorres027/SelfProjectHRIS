var connection = new signalR.HubConnectionBuilder()
    .withUrl("/progressHub")
    .build();

connection.on("UpdateProgress", function (progressPercentage) {
    // Handle progress updates
    console.log("Progress: " + progressPercentage + "%");
});

connection.start()
    .then(function () {
        // Connection established
    })
    .catch(function (err) {
        console.error(err.toString());
    });