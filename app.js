import express from "express";
import serverless from "serverless-http";
import multer from "multer";
import Replicate from "replicate";
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
dotenv.config();

const app = express();
const port = 3000;

const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

app.post("/extract", upload.single("image"), async (req, res) => {
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
      userAgent: "https://www.npmjs.com/package/create-replicate",
    });
    const image = req.file;
    const model =
      "ibm-granite/granite-vision-3.2-2b:2dd748835ec71ee87ec3f6d7d63aff63b276f0cf903c5afcaf57f9f3ca99d7a8";
    const input = {
      image: await readFile(image.path),
      top_p: 0.9,
      prompt: `Describe this image, If the file contains an Indonesian National ID (KTP), extract the relevant information such as provinsi, kabupaten, nik, nama, tempat_tgl_lahir, jenis_kelamin, golongan_darah, alamat, rt_rw, kelurahan, kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan, berlaku_hingga and return it in the JSON format using lowercase and snake_case, if the uploaded file is not an Indonesian ID (KTP), skip processing and return a json message: 'File skipped — not a valid Indonesian ID.'`,
      max_tokens: 512,
      temperature: 0.6,
      system_prompt:
        "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.",
    };

    const output = await replicate.run(model, { input });
    const result = output.join("");
    res.json(JSON.parse(result));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

export const handler = serverless(app);