import { useEffect, useRef, useState } from "react";
import { speak } from "../utils/tts";

export default function CameraPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [timers, setTimers] = useState([]);

  // 카메라 켜기
  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        alert("카메라 권한을 확인해주세요.");
      }
    })();
    return () => stream && stream.getTracks().forEach(t => t.stop());
  }, []);

  // 캡처 → OCR 업로드
  const captureAndOCR = async () => {
    if (!videoRef.current) return;
    setBusy(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
      const form = new FormData();
      form.append("image", blob, "rx.jpg");

      const resp = await fetch("/api/ocr", { method: "POST", body: form });
      const json = await resp.json();
      setText(json.text || "");
    } catch (e) {
      console.error(e);
      alert("OCR 중 오류가 발생했어요.");
    } finally {
      setBusy(false);
    }
  };

  const requestNotifyPerm = async () => {
    if (!("Notification" in window)) return alert("알림 미지원 브라우저입니다.");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") alert("알림 권한이 허용되지 않았습니다.");
  };

  // 간단 알림 스케줄러 (앱이 떠 있을 때만 동작)
  const scheduleMedication = (minutesFromNow, title = "약 복용 알림") => {
    const ms = Math.max(0, minutesFromNow * 60 * 1000);
    const id = setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(title, { body: "설정된 시간입니다. 복용을 잊지 마세요." });
      } else {
        alert("[알림] 복용 시간입니다.");
      }
    }, ms);
    setTimers((prev) => [...prev, id]);
  };

  return (
    <div style={{padding:"12px"}}>
      <div className="toolbar">
        <button className="btn" onClick={requestNotifyPerm}>알림 권한 요청</button>
        <button className="btn" onClick={()=>scheduleMedication(60)}>1시간 후 복용 알림</button>
        <button className="btn" onClick={()=>scheduleMedication(12*60, "저녁 약 알림")}>12시간 후 알림</button>
      </div>

      <div className="card">
        <video ref={videoRef} autoPlay playsInline style={{width:"100%",borderRadius:12}} />
        <canvas ref={canvasRef} style={{display:"none"}} />
        <div className="toolbar">
          <button className="btn primary" disabled={busy} onClick={captureAndOCR}>
            {busy ? "분석 중..." : "촬영 + OCR"}
          </button>
          <button className="btn" onClick={()=>text && speak(text)}>읽기 시작 (TTS)</button>
        </div>
      </div>

      <div className="card">
        <div style={{marginBottom:8, fontWeight:600}}>OCR 결과</div>
        <textarea className="textarea" value={text} onChange={e=>setText(e.target.value)} />
      </div>
    </div>
  );
}
