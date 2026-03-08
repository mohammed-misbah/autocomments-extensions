chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.type !== "generate") return;

  fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5:3b",
      prompt: request.prompt,
      stream: false,
      num_predict: 50,
      temperature: 0.9,
      top_p: 0.9
    })
  })
  .then(res => res.json())
  .then(data => {
    sendResponse({ success: true, text: (data.response || "").trim() });
  })
  .catch(err => {
    sendResponse({ success: false, error: err.toString() });
  });

  return true;
});