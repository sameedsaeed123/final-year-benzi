# Colab training — super simple steps

You do **not** upload the whole project. You only open **one notebook file** in Google Colab.

---

## Option A — Easiest (repo on GitHub)

### 1. Open Google Colab

Go to: **https://colab.research.google.com**

(Sign in with Google if asked.)

### 2. Open the notebook

Click this link (after your code is on GitHub):

**https://colab.research.google.com/github/sameedsaeed123/final-year-benzi/blob/main/fyp-ml-demos/finetune/BENZI_Colab_Train.ipynb**

**If link fails** → do Option B below.

### 3. Turn on GPU

- Top menu: **Runtime**
- Click **Change runtime type**
- **Hardware accelerator:** choose **T4 GPU**
- Click **Save**

### 4. Run everything

- Top menu: **Runtime**
- Click **Run all**
- Click **Run anyway** if it asks
- Wait ~2–3 hours (you can leave the tab open)

### 5. Download

At the end, your browser downloads:

- `benzi-empathetic-trained.zip`

Put it in **Downloads** on your Mac.

### 6. On Mac (after Colab finishes)

Open **Terminal** and run:

```bash
mkdir -p ~/benzi-models
cd ~/benzi-models
unzip ~/Downloads/benzi-empathetic-trained.zip -d benzi-empathetic-hf
cd benzi-empathetic-hf

cat > Modelfile << 'EOF'
FROM .
PARAMETER temperature 0.65
PARAMETER num_ctx 4096
SYSTEM You are BENZI AI. Support between therapy sessions. Not a therapist. Defer clinical topics to their therapist.
EOF

ollama create benzi-empathetic-trained -f Modelfile
```

In `benzi-server/.env` set:

```env
OLLAMA_MODEL=benzi-empathetic-trained
```

Restart `npm run dev`.

---

## Option B — Link does not work (upload notebook yourself)

### What to upload

**Only ONE file** from your Mac:

```
newrepo/fyp-ml-demos/finetune/BENZI_Colab_Train.ipynb
```

**Do NOT upload** the whole `newrepo` folder.

### Where to upload

1. Go to **https://colab.research.google.com**
2. Click **File** (top left)
3. Click **Upload notebook**
4. Choose **`BENZI_Colab_Train.ipynb`** from your computer
5. Then do steps 3–6 from Option A (GPU → Run all → download)

### If clone fails in notebook (private GitHub)

Upload a **zip** of the folder `fyp-ml-demos` (right-click folder → Compress):

1. In Colab left sidebar click **Files** (folder icon)
2. Click **Upload** (page icon)
3. Upload `fyp-ml-demos.zip`
4. Run in a new cell:

```python
!unzip -q fyp-ml-demos.zip
%cd fyp-ml-demos
```

Then run the rest of the notebook cells.

---

## You do NOT need Colab AI

Just **Run all**. The notebook already has all commands.

If you use **Colab’s AI chat**, paste the prompt from the next section.

---

## What you are NOT doing

| Wrong | Right |
|-------|--------|
| Upload entire `newrepo` | One `.ipynb` file OR use GitHub link |
| Train on Mac for 20 hours | Train on Colab GPU |
| Upload benzi-server | Only `fyp-ml-demos` zip if clone fails |
