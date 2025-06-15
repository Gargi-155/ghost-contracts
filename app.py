from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image
import pdfplumber
import os
import tempfile

app = Flask(__name__)
CORS(app)

pytesseract.pytesseract.tesseract_cmd = r"D:\Fake Catcher\Tesseract-OCR\tesseract.exe"  # update if needed

@app.route("/analyze", methods=["POST"])
def analyze():
    extracted_text = ""

    if "file" in request.files:
        file = request.files["file"]
        ext = file.filename.split(".")[-1].lower()

        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as temp:
            file.save(temp.name)

            if ext == "pdf":
                with pdfplumber.open(temp.name) as pdf:
                    extracted_text = "\n".join([page.extract_text() or "" for page in pdf.pages])
            elif ext in ["png", "jpg", "jpeg"]:
                img = Image.open(temp.name)
                extracted_text = pytesseract.image_to_string(img)
            else:
                extracted_text = file.read().decode("utf-8")

    elif "text" in request.form:
        extracted_text = request.form["text"]
    else:
        return jsonify({"error": "No input provided"}), 400

    analysis = []
    if "terminate" in extracted_text.lower():
        analysis.append({
            "title": "Termination Clause",
            "summary": "This clause allows the company to end the agreement anytime.",
            "risk_level": "high"
        })

    if "non-compete" in extracted_text.lower():
        analysis.append({
            "title": "Non-Compete Clause",
            "summary": "This limits your job opportunities after leaving.",
            "risk_level": "medium"
        })

    return jsonify({
        "extracted_text": extracted_text.strip(),
        "analysis": analysis
    })

if __name__ == "__main__":
    app.run(debug=True)
