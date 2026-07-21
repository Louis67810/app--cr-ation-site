import "server-only";
import { ImageResponse } from "next/og";

const THUMBNAIL_WIDTH = 1592;
const THUMBNAIL_HEIGHT = 1015;

function shortenTitle(value: string, maxLength = 72) {
  const title = value.trim().replace(/\s+/g, " ");
  if (title.length <= maxLength) return title;
  const shortened = title.slice(0, maxLength + 1).replace(/\s+\S*$/, "");
  return `${shortened || title.slice(0, maxLength).trim()}…`;
}

function titleSize(title: string) {
  if (title.length <= 34) return 82;
  if (title.length <= 52) return 70;
  return 58;
}

export async function generateArticleThumbnail(input: {
  backgroundImageUrl: string;
  articleTitle: string;
  logoLabel?: string;
  logoImageUrl?: string;
}) {
  const title = shortenTitle(input.articleTitle);
  const logoLabel = input.logoLabel?.trim();
  const showLogo = Boolean(
    input.logoImageUrl ||
      (logoLabel && logoLabel.toLocaleLowerCase("fr") !== "logo"),
  );
  const response = new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#d8ded6",
      }}
    >
      {/* Satori requires the explicit HTML image element for remote assets. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={input.backgroundImageUrl}
        alt=""
        width={THUMBNAIL_WIDTH}
        height={THUMBNAIL_HEIGHT}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          background: "rgba(0, 24, 30, 0.12)",
        }}
      />
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          position: "absolute",
          left: 315,
          top: 275,
          width: 961,
          height: 512,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: showLogo ? 41 : 0,
          padding: "95px 95px 109px",
          border: "2px solid rgba(255,255,255,0.13)",
          borderRadius: 28,
          background: "#003441",
          boxShadow: "0 26px 70px rgba(0,0,0,0.18)",
        }}
      >
        {showLogo ? (
          <div
            style={{
              display: "flex",
              minWidth: 204,
              height: 68,
              alignItems: "center",
              justifyContent: "center",
              padding: "0 28px",
              borderRadius: 14,
              color: "rgba(255,255,255,0.88)",
              background: "rgba(255,255,255,0.11)",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.03em",
            }}
          >
            {input.logoImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={input.logoImageUrl}
                alt=""
                width={160}
                height={48}
                style={{
                  width: 160,
                  height: 48,
                  objectFit: "contain",
                }}
              />
            ) : (
              logoLabel
            )}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            width: 770,
            color: "#ffffff",
            fontFamily: "serif",
            fontSize: titleSize(title),
            fontWeight: 400,
            lineHeight: 1.18,
            letterSpacing: "-0.06em",
            textAlign: "center",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {title}
        </div>
      </div>
    </div>,
    {
      width: THUMBNAIL_WIDTH,
      height: THUMBNAIL_HEIGHT,
    },
  );

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    mediaType: "image/png",
  };
}
