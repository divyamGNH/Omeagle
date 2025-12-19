import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import { Server } from "socket.io";
import { UserManager } from "./managers/UserManager";
import { RoomManager } from "./managers/RoomManager";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

const roomManager : RoomManager = new RoomManager(io);
const userManager: UserManager = new UserManager(roomManager);

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`);

  userManager.addUser("randomName", socket);

  socket.on("disconnect", () => {
    console.log("user disconnected");
    userManager.endSession(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on PORT : ${PORT}`);
});
