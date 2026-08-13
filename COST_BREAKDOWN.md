# Vivid Platform: Comprehensive Cost Breakdown & Unit Economics

This document provides a complete, itemized cost breakdown for running **Vivid**—from raw script parsing to visual storyboard animatics and final video motion film production.

---

## 1. Unit Economics & Pricing Model Overview

Vivid is designed with a **Tiered Serverless Architecture** to optimize costs without sacrificing visual quality.

- **Draft Animatic Phase**: Uses ultra-fast, low-cost LLM logic + multi-modal image generation + TTS dialogue. Storyboards and animatics are created for **pennies per project**.
- **Hero Video Motion Phase**: Image-to-Video (I2V) motion rendering is triggered **on-demand per shot**, preventing unnecessary GPU spend on unapproved scenes.

---

## 2. Itemized Cost Breakdown by Component

| Component / Pipeline Stage | Provider / Model Used | Pricing Rate | Average Cost per Frame / Shot |
| :--- | :--- | :--- | :--- |
| **1. Script Breakdown & Directing Logic** | Google Vertex AI (`gemini-3.1-flash-lite-preview`) | $0.075 / 1M Input Tokens<br>$0.30 / 1M Output Tokens | **~$0.0005** per script parse |
| **2. Production Bible Asset Generation** | `gemini-3.1-flash-image` / `imagen-3.0-generate-002` | $0.03 / image | **~$0.03** per character/set asset |
| **3. Storyboard Frame Keyframing** | `gemini-3.1-flash-image-preview` | $0.015 - $0.03 / 1K frame | **~$0.02** per frame |
| **4. Dialogue Voiceover TTS** | `gemini-2.5-flash-preview-tts` | $0.000015 / character | **~$0.0003** per dialogue line |
| **5. Video Motion (Image-to-Video)** | Wan 2.1 (14B / 1.3B) via Fal.ai / Replicate | $0.015 - $0.03 / 5s video clip | **~$0.02** per motion video shot |
| **6. Media Asset Storage** | Google Cloud Storage (GCS) | $0.02 / GB / month | **<$0.001** per project |
| **7. Real-Time Metadata Sync** | Firebase Firestore | Free Tier (50k reads / 20k writes/day) | **$0.00** for initial scale |

---

## 3. Real-World Production Cost Examples

### Scenario A: 1-Minute Teaser Scene (6 Shots, 2 Characters, 1 Environment)
1. **Script Decomposition**: $0.0005
2. **Production Bible Assets** (2 Characters + 1 Location): $0.09
3. **6 Storyboard Keyframe Images**: $0.12
4. **6 Dialogue Voiceover Lines**: $0.002
5. **Draft Animatic Total**: **$0.21**
6. **Video Motion Rendering** (Selective 3 Action Shots): +$0.06
7. **Total Final Teaser Film Cost**: **~$0.27**

---

### Scenario B: 5-Minute Short Film (30 Shots, 5 Characters, 3 Environments)
1. **Script Decomposition**: $0.002
2. **Production Bible Assets** (5 Characters + 3 Locations): $0.24
3. **30 Storyboard Keyframe Images**: $0.60
4. **30 Dialogue Voiceover Lines**: $0.01
5. **Draft Animatic Total**: **$0.85**
6. **Full Video Motion Render** (All 30 Shots): +$0.60
7. **Total 5-Minute Short Film Cost**: **~$1.45**

---

### Scenario C: 15-Minute Short Film / Episode (90 Shots)
1. **Draft Animatic Total**: **~$2.50**
2. **Full Video Motion Render Total**: **~$4.30**

---

## 4. Cost Optimization Features Built into Vivid

1. **Multi-Modal Identity Caching**: Character turnarounds and Environment master plates are generated once, stored in GCS, and passed as multi-reference context to subsequent frames—eliminating the need to re-synthesize character reference sheets.
2. **Client-Side Animatic Stitching**: Animatics are compiled directly in the user's browser using `@ffmpeg/ffmpeg` (WASM), requiring **zero cloud server rendering fees** for video exports.
3. **On-Demand Motion Rendering**: Video motion generation is only invoked on shots approved by the director.

---

## 5. Environment Variables & API Key Configuration

To run Vivid with optimal pricing, configure the following keys in `.env.local`:

```env
# Required for Gemini Logic, Storyboarding, Image Synthesis & Audio TTS
GEMINI_API_KEY=your_gemini_api_key

# Optional Serverless GPU Keys for Low-Cost Image-to-Video Motion (Wan 2.1 / CogVideoX)
FAL_KEY=your_fal_ai_key
REPLICATE_API_TOKEN=your_replicate_token
```
