const fileInput = document.getElementById("fileInput");
const textInput = document.getElementById("textInput");
const fileNameEl = document.getElementById("fileName");
const removeBtn = document.getElementById("removeFileBtn");
const filePreview = document.getElementById("filePreview");
const resultsSection = document.getElementById("results");
const rawText = document.getElementById("rawText");
const resultsContainer = document.querySelector(".results-container");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  filePreview.innerHTML = "";
  if (!file) return;

  const validTypes = ["application/pdf", "image/png", "image/jpeg", "text/plain"];
  if (!validTypes.includes(file.type)) {
    alert("❌ Invalid file type. Only PDF, PNG, JPG, JPEG, TXT allowed.");
    fileInput.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("❌ File too large. Max 5MB allowed.");
    fileInput.value = "";
    return;
  }

  fileNameEl.textContent = `📎 ${file.name}`;
  removeBtn.style.display = "block";

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  } else if (file.type === "application/pdf") {
    const blobURL = URL.createObjectURL(file);
    filePreview.innerHTML = `<embed src="${blobURL}" type="application/pdf" width="100%" height="250px"/>`;
  } else {
    filePreview.innerHTML = "<p style='color:#9ca3af;'>📄 Text file selected. No preview available.</p>";
  }
});

removeBtn.addEventListener("click", () => {
  fileInput.value = "";
  fileNameEl.textContent = "";
  filePreview.innerHTML = "";
  removeBtn.style.display = "none";
});

function highlightRisks(text, analysis) {
  let highlightedText = text;
  if (!analysis || analysis.length === 0) return text;

  analysis.forEach(item => {
    const keyword = item.title.toLowerCase().split(" ")[0];
    const regex = new RegExp(`\\b(${keyword})\\b`, "gi");
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });

  return highlightedText;
}

async function analyzeInput() {
  const file = fileInput.files[0];
  const text = textInput.value.trim();
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  } else if (text) {
    formData.append("text", text);
  } else {
    alert("Please upload a file or paste contract text.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Failed to analyze contract.");

    const data = await response.json();
    rawText.innerHTML = highlightRisks(data.extracted_text || "", data.analysis);

    resultsContainer.innerHTML = "";
    if (data.analysis && data.analysis.length > 0) {
      data.analysis.forEach(item => {
        const card = document.createElement("div");
        card.className = "result-card " + (item.risk_level || "low");
        card.innerHTML = `<strong>${item.title}</strong><p>${item.summary}</p>`;
        resultsContainer.appendChild(card);
      });
    } else {
      resultsContainer.innerHTML = "<p>No risky clauses found.</p>";
    }

    resultsSection.style.display = "block";
  } catch (error) {
    alert("Error: " + error.message);
  }
}
