# Vivid Platform: Comprehensive Cost Breakdown & Unit Economics

This document provides a complete, itemized cost breakdown for running **Vivid**—from raw script parsing to visual storyboard animatics, Google Cloud hosting, and final video motion film production.

---

## 1. Unit Economics & Pricing Model Overview

Vivid is designed with a **Tiered Serverless Architecture** to optimize costs without sacrificing visual quality.

- **Draft Animatic Phase**: Uses ultra-fast, low-cost LLM logic + multi-modal image generation + TTS dialogue. Storyboards and animatics are created for **pennies per project**.
- **Hero Video Motion Phase**: Image-to-Video (I2V) motion rendering is triggered **on-demand per shot**, preventing unnecessary GPU spend on unapproved scenes.
- **Serverless Hosting Phase**: Runs on Google Cloud Run's **Always Free Tier** ($0.00/month for low-to-medium usage).

---

## 2. Google Cloud Infrastructure & Hosting Costs

Google Cloud provides an **Always Free Tier** for core serverless infrastructure:

| Infrastructure Service | Free Tier Allowance (Every Month) | Paid Rate Beyond Free Tier | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Google Cloud Run (Web App Hosting)** | **2,000,000 HTTP requests**<br>360,000 GB-seconds CPU<br>180,000 GB-seconds RAM | $0.0000240 / vCPU-second<br>$0.0000025 / GB-second | **$0.00** (Free for up to ~2M visits/mo) |
| **Artifact Registry (Container Storage)** | **0.5 GB / month** | $0.10 / GB / month | **~$0.05 / mo** for image builds |
| **Google Cloud Storage (GCS Media)** | **5 GB / month**<br>5,000 Class A operations | $0.02 / GB / month | **$0.00** (Under 5GB media files) |
| **Firebase Firestore (Database)** | **50,000 reads / day**<br>20,000 writes / day | $0.06 / 100k reads | **$0.00** (Free Tier for dev & launch) |
| **Network Egress (Bandwidth Out)** | **1 GB / month** free | $0.12 / GB | **~$0.10 - $0.50** depending on traffic |

---

## 3. Itemized AI & Model Cost Breakdown

| Component / Pipeline Stage | Provider / Model Used | Pricing Rate | Average Cost per Frame / Shot |
| :--- | :--- | :--- | :--- |
| **1. Script Breakdown & Directing Logic** | Google Vertex AI (`gemini-3.1-flash-lite-preview`) | $0.075 / 1M Input Tokens<br>$0.30 / 1M Output Tokens | **~$0.0005** per script parse |
| **2. Production Bible Asset Generation** | `gemini-3.1-flash-image` / `imagen-3.0-generate-002` | $0.03 / image | **~$0.03** per character/set asset |
| **3. Storyboard Frame Keyframing** | `gemini-3.1-flash-image-preview` | $0.015 - $0.03 / 1K frame | **~$0.02** per frame |
| **4. Dialogue Voiceover TTS** | `gemini-2.5-flash-preview-tts` | $0.000015 / character | **~$0.0003** per dialogue line |
| **5. Video Motion (Image-to-Video)** | Wan 2.1 (14B / 1.3B) via Fal.ai / Replicate | $0.015 - $0.03 / 5s video clip | **~$0.02** per motion video shot |

---

## 4. Real-World Production Cost Examples (Including Hosting)

### Scenario A: 1-Minute Teaser Scene (6 Shots, 2 Characters, 1 Environment)
1. **Cloud Run Hosting & GCS Storage**: $0.00 (within Free Tier)
2. **Script Decomposition**: $0.0005
3. **Production Bible Assets** (2 Characters + 1 Location): $0.09
4. **6 Storyboard Keyframe Images**: $0.12
5. **6 Dialogue Voiceover Lines**: $0.002
6. **Draft Animatic Total**: **$0.21**
7. **Video Motion Rendering** (Selective 3 Action Shots): +$0.06
8. **Total Final Teaser Film Cost**: **~$27 cents**

---

### Scenario B: 5-Minute Short Film (30 Shots, 5 Characters, 3 Environments)
1. **Cloud Run Hosting & GCS Storage**: $0.00 (within Free Tier)
2. **Script Decomposition**: $0.002
3. **Production Bible Assets** (5 Characters + 3 Locations): $0.24
4. **30 Storyboard Keyframe Images**: $0.60
5. **30 Dialogue Voiceover Lines**: $0.01
6. **Draft Animatic Total**: **$0.85**
7. **Full Video Motion Render** (All 30 Shots): +$0.60
8. **Total 5-Minute Short Film Cost**: **~$1.45**

---

## 5. Cost Optimization Features Built into Vivid

1. **Multi-Modal Identity Caching**: Character turnarounds and Environment master plates are generated once, stored in GCS, and passed as multi-reference context to subsequent frames—eliminating the need to re-synthesize character reference sheets.
2. **Client-Side Animatic Stitching**: Animatics are compiled directly in the user's browser using `@ffmpeg/ffmpeg` (WASM), requiring **zero cloud server rendering fees** for video exports.
3. **On-Demand Motion Rendering**: Video motion generation is only invoked on shots approved by the director.
4. **Cloud Run Zero-Instance Scaling**: Cloud Run automatically scales to **0 instances** when inactive, so you pay **$0.00 when nobody is using the app**.

---

## 6. Environment Variables & API Key Configuration

To run Vivid with optimal pricing, configure the following keys in `.env.local`:

```env
# Required for Gemini Logic, Storyboarding, Image Synthesis & Audio TTS
GEMINI_API_KEY=your_gemini_api_key

# Optional Serverless GPU Keys for Low-Cost Image-to-Video Motion (Wan 2.1 / CogVideoX)
FAL_KEY=your_fal_ai_key
REPLICATE_API_TOKEN=your_replicate_token
```
