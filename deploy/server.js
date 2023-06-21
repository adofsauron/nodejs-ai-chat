require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { Configuration, OpenAIApi } = require("openai");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = process.env.PORT || 3001;
const ip = process.env.IP || "localhost";

// OpenAI API 配置
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_THISKEY,
});
const openai = new OpenAIApi(configuration);

// 静态文件目录
app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("New user connected");
    // Initialize the conversation history
    const conversationHistory = [];
    socket.on("sendMessage", async (message, callback) => {
        try {
            // Add the user message to the conversation history
            conversationHistory.push({ role: "user", content: message });
            const completion = await openai.createChatCompletion({
                model: "gpt-4",
                messages: conversationHistory,
            });
            const response = completion.data.choices[0].message.content;
            // Add the assistant's response to the conversation history
            conversationHistory.push({ role: "assistant", content: response });
            socket.emit("message", response);
            callback();
        } catch (error) {
            console.error(error);
            callback("Error: Unable to connect to the chatbot");
        }
    });
    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

server.listen(port, ip, () => {
    console.log(`Server is running on ${ip}  port ${port}`);
});
