import { CartesiaClient } from "@cartesia/cartesia-js";
import type { StreamingResponse } from "@cartesia/cartesia-js/api";
import type Websocket from "@cartesia/cartesia-js/wrapper/Websocket";
import { z } from "zod";
import { TTSBase, type TTSGenerateJob } from "../base";

// Config
export const cartesiaTTSConfigSchema = z.object({
  apiKey: z.string().default(process.env.CARTESIA_API_KEY ?? ""),
  model: z.enum(["sonic-2", "sonic-turbo", "sonic"]).default("sonic-2"),
  language: z
    .enum([
      "en",
      "fr",
      "de",
      "es",
      "pt",
      "zh",
      "ja",
      "hi",
      "it",
      "ko",
      "nl",
      "pl",
      "ru",
      "sv",
      "tr",
    ])
    .default("en"),
  voiceId: z.string().default("e8e5fffb-252c-436d-b842-8879b84445b6"),
});

// Model
export class CartesiaTTS extends TTSBase<typeof cartesiaTTSConfigSchema> {
  #cartesia: CartesiaClient;
  #socket: Websocket;
  #initializedJobsIds: string[] = [];

  constructor(config: z.input<typeof cartesiaTTSConfigSchema>) {
    super(cartesiaTTSConfigSchema, config);
    if (!config.apiKey)
      throw new Error(
        "CARTESIA_API_KEY environment variable or config.apiKey must be provided to use this model.",
      );
    this.#cartesia = new CartesiaClient({ apiKey: config.apiKey });
    this.#socket = this.#cartesia.tts.websocket({
      container: "raw",
      encoding: "pcm_s16le",
      sampleRate: 16_000,
    });
  }

  // biome-ignore lint/suspicious/useAwait: need async to match TTSBase abstract method
  async generate(): Promise<TTSGenerateJob> {
    // Create a new generation job
    const job = this.createGenerateJob();

    // Listen to job cancellation, and properly close the socket
    job.raw.abortController.signal.addEventListener("abort", () => {
      this.#socket.socket?.send(JSON.stringify({ context_id: job.id, cancel: true }));
    });

    return job;
  }

  #handleWebSocketMessage(job: TTSGenerateJob, msgString: string): void {
    // If the job has been aborted, ignore incoming messages
    if (job.raw.abortController.signal.aborted) return;

    // Parse and forward the message chunk
    const msg = JSON.parse(msgString) as StreamingResponse;

    // Handle "content" chunks
    if (msg.type === "chunk") {
      const buf = Buffer.from(msg.data, "base64");
      const pcmBytes = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
      job.raw.receiveChunk({ type: "content", voiceChunk: pcmBytes });
    }
    // Handle "end" chunks
    else if (msg.type === "done") {
      job.raw.receiveChunk({ type: "end" });
    }
    // Handle "error" chunks
    else if (msg.type === "error") {
      job.raw.receiveChunk({ type: "error", error: msg.error });
    }
  }

  // biome-ignore lint/suspicious/useAwait: need async to match TTSBase abstract method
  protected async _onGeneratePushText(
    job: TTSGenerateJob,
    text: string,
    isLast = false,
  ): Promise<void> {
    // If the job has already been initialized, continue it
    const response = this.#socket.send({
      contextId: job.id,
      modelId: "sonic-2",
      language: this.config.language,
      voice: { mode: "id", id: this.config.voiceId },
      transcript: text,
      outputFormat: {
        container: "raw",
        encoding: "pcm_s16le",
        sampleRate: 16_000,
      },
      continue: !isLast,
      maxBufferDelayMs: 100,
    });

    if (!this.#initializedJobsIds.includes(job.id)) {
      this.#initializedJobsIds.push(job.id);
      response
        .then((ws) => {
          ws.on("message", (msgString: string) => this.#handleWebSocketMessage(job, msgString));
        })
        .catch((error) => {
          job.raw.receiveChunk({ type: "error", error: error.message });
        });
    }
  }
}
