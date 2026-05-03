import { Document, Packer, Paragraph, ImageRun } from "docx";
import { saveAs } from "file-saver";

export async function exportBadgeToA6Docx(pngBlob, filename = "badge.docx") {
  const arrayBuffer = await pngBlob.arrayBuffer();

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 105 * 567,
              height: 148 * 567,
            },
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          },
        },

        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: arrayBuffer,
                transformation: {
                  width: 105 * 567,
                  height: 148 * 567,
                },
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}