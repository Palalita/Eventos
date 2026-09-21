// Componente compartido para mostrar una foto o video de una PhotoRequest,
// sin importar si viene de la galería pública (app/page.tsx), la lista de
// pendientes del admin (app/PendingList.tsx) o /admin/invitados. Como el
// `src` casi siempre es la ruta protegida /api/fotos/[id] (no la URL de Blob
// directa), no hace falta ser componente de cliente ni Server Component
// especial: solo decide qué tag de HTML renderizar según el tipo.
type MediaType = "PHOTO" | "VIDEO";

export default function MediaPreview({
  src,
  mediaType,
  alt,
  className,
  loading,
  autoPlay,
}: {
  src: string;
  mediaType: MediaType;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  // Reproduce el video solo (sin dar play) en la galería pública. Los
  // navegadores exigen "muted" para permitir autoplay; se deja "controls"
  // para que se pueda pausar o subirle el volumen.
  autoPlay?: boolean;
}) {
  if (mediaType === "VIDEO") {
    return (
      <video
        src={src}
        controls
        preload="metadata"
        className={className}
        autoPlay={autoPlay}
        muted={autoPlay}
        loop={autoPlay}
        playsInline={autoPlay}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading={loading ?? "lazy"} />
  );
}
