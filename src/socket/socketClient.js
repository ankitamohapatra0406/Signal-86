import { io } from "socket.io-client";

/*
Production backend URL
*/
const SERVER_URL = "https://signal-86-backend.onrender.com";

export const socket = io(SERVER_URL,{
  transports:["websocket","polling"],
  autoConnect:false
});

/* Debug logs */

socket.on("connect",()=>{
  console.log("Socket connected:",socket.id);
});

socket.on("disconnect",()=>{
  console.log("Socket disconnected");
});

socket.on("connect_error",(err)=>{
  console.error("Socket connection error:",err.message);
});