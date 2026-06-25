# 🔌 Beatpad API Contract

This document defines the exact structure of the data flowing between our React Frontend and our Express Backend. Having this defined prevents confusion when building the frontend!

## 1. Create a Sound Kit
**Endpoint:** `POST /api/kits/create`
**Purpose:** Uploads audio files and saves the pad configuration to the database.
**Content-Type:** `multipart/form-data` (Because we are sending files)

### Request Structure (What the Frontend Sends)
The frontend sends a `FormData` object containing:
- `sounds`: An array of binary `.wav` or `.mp3` files (Max 16).
- `pads`: A JSON stringified array of the pad configurations (excluding the sound URLs, since those haven't been generated yet).

*Example of the `pads` JSON string:*
```json
"[
  { \"padIndex\": 1, \"keyBinding\": \"Q\", \"config\": { \"cut\": \"cutOnNext\", \"trigger\": \"press\" } },
  { \"padIndex\": 2, \"keyBinding\": \"W\", \"config\": { \"cut\": \"playTillEnd\", \"trigger\": \"click\" } }
]"
```

### Response Structure (What the Backend Replies)
**Status: 201 Created**
```json
{
  "msg": "kit saved succesfully",
  "kit": {
    "_id": "mongo_object_id",
    "id": "a1b2c3",
    "pads": [
      {
        "padIndex": 1,
        "keyBinding": "Q",
        "soundUrl": "/uploads/17192837373-kick.wav",
        "config": {
          "cut": "cutOnNext",
          "trigger": "press"
        }
      }
    ]
  }
}
```

---

## 2. Fetch a Sound Kit
**Endpoint:** `GET /api/kits/:id`
**Purpose:** Retrieves a saved kit using its unique 6-character ID.
**Content-Type:** `application/json`

### Request Structure
No body needed. Just the URL parameter (e.g., `GET /api/kits/a1b2c3`).

### Response Structure
**Status: 200 OK**
```json
{
  "_id": "mongo_object_id",
  "id": "a1b2c3",
  "pads": [
    {
      "padIndex": 1,
      "keyBinding": "Q",
      "soundUrl": "/uploads/17192837373-kick.wav",
      "config": {
        "cut": "cutOnNext",
        "trigger": "press"
      }
    }
  ]
}
```

**Status: 404 Not Found**
```json
{
  "msg": "Kit not found"
}
```
