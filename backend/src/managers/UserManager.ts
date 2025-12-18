import { Socket } from "socket.io";
import {RoomManager} from "./RoomManager";
import { Server } from "socket.io";

export interface User{
    socket : Socket,
    name : string
}

export class UserManager{
    private users : User[];
    private queue : string[];
    private roomManger : RoomManager;

    constructor(roomManager : RoomManager){
        this.users = [];
        this.queue = [];
        this.roomManger = roomManager;
    }

    addUser(name : string, socket : Socket){
        this.users.push({name, socket});
        this.queue.push(socket.id);
        socket.emit('lobby');
        this.clearQueue();
        this.initHandlers(socket);
    }

    //next connection
    // removeUser(socketId : string){
    //     const user = this.users.find(x=>x.socket.id===socketId);
    //     if(!user) return;

    //     this.users = this.users.filter(u=>u.socket.id !== socketId);
    //     this.queue = this.queue.filter(id => id !== socketId);
    //     this.roomManager.removeUser(socketId);
    // }

    clearQueue(){
        console.log("inside clear queue");
        console.log(this.queue.length);

        if(this.queue.length < 2) return;

        const id1 = this.queue.pop();
        const id2 = this.queue.pop();

        console.log("id is" + id1 + id2);

        const user1 = this.users.find(x=>x.socket.id === id1);
        const user2 = this.users.find(x=>x.socket.id === id2);

        if(!user1 || !user2) return;

        console.log("creating room");
        const room = this.roomManger.createRoom(user1, user2);
        this.clearQueue()
    }

    initHandlers(socket : Socket){
        socket.on("offer",({sdp, roomId}: {sdp:string , roomId : string})=>{
            this.roomManger.onOffer(roomId, sdp, socket.id);
        });

        socket.on("answer",({sdp, roomId}: {sdp:string , roomId : string})=>{
            this.roomManger.onAnswer(roomId, sdp, socket.id);
        });

        socket.on("add-ice-candidate",({candidate, roomId, type})=>{
            this.roomManger.onIceCandidates(roomId, socket.id, candidate, type);
        });

        socket.on("send-message",({roomId, message})=>{
            this.roomManger.onMessage(roomId, message, socket.id);
        });   
    }

    //endSession
    endSession(socket:Socket){
        const socketId = socket.id;

        this.queue.filter(id=>id!==socket.id);

        const Room = this.roomManger.findRoomBySocketId(socketId);

        if(Room){
            const {roomId, room} = Room;

            const remainingUser = room.user1.socket.id === socketId ? room.user2 : room.user1;

            this.roomManger.deleteRoom(roomId);

            remainingUser.socket.emit("lobby");

            this.queue.push(remainingUser.socket.id);
        }

        this.users = this.users.filter(u=>u.socket.id !== socket.id);

        this.clearQueue();
    }
}