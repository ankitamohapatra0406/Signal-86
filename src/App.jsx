import bgVideo from "./assets/videos/bg.mp4";
import { useState, useEffect } from "react";
import JoinRoom from "./components/JoinRoom";
import CreateRoom from "./components/CreateRoom";
import HawkinsIntro from "./components/HawkinsIntro";
import { socket } from "./socket/socketClient";
import GameScreen from "./components/GameScreen";

function App() {

  const [screen,setScreen] = useState("menu");
  
  const [showIntro,setShowIntro] = useState(false);
  const [roomCode,setRoomCode] = useState("");
  const [playerId,setPlayerId] = useState("");
  const [isHost,setIsHost] = useState(false);
  const [role,setRole] = useState(null);

  useEffect(()=>{

    socket.connect();

    const handleLeave = ()=>{
      if(roomCode && playerId){
        socket.emit("player_disconnect",{
          roomCode,
          playerId
        });
      }
    };

    window.addEventListener("beforeunload",handleLeave);

    return ()=>{
      window.removeEventListener("beforeunload",handleLeave);
    };

  },[roomCode, playerId]);

  const handleCreateRoom = ()=>{

    setIsHost(true);
    setShowIntro(true);

    setTimeout(()=>{
      setShowIntro(false);
      setScreen("lobby");
    },8000);

  };

  return (

    <div className="app-container">

      <video autoPlay muted loop playsInline className="bg-video">
        <source src={bgVideo} type="video/mp4" />
      </video>

      <div className="crt-overlay"></div>

      <div className="title-bar">
        SIGNAL 86
      </div>

      <div className="overlay">

        {screen === "menu" && (

          <div className="menu-container">

            <button
              className="menu-button"
              onClick={handleCreateRoom}
            >
              CREATE ROOM
            </button>

            <button
              className="menu-button"
              onClick={()=>{

                setIsHost(false);
                setShowIntro(true);

                setTimeout(()=>{
                  setShowIntro(false);
                  setScreen("joinRoom");
                },8000);

              }}
            >
              JOIN ROOM
            </button>

          </div>

        )}

        {screen === "joinRoom" && (

          <JoinRoom
            setScreen={setScreen}
            setRoomCode={setRoomCode}
            setPlayerId={setPlayerId}
          />

        )}

        {screen === "lobby" && (

          <CreateRoom
            isHost={isHost}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            playerId={playerId}
            setPlayerId={setPlayerId}
            setScreen={setScreen}
            setRole={setRole}
          />

        )}
        {screen === "game" && (
          <GameScreen role={role}
              roomCode={roomCode}
              playerId={playerId} />
        )}

      </div>

      {showIntro && <HawkinsIntro />}

    </div>

  );

}

export default App;