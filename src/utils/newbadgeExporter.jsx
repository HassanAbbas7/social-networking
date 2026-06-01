import { QR_BASE_URL, SECTOR_CONFIG, LOGO_NEW_URL, countryOptions, countryMap } from "../data/config";
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
    const cfg = SECTOR_CONFIG[sector] || SECTOR_CONFIG.industry;

    const attendee = normalizeProfile(profile);

    await loadFonts();

    function normalizeSector(value) {
      value = value.toLowerCase().trim(); 
      const raw = String(value || "industry").trim();

      if (raw.toLowerCase() === "public") return "public";

      return SECTOR_CONFIG[raw] ? raw : "Industry";
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
        color = "#FFFFFF",
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

      if (letterSpacing > 0) {
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
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(x, y, size, h);
      }

      ctx.restore();
    }

    function drawBadgeShadow() {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0)";
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 12;
      fillRoundedRect(0, 0, W, H, 10, "#0A1628");
      ctx.restore();
    }

    // ── Updated: accepts a color parameter for dark-background support ──
    function drawWrappedFirstName(text, x, y, maxWidth, color = "#FFFFFF") {
      const value = String(text || "");
      let size = 72;

      ctx.save();
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = font(800, size);

      while (size > 44 && ctx.measureText(value).width > maxWidth) {
        size -= 2;
        ctx.font = font(800, size);
      }

      ctx.fillText(value, x, y);
      ctx.restore();
    }

    function drawCoverImage(img) {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = W / H;

      let sx, sy, sw, sh;

      if (imgRatio > canvasRatio) {
        sh = img.naturalHeight;
        sw = sh * canvasRatio;
        sx = (img.naturalWidth - sw) / 2;
        sy = 0;
      } else {
        sw = img.naturalWidth;
        sh = sw / canvasRatio;
        sx = 0;
        sy = (img.naturalHeight - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // START DRAWING
    // ─────────────────────────────────────────────────────────────────────────

    ctx.clearRect(0, 0, W, H);

    drawBadgeShadow();

    ctx.save();
    roundedRectPath(0, 0, W, H, 10);
    ctx.clip();

    // ── Background: dark blue wavy image with overlay ──
    const bgImg = await loadImage("/background.jpg");

    if (bgImg) {
      drawCoverImage(bgImg);
      // Dark overlay so text stays readable over the image
      // ctx.fillStyle = "rgba(0, 15, 45, 0.28)";
      // ctx.fillRect(0, 0, W, H);
    } else {
      // Fallback: dark blue gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#0D2240");
      bgGrad.addColorStop(0.6, "#071630");
      bgGrad.addColorStop(1, "#030C1C");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
    }

    /*
      Sector strip (left edge).
    */
    drawLinearGradientRect(0, 0, STRIP, H, [
      [0, cfg.color],
      [1, `${cfg.color}CC`],
    ]);

    drawLinearGradientRect(0, 0, STRIP, H * 0.35, [
      [0, "rgba(255,255,255,0.22)"],
      [1, "rgba(255,255,255,0)"],
    ]);

    /*
      Rotated sector label on the strip.
    */
    ctx.save();
    ctx.translate(STRIP / 2, H - 80);
    ctx.rotate(-Math.PI / 2);
    drawText(sector, 0, 0, {
      size: 8,
      weight: 700,
      color: "rgba(255,255,255,0.75)",
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
      Name section – white text on dark background.
    */
    drawWrappedFirstName(attendee.firstName, contentX, 141, contentW, "#FFFFFF");

    const detailsY = 171;

    ctx.save();

    const lastNameText = String(attendee.lastName || "");
    const companyText = String(attendee.company || "");

    let currentX = contentX + 4;

    // Last name – white bold
    drawText(lastNameText, currentX, detailsY, {
      size: 22,
      weight: 700,
      color: "#FFFFFF",
      baseline: "middle",
      maxWidth: contentW * 0.5,
    });

    ctx.font = font(700, 16);
    currentX += Math.min(ctx.measureText(lastNameText).width, contentW * 0.5) + 8;

    // Separator dot
    drawText("·", currentX, detailsY, {
      size: 16,
      weight: 400,
      color: "rgba(255,255,255,0.45)",
      baseline: "middle",
    });

    currentX += 30;

    // Company – lighter white
    drawText(companyText, currentX+20, detailsY, {
      size: 20,
      weight: 400,
      color: "rgba(255,255,255,0.75)",
      baseline: "middle",
      maxWidth: contentW * 0.5,
    });

    ctx.restore();

    /*
      QR section.
    */
    const qrValue = attendee.url || "";
    const qrSize = 170;
    const qrPadding = 14;
    const qrBoxSize = qrSize + qrPadding * 2;
    const qrBoxX = contentX + (contentW - qrBoxSize) / 2;
    const qrBoxY = 248;

    fillRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 8, "#FFFFFF");
    strokeRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 8, "rgba(255,255,255,0.6)", 1.5);

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
      Footer divider.
    */
    const qrBottom = qrBoxY + qrBoxSize;
    const footerGap = 18;
    const footerTop = qrBottom + footerGap;

    /*
      Footer layout:
        LEFT  – sector label (colored pill / text)
        RIGHT – logo image
    */
    const footerY = footerTop + 48;

    // ── BOTTOM LEFT: Sector label ──
    const pillText = sector.toUpperCase();

    ctx.save();
    ctx.font = font(700, 13);
    const pillTextW = ctx.measureText(pillText).width;
    ctx.restore();

    const pillH = 36;
    const pillW = pillTextW + 46;
    const pillX = contentX;
    const pillY = footerY - pillH / 2;

    fillRoundedRect(pillX, pillY, pillW, pillH, 100, `${cfg.color}22`);
    strokeRoundedRect(pillX, pillY, pillW, pillH, 100, `${cfg.color}80`, 1.5);

    ctx.beginPath();
    ctx.arc(pillX + 16, pillY + pillH / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = cfg.color;
    ctx.fill();

    drawText(pillText, pillX + 28, pillY + pillH / 2 + 1, {
      size: 13,
      weight: 700,
      color: cfg.color,
      baseline: "middle",
      letterSpacing: 1,
    });

    // ── BOTTOM RIGHT: Logo ──
    const logoImg = await loadImage(LOGO_NEW_URL);

    let logoRight = contentRight;

    if (logoImg) {
      // CHANGED: Increased from 100x56 to 140x75
      const logoMaxW = 140;
      const logoMaxH = 75;

      const ratio = Math.min(
        logoMaxW / logoImg.naturalWidth,
        logoMaxH / logoImg.naturalHeight
      );

      const logoW = logoImg.naturalWidth * ratio;
      const logoH = logoImg.naturalHeight * ratio;
      const logoX = logoRight - logoW;
      const logoTopY = footerY - logoH / 2;

      ctx.drawImage(logoImg, logoX, logoTopY, logoW, logoH);

      logoRight -= logoW + 8; // Slightly increased spacing between logos
    }


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