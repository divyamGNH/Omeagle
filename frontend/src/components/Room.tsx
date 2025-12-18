import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

const URL = "http://localhost:3000";

export const Room = ({
  name,
  localAudioTrack,
  localVideoTrack,
}: {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
}) => {
  const [lobby, setLobby] = useState(true);
  const [sendingPc, setSendingPc] = useState<any>(null);
  const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = io(URL);

    socket.on("send-offer", async ({ roomId }) => {
      setLobby(false);

      const pc = new RTCPeerConnection();
      setSendingPc(pc);

      if (localVideoTrack) pc.addTrack(localVideoTrack);
      if (localAudioTrack) pc.addTrack(localAudioTrack);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "sender",
            roomId,
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { sdp: offer, roomId });
      };
    });

    socket.on("offer", async ({ roomId, sdp }) => {
      setLobby(false);

      const pc = new RTCPeerConnection();
      setReceivingPc(pc);

      await pc.setRemoteDescription(sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      pc.ontrack = (e) => {
        if (!remoteVideoRef.current) return;

        let stream = remoteVideoRef.current.srcObject as MediaStream | null;
        if (!stream) {
          stream = new MediaStream();
          remoteVideoRef.current.srcObject = stream;
        }
        stream.addTrack(e.track);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "receiver",
            roomId,
          });
        }
      };

      socket.emit("answer", { roomId, sdp: answer });
    });

    socket.on("answer", ({ sdp }) => {
      sendingPc?.setRemoteDescription(sdp);
    });

    socket.on("add-ice-candidate", ({ candidate, type }) => {
      if (type === "sender") receivingPc?.addIceCandidate(candidate);
      else sendingPc?.addIceCandidate(candidate);
    });

    socket.on("lobby", () => setLobby(true));

    setSocket(socket);
  }, [localAudioTrack, localVideoTrack]);

  /* ================== LOCAL VIDEO ================== */
  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
      localVideoRef.current.play();
    }
  }, [localVideoTrack]);

  /* ================== UI ================== */
  return (
    <div className="w-screen h-screen bg-white flex flex-col text-sm text-gray-800">
      {/* Top Bar */}
      <div className="border-b border-gray-300 px-4 py-2 flex justify-between items-center">
        <div className="font-semibold">omegle</div>
        <div className="text-gray-600">
          You are now chatting with a random stranger.
        </div>
        <button className="text-gray-500 hover:text-black">×</button>
      </div>

      {/* Main */}
      <div className="flex-1 flex">
        {/* LEFT: Videos */}
        <div className="w-1/3 border-r border-gray-300 p-2 flex flex-col gap-2">
          {/* Stranger */}
          <div className="flex-1 border border-gray-300 bg-black relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {lobby && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                Connecting...
              </div>
            )}
          </div>

          {/* You */}
          <div className="flex-1 border border-gray-300 bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-gray-600">
              {lobby
                ? "Looking for someone you can chat with..."
                : "You're now connected. Say hi!"}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-300 p-2 flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 px-2 py-1 outline-none"
            />
            <button className="px-4 py-1 border border-gray-400 bg-gray-100 hover:bg-gray-200">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
