type MediaType = "PHOTO" | "VIDEO";

export default function MediaPreview({
  src,
  mediaType,
  alt,
  className,
  loading,
}: {
  src: string;
  mediaType: MediaType;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  if (mediaType === "VIDEO") {
    return <video src={src} controls preload="metadata" className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading={loading ?? "lazy"} />
  );
}
