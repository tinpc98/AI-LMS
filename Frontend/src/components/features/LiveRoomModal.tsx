import React from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";

interface LiveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingRoomId: string;
  jwtToken: string;
  appId: string;
}

const LiveRoomModal: React.FC<LiveRoomModalProps> = ({
  isOpen,
  onClose,
  meetingRoomId,
  jwtToken,
  appId,
}) => {
  if (!isOpen || !jwtToken || !appId || !meetingRoomId) return null;

  const rawRoomName = meetingRoomId.trim();
  const fullRoomName = rawRoomName.startsWith(appId) ? rawRoomName : `${appId}/${rawRoomName}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl flex justify-between items-center mb-3 text-white">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          Lớp Học Trực Tuyến Bảo Mật (8x8 JaaS)
        </h3>
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all"
        >
          Rời phòng
        </button>
      </div>

      <div className="w-full max-w-6xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <JitsiMeeting
          domain="8x8.vc"
          roomName={fullRoomName}
          jwt={jwtToken}
          configOverwrite={{
            disableThirdPartyRequests: true,
            prejoinPageEnabled: false,
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
          }}
          onReadyToClose={onClose}
        />
      </div>
    </div>
  );
};


export default LiveRoomModal;