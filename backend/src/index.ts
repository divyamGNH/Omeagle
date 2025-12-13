import express from "express";
import http from "http";
import {Server} from "socket.io";
import cors from "cors";

const app = express();

const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req,res) => {
  res.json({ message: "Server is running" });
});

io.on('connection', (socket)=>{
    console.log(`${socket} connected`);
})

server.listen(PORT, () => {
  console.log(`Server listening on PORT : ${PORT}`);
});
