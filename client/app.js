const SERVER_ROOT_URL = "wss://color-click-racer.herokuapp.com/";

var app = new Vue({
    el: '#app',
    data: {
        TOTAL_POINTS: 600,
        points_count: {
            'red': 0,
            'blue': 0,
            'yellow': 0,
            'green': 0
        },
        colorStyles: {
            'red': {
                height: '0%',
                backgroundColor: 'var(--red)'
            },
            'blue': {
                height: '0%',
                backgroundColor: 'var(--blue)'
            },
            'yellow': {
                height: '0%',
                backgroundColor: 'var(--yellow)'
            },
            'green': {
                height: '0%',
                backgroundColor: 'var(--green)'
            }
        },
        win_color: "",
        red_wins: 0,
        blue_wins: 0,
        yellow_wins: 0,
        green_wins: 0,
        socket: null
    },
    methods: {
        // calculates how many points to add to (color)
        addPointsToClick: function(color) {
            let other_colors = ['red', 'blue', 'yellow', 'green'];

            // filter out (color) from others
            other_colors = other_colors.filter(el => el != color);

            let total = 0;
            for (let i = 0; i < other_colors.length; i++) {
                // take away 1 point from others if they have one
                if (this.points_count[other_colors[i]] > 0) {
                    this.points_count[other_colors[i]] -= 1;
                    total += 1;
                }
            }

            // add the total points taken away from others
            this.points_count[color] += total;
            this.updateColorStyles();
        },
        // WEBSOCKET add points to click
        addPointsToClickWS: function(color) {
            let message = {
                action: "click",
                color: color
            }
            this.socket.send(JSON.stringify(message));
        },
        // updates height of each color based on points amount
        updateColorStyles: function() {
            Object.keys(this.points_count).forEach(color => {
                let ratio = this.points_count[color] / (this.TOTAL_POINTS / 1.5);
                let percent = ratio * 100;
                
                this.colorStyles[color].height = String(percent) + "%";
            });
        },
        // connects and handles socket
        connectWS: function() {
            this.socket = new WebSocket(SERVER_ROOT_URL);
            this.socket.onmessage = (event) => {
                let data = JSON.parse(event.data);
                // {action: "update_likes", likes_object: {id:#,id:#...}}
                switch (data.action) {
                    case "update_points":
                        this.win_color = "";
                        this.red_wins = data.red_wins;
                        this.blue_wins = data.blue_wins;
                        this.yellow_wins = data.yellow_wins;
                        this.green_wins = data.green_wins;
                        this.points_count = data.points_count;
                        this.TOTAL_POINTS = data.total_points;
                        this.updateColorStyles();
                        break;
                    case "color_win":
                        this.win_color = data.color;
                        this.red_wins = data.red_wins;
                        this.blue_wins = data.blue_wins;
                        this.yellow_wins = data.yellow_wins;
                        this.green_wins = data.green_wins;
                        break;
                    default:
                        console.log("action not recognized:", data.action)
                }
            }
        },
        resetStatsClick: function() {
            let message = {
                action: "reset_stats"
            }
            this.socket.send(JSON.stringify(message))
        },
        resetPointsClick: function() {
            let message = {
                action: "reset_points"
            }
            this.socket.send(JSON.stringify(message))
        }
    },
    computed: {

    },
    created: function () {
        this.updateColorStyles();
        this.connectWS();
    }
});

