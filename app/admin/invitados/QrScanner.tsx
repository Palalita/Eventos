"use client";

import { useEffect, useRef, useState } from "react";
import { checkInByToken } from "@/app/actions/photos";

function extractToken(rawValue: string) {
  try {
    const url = new URL(rawValue);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? rawValue;
  } catch {
    return rawValue.trim();
  }
}

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [supported, setSupported] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const busyRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !("BarcodeDetector" in window)) {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!scanning || !supported) return;

    let stream: MediaStream | undefined;
    let stopped = false;
    let rafId: number;

    async function start() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

      const tick = async () => {
        if (stopped || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0 && !busyRef.current) {
            busyRef.current = true;
            const token = extractToken(codes[0].rawValue);
            const result = await checkInByToken(token);
            if (result.status === "ok") {
              setFeedback(`✓ Asistencia confirmada: ${result.name}`);
            } else if (result.status === "already") {
              setFeedback(`${result.name} ya había registrado su asistencia.`);
            } else {
              setFeedback("Código QR no reconocido.");
            }
            setTimeout(() => {
              busyRef.current = false;
            }, 2000);
          }
        } catch {
          // seguir intentando en el siguiente frame
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    start().catch(() => setFeedback("No se pudo acceder a la cámara."));

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning, supported]);

  async function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    const token = extractToken(manualToken);
    const result = await checkInByToken(token);
    if (result.status === "ok") {
      setFeedback(`✓ Asistencia confirmada: ${result.name}`);
    } else if (result.status === "already") {
      setFeedback(`${result.name} ya había registrado su asistencia.`);
    } else {
      setFeedback("Código no encontrado.");
    }
    setManualToken("");
  }

  return (
    <div className="card">
      <h2>Escanear invitación</h2>

      {supported ? (
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setScanning((s) => !s)}
          >
            {scanning ? "Detener cámara" : "Activar cámara"}
          </button>
          {scanning && <video ref={videoRef} className="qr-video" muted playsInline />}
        </>
      ) : (
        <p>
          Tu navegador no soporta escaneo por cámara. Usa el campo manual para
          pegar el código.
        </p>
      )}

      <form onSubmit={handleManualSubmit} className="manual-checkin">
        <input
          type="text"
          placeholder="Pega aquí el código o URL de la invitación"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Confirmar
        </button>
      </form>

      {feedback && <p className="form-success">{feedback}</p>}
    </div>
  );
}
