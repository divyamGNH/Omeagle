import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { UserManager } from "./managers/UserManager";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = 3000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

const userManager: UserManager = new UserManager();

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
