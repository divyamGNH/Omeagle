import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const URL = "http://localhost:3000";

interface RoomProps {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
}

export const Room = ({
  name,
  localAudioTrack,
  localVideoTrack,
}: RoomProps) => {

  const [lobby, setLobby] = useState(true);
  const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
  const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  //All the remote video and audio for the other peer. 
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  // const remoteAudioRef = useRef(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStream | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStream | null>(null);
  const [remoteMediaTrack, setRemoteMediaTrack] = useState<MediaStream | null>(null);


  useEffect(() => {
    const socket = io(URL);

    socket.on("send-offer", async (roomId) => {
      console.log("sending offer");
      setLobby(false);

      const pc = new RTCPeerConnection();
      setSendingPc(pc);

      if (localAudioTrack) pc.addTrack(localAudioTrack);
      if (localVideoTrack) pc.addTrack(localVideoTrack);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            roomId,
            type: "sender",
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        const sdp = await pc.createOffer();
        await pc.setLocalDescription(sdp);
        socket.emit("offer", { sdp, roomId });
      };
    });

    socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
      setLobby(false);

      const pc = new RTCPeerConnection();
      setReceivingPc(pc);

      await pc.setRemoteDescription(remoteSdp);
      const sdp = await pc.createAnswer();
      await pc.setLocalDescription(sdp);

      socket.emit("answer", { sdp, roomId });
    });

    socket.on("answer", async ({ sdp: remoteSdp }) => {
      setLobby(false);

      setSendingPc((pc) => {
        pc?.setRemoteDescription(remoteSdp);
        return pc;
      });
    });

    socket.on("lobby", () => {
      setLobby(true);
    });

    socket.on("add-ice-candidate", ({ candidate, type }) => {
      if (type === "sender") {
        setReceivingPc((pc) => {
          pc?.addIceCandidate(new RTCIceCandidate(candidate));
          return pc;
        });
      } else {
        setSendingPc((pc) => {
          pc?.addIceCandidate(new RTCIceCandidate(candidate));
          return pc;
        });
      }
    });

  }, [name]);

  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
      localVideoRef.current.play();
    }
  }, [localVideoTrack]);

  return (
    <>
      Hi {name}
      <video autoPlay muted width={400} height={400} ref={localVideoRef} />
      {lobby ? "Waiting to connect you to someone" : null}
      
    </>
  );
};

export default Room;
