import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter: FileRouter = {
  imageUploader: f({
    "image/jpeg": {
      maxFileSize: "4MB",
      maxFileCount: 2,
    },
    "image/png": {
      maxFileSize: "4MB",
      maxFileCount: 2,
    },
  }).onUploadComplete(async ({ metadata, file }) => {
    console.log("File URL:", file.ufsUrl);
    return { url: file.ufsUrl };
  }),
  pdfUploader: f({
    pdf: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(({ file }) => {
    console.log("Pdf upload complete");
    return { url: file.ufsUrl };
  }),
  csvUploader: f({
    "text/csv": {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(({ file }) => {
    console.log("CSV upload complete");
    return { url: file.ufsUrl };
  }),
  txtUploader: f({
    "text/plain": {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(({ file }) => {
    console.log("TXT upload complete");
    return { url: file.ufsUrl };
  }),
};

export const OurFileRouter = typeof ourFileRouter;
