import {User} from "./UserManager";
import { Socket } from "socket.io";
import { Server } from "socket.io";
import crypto from "crypto";

//this might break at a scale so we use crypto.
// let GLOBAL_ROOM_ID = 1;

interface Room{
    user1 : User,
    user2 : User,
}

interface ChatMessage {
  text: string;
  senderId: string;
  senderName: string;
  timeStamp: number;
}

export class RoomManager{

    private rooms : Map<string, Room>;
    private socketToRoom : Map<string, string>;
    private io : Server;

    constructor(io : Server){
        this.rooms = new Map<string, Room>();
        this.socketToRoom = new Map<string,string>();
        this.io = io;
    }

    createRoom(user1 : User, user2: User){
        const roomId = this.generate().toString();

        this.rooms.set(roomId, {user1, user2});
        this.socketToRoom.set(user1.socket.id, roomId);
        this.socketToRoom.set(user2.socket.id, roomId);

        //Add the users in the socket-io rooms so that we can easily making a chatting section for them
        console.log("Adding the users in the socket rooms");
        user1.socket.join(roomId);
        user2.socket.join(roomId);
        console.log("Added the users in the socket rooms. Users ready for chatting");

        user1.socket.emit('send-offer',{
            roomId
        });

        user2.socket.emit('send-offer',{
            roomId
        });
    }

    onOffer(roomId: string, sdp : string, senderSocketid : string){
        const room = this.rooms.get(roomId);
        
        if(!room) return;

        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2 : room.user1;
        receivingUser?.socket.emit('offer',{
            sdp,
            roomId
        })
    }

    onAnswer(roomId:string, sdp : string, senderSocketid : string){
        const room = this.rooms.get(roomId);

        if(!room) return;

        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2 : room.user1;

        receivingUser?.socket.emit('answer',{
            sdp,
            roomId
        });
    }

    onIceCandidates(roomId:string, senderSocketid : string, candidate : any, type : "sender" | "receiver"){
        const room = this.rooms.get(roomId);

        if(!room) return;
        
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2 : room.user1;
        
        receivingUser?.socket.emit('add-ice-candidate', ({candidate, type}));
    }

    generate(){
        return crypto.randomUUID();
    }

    findRoomBySocketId(socketId: string): { roomId: string, room: Room } | null {
        const roomId = this.socketToRoom.get(socketId);
        if(!roomId) return null;

        const room = this.rooms.get(roomId);
        if(!room) return null;

        return {roomId, room};
    }

    deleteRoom(roomId: string) {
        const room = this.rooms.get(roomId);

        if(room){
            room.user1.socket.leave(roomId);
            room.user2.socket.leave(roomId);
            
            this.socketToRoom.delete(room.user1.socket.id);
            this.socketToRoom.delete(room.user2.socket.id);
        }

        this.rooms.delete(roomId);
    }

    onMessage(roomId: string, message:ChatMessage, socketId:string){
        
        const room = this.rooms.get(roomId);
        if(!room) return;

        const sender = room.user1.socket.id === socketId? room.user1: room.user2;

        this.io.to(roomId).except(socketId).emit("receive-message",message);
    }

}