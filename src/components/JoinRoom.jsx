import { useState, useEffect } from "react";
import { socket } from "../socket/socketClient";

function JoinRoom({ setScreen,setRoomCode,setPlayerId }) {

  const [code,setCode] = useState(["","","",""]);

  const handleChange = (value,index)=>{

    if(!/^[a-zA-Z0-9]?$/.test(value)) return;

    const newCode=[...code];
    newCode[index]=value.toUpperCase();
    setCode(newCode);

    if(value && index<3){
      document.getElementById(`code-${index+1}`).focus();
    }

  };

  const handleJoinRoom = ()=>{

    const roomCode=code.join("");

    if(roomCode.length !== 4){
      alert("Enter valid room code");
      return;
    }

    socket.emit("join_room",{
      roomCode,
      playerName:"Player"
    });

  };

  useEffect(()=>{

    const handleJoined=(data)=>{

      console.log("room_joined:",data);

      setRoomCode(data.roomCode);
      setPlayerId(data.playerId);

      setScreen("lobby");

    };

    socket.on("room_joined",handleJoined);

    return ()=>{
      socket.off("room_joined",handleJoined);
    };

  },[setRoomCode,setPlayerId,setScreen]);

  return(

    <div className="room-container">

      <div className="room-box">

        <h2 className="room-title">
          ENTER ROOM CODE
        </h2>

        <div className="code-inputs">

          {code.map((digit,index)=>(
            <input
              key={index}
              id={`code-${index}`}
              className="code-input"
              value={digit}
              maxLength="1"
              onChange={(e)=>handleChange(e.target.value,index)}
            />
          ))}

        </div>

        <button
          className="menu-button"
          onClick={handleJoinRoom}
        >
          JOIN ROOM
        </button>

      </div>

    </div>

  );

}

export default JoinRoom;