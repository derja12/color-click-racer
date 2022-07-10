const WebSocket = require("ws");

// WEB SOCKET CODE

// GLOBAL STATE

const TOTAL_POINTS = 600;
var points_count = {
    'red': TOTAL_POINTS/4,
    'blue': TOTAL_POINTS/4,
    'yellow': TOTAL_POINTS/4,
    'green': TOTAL_POINTS/4
}
var between_round = false;

var red_wins = 0;
var blue_wins = 0;
var yellow_wins = 0;
var green_wins = 0;

const port = process.env.PORT || 4200;
const wss = new WebSocket.Server({ port : port});
console.log("Hosting WS on localhost:4200");

wss.on('connection', function connection(ws) {
    console.log("New Connection Made!");
    broadcastUpdatePoints(ws);
    ws.on('message', function message(data, isBinary) {
        var incoming_message = JSON.parse(data);
        console.log(incoming_message);
        if (!between_round) {
            switch (incoming_message.action) {
            case "click":
                    addPointsToClick(incoming_message.color);
                break;
            case "reset_stats":
                resetStats();
                broadcastUpdatePoints();
                break;
            case "reset_points":
                resetPoints();
                broadcastUpdatePoints();
                break;
            default:
                console.log("Unknown WS message recieved:", incoming_message);
            }
        } else {
            console.log("Recieved message between rounds:", incoming_message);
        }
    });
});

function broadcastUpdatePoints(user=null) {
    let message = {
        action: "update_points",
        points_count: points_count,
        red_wins: red_wins,
        blue_wins: blue_wins,
        yellow_wins: yellow_wins,
        green_wins: green_wins,
        total_points: TOTAL_POINTS
    }
    broadcastMessage(message, user);
}

function broadcastMessage(message, user) {
    if (user != null) {
        if (user.readyState === WebSocket.OPEN) {
            user.send(JSON.stringify(message));
        }
    } else {
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}

function addPointsToClick(color) {
    let other_colors = ['red', 'blue', 'yellow', 'green'];

    // filter out (color) from others
    other_colors = other_colors.filter(el => el != color);

    let total = 0;
    for (let i = 0; i < other_colors.length; i++) {
        // take away 1 point from others if they have one
        if (points_count[other_colors[i]] > 0) {
            points_count[other_colors[i]] -= 1;
            total += 1;
        }
    }

    // add the total points taken away from others
    points_count[color] += total;
    if (!checkWinCondition()) {
        broadcastUpdatePoints();
    }
}

function checkWinCondition() {
    let colors = ['red', 'blue', 'yellow', 'green'];
    for (var i = 0; i < 4; i++) {
        if (points_count[colors[i]] >= TOTAL_POINTS/2) {
            between_round = true;
            if (colors[i] == 'red') red_wins += 1;
            else if (colors[i] == 'blue') blue_wins += 1;
            else if (colors[i] == 'yellow') yellow_wins += 1;
            else if (colors[i] == 'green') green_wins += 1;
            let message = {
                action: "color_win",
                color: colors[i],
                red_wins: red_wins,
                blue_wins: blue_wins,
                yellow_wins: yellow_wins,
                green_wins: green_wins
            };
            broadcastMessage(message);
            resetPoints();
            setTimeout(() => {
                broadcastUpdatePoints();
                between_round = false;
            }, 3000);
            return true;
        }
    }
    return false;
}

function resetPoints() {
    points_count = {
        'red': TOTAL_POINTS/4,
        'blue': TOTAL_POINTS/4,
        'yellow': TOTAL_POINTS/4,
        'green': TOTAL_POINTS/4
    };
}

function resetStats() {
    red_wins = 0;
    blue_wins = 0;
    yellow_wins = 0;
    green_wins = 0;
}
