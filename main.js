let socket;
let isHackerTheme = true; // Track the current theme

document.getElementById("login-button").addEventListener("click", function () {
    const protocol = document.getElementById("protocol").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const host = document.getElementById("host").value;
    const port = document.getElementById("port").value;
    const command = document.getElementById("command").value;

    // Connect to WebSocket
    socket = new WebSocket("wss://your-render-url/ws");

    socket.onopen = function () {
        document.getElementById("login-form").style.display = "none";
        document.getElementById("terminal").style.display = "block";
        document.getElementById("input").style.display = "block";
        document.getElementById("terminal").innerText += "Connected to server\n";

        // Send connection message
        socket.send(JSON.stringify({ protocol, username, password, host, port, command }));
    };

    socket.onmessage = function (event) {
        const response = JSON.parse(event.data);
        if (response.error) {
            document.getElementById("terminal").innerText += `Error: ${response.error}\n`;
        } else if (response.output) {
            simulateTyping(response.output);
        }
    };

    socket.onclose = function () {
        document.getElementById("terminal").innerText += "Disconnected from server\n";
    };

    document.getElementById("input").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            const command = this.value;
            socket.send(JSON.stringify({ protocol, username, password, host, port, command })); // Send command with credentials
            this.value = "";
        }
    });
});

// Function to simulate typing effect
function simulateTyping(text) {
    const terminal = document.getElementById("terminal");
    const currentText = terminal.innerText;
    terminal.innerText = currentText + "\n";
    let index = 0;

    const typingInterval = setInterval(() => {
        if (index < text.length) {
            terminal.innerText += text.charAt(index);
            index++;
        } else {
            clearInterval(typingInterval);
        }
    }, 50); // Adjust typing speed here
}

// Theme toggle functionality
document.getElementById("toggle-button").addEventListener("click", function () {
    isHackerTheme = !isHackerTheme; // Toggle theme state
    if (isHackerTheme) {
        document.body.classList.add("hacker-theme");
        document.body.classList.remove("classic-theme");
        this.innerText = "Switch to Classic Theme";
    } else {
        document.body.classList.add("classic-theme");
        document.body.classList.remove("hacker-theme");
        this.innerText = "Switch to Hacker Theme";
    }
});
