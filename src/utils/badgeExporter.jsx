import { QR_BASE_URL, SECTOR_CONFIG_NL, LOGO_URL, countryOptions, countryMap } from "../data/config";
import QRCode from "qrcode";

export async function createBadgePng(profile) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    /*
      Same badge ratio as the Logo component:
      397 × 559, scaled up for a crisp downloadable PNG.
    */
    const SCALE = 3;
    const W = 397;
    const H = 560;
    const STRIP = 22;

    canvas.width = W * SCALE;
    canvas.height = H * SCALE;

    ctx.scale(SCALE, SCALE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const sector = normalizeSector(profile.sector);
    const cfg = SECTOR_CONFIG_NL[sector] || SECTOR_CONFIG_NL.consultancy;

    const attendee = normalizeProfile(profile);

    await loadFonts();

    function normalizeSector(value) {
  const raw = String(value || "").trim().toLowerCase();

  if (!raw) return "consultancy";

  return SECTOR_CONFIG_NL[raw] ? raw : "consultancy";
}

    function normalizeProfile(value) {
      const fullName = String(value.name || "").trim();
      const nameParts = fullName.split(/\s+/).filter(Boolean);

      const firstName =
        value.firstName ||
        value.first_name ||
        nameParts[0] ||
        "";

      const lastName =
        value.lastName ||
        value.last_name ||
        nameParts.slice(1).join(" ") ||
        "";

      const country =
        value.countryName ||
        value.country_name ||
        countryFromCode(value.country) ||
        value.country ||
        "";

      const slug = value.slug || "";

      return {
        firstName,
        lastName,
        company: value.company || "",
        country,
        countryCode: value.country || "",
        sector,
        slug,
        url:
          value.url ||
          value.qrUrl ||
          value.qr_url ||
          (slug ? `${QR_BASE_URL}${slug}` : ""),
      };
    }

    function countryFromCode(code) {
      const c = String(code || "").trim().toLowerCase();

      if (code.length > 3){
        return code;
      }

      return countryMap[c] || "";
    }

    async function loadFonts() {
      if (!document.fonts?.load) return;

      try {
        await Promise.all([
          document.fonts.load("400 12px Poppins"),
          document.fonts.load("500 20px Poppins"),
          document.fonts.load("600 12px Poppins"),
          document.fonts.load("700 12px Poppins"),
          document.fonts.load("800 74px Poppins"),
        ]);

        await document.fonts.ready;
      } catch {
        /*
          If Google Fonts are blocked or not loaded, the browser will fall back
          to a system sans-serif font and the badge will still download.
        */
      }
    }

    function font(weight, size) {
      return `${weight} ${size}px Poppins, Arial, sans-serif`;
    }

    function roundedRectPath(x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function fillRoundedRect(x, y, w, h, r, fill) {
      roundedRectPath(x, y, w, h, r);
      ctx.fillStyle = fill;
      ctx.fill();
    }

    function strokeRoundedRect(x, y, w, h, r, stroke, lineWidth = 1) {
      roundedRectPath(x, y, w, h, r);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    function drawText(text, x, y, options = {}) {
      const {
        size = 12,
        weight = 400,
        color = "#111111",
        align = "left",
        baseline = "alphabetic",
        maxWidth,
        letterSpacing = 0,
      } = options;

      ctx.save();
      ctx.font = font(weight, size);
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = baseline;

      const value = String(text || "");

      if (false) {
        let currentX = x;

        for (const char of value) {
          ctx.fillText(char, currentX, y);
          currentX += ctx.measureText(char).width + letterSpacing;
        }
      } else if (maxWidth) {
        drawFittedText(value, x, y, maxWidth, size, weight);
      } else {
        ctx.fillText(value, x, y);
      }

      ctx.restore();
    }

    function drawFittedText(text, x, y, maxWidth, size, weight) {
      let display = String(text || "");

      ctx.font = font(weight, size);

      if (ctx.measureText(display).width <= maxWidth) {
        ctx.fillText(display, x, y);
        return;
      }

      while (display.length > 1 && ctx.measureText(`${display}…`).width > maxWidth) {
        display = display.slice(0, -1);
      }

      ctx.fillText(`${display}…`, x, y);
    }

    function drawLine(x1, y1, x2, y2, color, dashed = false) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      if (dashed) ctx.setLineDash([4, 4]);

      ctx.stroke();
      ctx.restore();
    }

    function loadImage(src) {
      return new Promise((resolve) => {
        if (!src) {
          resolve(null);
          return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    }

    function drawLinearGradientRect(x, y, w, h, stops) {
      const gradient = ctx.createLinearGradient(x, y, x, y + h);

      stops.forEach(([offset, color]) => {
        gradient.addColorStop(offset, color);
      });

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w, h);
    }

    async function drawCountryFlag(code, x, y, size = 26) {
  const c = String(code || "").trim().toLowerCase();

  if (!c) return;

  const img = await loadImage(`/flags/${c}.svg`);

  ctx.save();

  const h = Math.round(size * 0.67);

  if (img) {
    ctx.drawImage(img, x, y, size, h);
  } else {
    // fallback (in case svg not found)
    ctx.fillStyle = "#C4C0B8";
    ctx.fillRect(x, y, size, h);
  }

  ctx.restore();
}

    function drawBadgeShadow() {
      // return;
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.14)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      fillRoundedRect(0, 0, W, H, 10, "#F2F5F8");  //"#F8F7F4"
      ctx.restore();
    }

    function drawWrappedFirstName(text, x, y, maxWidth) {
  const value = String(text || "");
  let size = 74;

  ctx.save();

// ctx.fillStyle = "rgba(9, 156, 248, 0.16)"; // blue with low opacity overlay
// ctx.fillRect(0, 0, W, H);
// ctx.restore();


  ctx.fillStyle = "#111111";
  ctx.textAlign = "left"; // ✅ change
  ctx.textBaseline = "alphabetic";
  ctx.font = font(800, size);

  while (size > 44 && ctx.measureText(value).width > maxWidth) {
    size -= 2;
    ctx.font = font(800, size);
  }

  ctx.fillText(value, x, y); // x is now left edge
  ctx.restore();
}

function drawCoverImage(img) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = W / H;

  let sx, sy, sw, sh;

  if (imgRatio > canvasRatio) {
    // image is wider
    sh = img.naturalHeight;
    sw = sh * canvasRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    // image is taller
    sw = img.naturalWidth;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
}


    ctx.clearRect(0, 0, W, H);

    drawBadgeShadow();

    ctx.save();
    roundedRectPath(0, 0, W, H, 10);
    ctx.clip();

    var bgImg = undefined;

    // bgImg = await loadImage("/background.jpg");

if (bgImg) drawCoverImage(bgImg);
else {
  // ctx.fillStyle = "#F2F5F8"; lighter
  ctx.fillStyle = "#E3ECF8";
  ctx.fillRect(0, 0, W, H);
}

    /*
      Sector strip.
    */
    drawLinearGradientRect(0, 0, STRIP, H, [
      [0, cfg.color],
      [1, `${cfg.color}E0`],
    ]);

    drawLinearGradientRect(0, 0, STRIP, H * 0.35, [
      [0, "rgba(255,255,255,0.18)"],
      [1, "rgba(255,255,255,0)"],
    ]);

    /*
      Rotated sector label.
    */
    ctx.save();
    ctx.translate(STRIP / 2, H - 80);
    ctx.rotate(-Math.PI / 2);
    drawText((cfg.label || sector), 0, 0, {
  size: 8,
  weight: 700,
  color: "rgba(255,255,255,0.7)",
  align: "center",
  baseline: "middle",
  letterSpacing: 1.4,
});
    ctx.restore();

    /*
      Main content area.
    */
    const contentX = STRIP + 22;
    const contentW = W - STRIP - 44;
    const contentRight = contentX + contentW;

    /*
      Lanyard zone.
    */
    const lanyardH = 52;
    // drawLine(contentX, lanyardH, contentRight, lanyardH, "#DDD9CF", true);
    drawLine(contentX, lanyardH, contentRight, lanyardH, "#BACADF", true);

    ctx.save();
    ctx.beginPath();
    ctx.arc(STRIP + contentW / 2 + 22, 26, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#EDE9DF";
    ctx.fill();

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#CBC6BA";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    /*
      Header.
    */
    const headerTop = 68;
    const headerBottom = 122;

    drawText("IAMD Symposium", contentX, headerTop + 17, {
      size: 20,
      weight: 500,
      color: "#161412",
      baseline: "alphabetic",
      maxWidth: contentW - 88,
    });

    drawText("NETWERKEVENEMENT · 2026", contentX, headerTop + 37, {
      size: 9,
      weight: 600,
      color: "#ACA79E",
      baseline: "alphabetic",
      letterSpacing: 1.4,
    });

   const logo2Img = await loadImage("/logonltr.png");
    const logoImg = await loadImage("/logo.svg");

const logoMaxW = 68;
const logoMaxH = 38;
const logoGap = 6; // space between top and bottom logo

let topLogoW = 0;
let topLogoH = 0;
let bottomLogoW = 0;
let bottomLogoH = 0;

// TOP LOGO = logo2Img / logonl.png
if (logo2Img) {
  const ratio = Math.min(
    logoMaxW / logo2Img.naturalWidth,
    logoMaxH / logo2Img.naturalHeight
  );

  topLogoW = logo2Img.naturalWidth * ratio;
  topLogoH = logo2Img.naturalHeight * ratio;
}

// BOTTOM LOGO = logoImg / logo.svg
if (logoImg) {
  const ratio2 = Math.min(
    logoMaxW / logoImg.naturalWidth,
    logoMaxH / logoImg.naturalHeight
  );

  bottomLogoW = logoImg.naturalWidth * ratio2;
  bottomLogoH = logoImg.naturalHeight * ratio2;
}

const logoRightX = contentRight;

if (logo2Img) {
  ctx.drawImage(
    logo2Img,
    (logoRightX - bottomLogoW)-12,
    (headerTop)-8,
    topLogoW+20,
    topLogoH+8
  );
}

if (logoImg) {
  ctx.drawImage(
    logoImg,
    (logoRightX - bottomLogoW) - 11,
    (headerTop + topLogoH + logoGap)-2,
    bottomLogoW,
    bottomLogoH
  );
}

    // drawLine(contentX, headerBottom, contentRight, headerBottom, "#E4DED4");
    drawLine(contentX, headerBottom, contentRight, headerBottom, "#BACADF");

    /*
      Name section.
    */
    const centerX = contentX + contentW / 2;
    drawWrappedFirstName(attendee.firstName, contentX, 200, contentW);

    const detailsY = 230;

ctx.save();

const lastNameText = String(attendee.lastName || "");
const companyText = String(attendee.company || "");

let currentX = contentX;

// Last name
drawText(lastNameText, currentX, detailsY, {
  size: 16,
  weight: 700,
  color: "#242220",
  baseline: "middle",
  maxWidth: contentW * 0.5,
});

ctx.font = font(700, 16);
currentX += Math.min(ctx.measureText(lastNameText).width, contentW * 0.5) + 8;

// Dot
drawText("·", currentX, detailsY, {
  size: 16,
  weight: 400,
  color: "#C8C3B6",
  baseline: "middle",
});

currentX += 10;

// Company
drawText(companyText, currentX, detailsY, {
  size: 16,
  weight: 400,
  color: "#706B63",
  baseline: "middle",
  maxWidth: contentW * 0.5,
});

ctx.restore();
    const nameDividerY = 260;
    const nameGradient = ctx.createLinearGradient(contentX, 0, contentRight, 0);
    // nameGradient.addColorStop(0, "#E0DBD0");
    nameGradient.addColorStop(0, "#BACADF");
    nameGradient.addColorStop(0.8, "rgba(224,219,208,0)");
    ctx.fillStyle = nameGradient;
    ctx.fillRect(contentX, nameDividerY, contentW, 1);

    /*
      QR section.
    */
    const qrValue = attendee.url || "";
    const qrSize = 160;
    const qrPadding = 14;
    const qrBoxSize = qrSize + qrPadding * 2;
    const qrBoxX = contentX + (contentW - qrBoxSize) / 2;
    const qrBoxY = 290;

    fillRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 8, "#FFFFFF");
    strokeRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 8, "#E4DFD5", 1.5);

    const qrCanvas = document.createElement("canvas");

    await QRCode.toCanvas(qrCanvas, qrValue, {
      width: qrSize,
      margin: 0,
      errorCorrectionLevel: "M",
      color: {
        dark: cfg.color,
        light: "#FFFFFF",
      },
    });

    ctx.drawImage(qrCanvas, qrBoxX + qrPadding, qrBoxY + qrPadding, qrSize, qrSize);

    /*
      Footer.
    */
   
      const qrBottom = qrBoxY + qrBoxSize;
      const footerGap = 18; // adjust for more/less space
      const footerTop = qrBottom + footerGap;

    // drawLine(contentX, footerTop, contentRight, footerTop, "#E4DED4");
    drawLine(contentX, footerTop, contentRight, footerTop, "#BACADF");

    /*
      Country flag box.
    */
    const footerY = footerTop + 36;
    const flagBoxX = contentX;
    const flagBoxY = footerY - 13;
    const flagBoxW = 34;
    const flagBoxH = 22;

    fillRoundedRect(flagBoxX, flagBoxY, flagBoxW, flagBoxH, 3, "#FFFFFF");
    strokeRoundedRect(flagBoxX, flagBoxY, flagBoxW, flagBoxH, 3, "#E4DED4", 1);

    await drawCountryFlag(attendee.countryCode, flagBoxX + 4, flagBoxY + 4, 26);

    drawText(attendee.country, flagBoxX + flagBoxW + 9, footerY, {
      size: 12,
      weight: 600,
      color: "#5C5751",
      baseline: "middle",
      maxWidth: 120,
    });

    /*
      Sector pill.
    */
    const pillText = (cfg.label || sector).toUpperCase();

    ctx.save();
    ctx.font = font(700, 10);
    const pillTextW = ctx.measureText(pillText).width + 8;
    ctx.restore();

    const pillH = 28;
    const pillW = pillTextW + 38;
    const pillX = contentRight - pillW;
    const pillY = footerY - pillH / 2;

    fillRoundedRect(pillX, pillY, pillW, pillH, 100, cfg.light);
    strokeRoundedRect(pillX, pillY, pillW, pillH, 100, `${cfg.color}60`, 1.5);

    ctx.beginPath();
    ctx.arc(pillX + 14, pillY + pillH / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = cfg.color;
    ctx.fill();

    drawText(pillText, pillX + 25, pillY + pillH / 2 + 1, {
      size: 10,
      weight: 700,
      color: cfg.color,
      baseline: "middle",
      letterSpacing: 1,
    });

    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create badge PNG."));
            return;
          }

          resolve(blob);
        },
        "image/png",
        1
      );
    });
  }