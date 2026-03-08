let activeEditor = null;

/* Track focused editor */
document.addEventListener("focusin", function (e) {
  if (
    e.target &&
    e.target.getAttribute &&
    e.target.getAttribute("contenteditable") === "true"
  ) {
    activeEditor = e.target;
  }
});

/* Clean LinkedIn post text */
function extractPostText(post) {

  const description = post.querySelector(".feed-shared-update-v2__description");
  const fallback = post.querySelector(".update-components-text");

  let text = "";

  if (description) text = description.innerText;
  else if (fallback) text = fallback.innerText;
  else text = post.innerText;

  return text
    .replace(/\s+/g, " ")
    .replace(/Like.*?Reply/g, "")
    .substring(0, 600)
    .trim();
}

/* Detect reply author */
function detectReplyAuthor(editor){

  const commentItem = editor.closest(".comments-comment-item");
  if(!commentItem) return null;

  const author = commentItem.querySelector(".comments-comment-item__author-text");
  if(!author) return null;

  return author.innerText.trim();
}

/* Extract comment text being replied to */
function extractReplyComment(editor){

  const commentItem = editor.closest(".comments-comment-item");
  if(!commentItem) return null;

  const commentText = commentItem.querySelector(".comments-comment-item__main-content");
  if(!commentText) return null;

  return commentText.innerText.trim().substring(0,300);
}

/* Insert comment safely */
function insertComment(editor,text){

  editor.focus();

  if(text.length>900){
    text=text.substring(0,900);
  }

  /* Clear LinkedIn auto inserted reply name */
  editor.innerHTML = "";

  document.execCommand("insertText", false, text);

  editor.dispatchEvent(new Event("input",{bubbles:true}));

}

/* Main Extension UI */
function addButtons() {

  const posts = document.querySelectorAll(".feed-shared-update-v2");

  posts.forEach(post => {

    if (post.querySelector(".local-ai-container")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "local-ai-container";
    wrapper.style.position = "relative";
    wrapper.style.marginTop = "10px";

    const toggleBtn = document.createElement("div");
    toggleBtn.textContent = "✨";

    toggleBtn.style.cssText = `
      width:28px;
      height:28px;
      border-radius:50%;
      background:#ffffff;
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      font-size:16px;
      box-shadow:0 4px 12px rgba(0,0,0,0.15);
      transition:transform 0.2s ease;
    `;

    toggleBtn.onmouseover = () => toggleBtn.style.transform = "scale(1.08)";
    toggleBtn.onmouseout = () => toggleBtn.style.transform = "scale(1)";

    wrapper.appendChild(toggleBtn);

    const container = document.createElement("div");

    container.style.cssText = `
      margin-top:10px;
      padding:14px;
      border-radius:14px;
      background:#ffffff;
      box-shadow:0 6px 18px rgba(0,0,0,0.08);
      border:1px solid #e6e6e6;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      display:none;
      flex-direction:column;
      gap:12px;
    `;

    const modesWrapper = document.createElement("div");

    modesWrapper.style.cssText = `
      display:flex;
      flex-wrap:wrap;
      gap:8px;
    `;

    const modes = [
      { value:"professional", label:"💼 Professional" },
      { value:"friendly", label:"😊 Friendly" },
      { value:"question", label:"❓ Question" },
      { value:"funny", label:"😂 Funny" },
      { value:"one-liner", label:"⚡ One-liner" }
    ];

    let selectedTone = "professional";

    modes.forEach(mode => {

      const chip = document.createElement("button");
      chip.textContent = mode.label;

      chip.style.cssText = `
        padding:6px 12px;
        border-radius:20px;
        border:1px solid #d0d0d0;
        background:#f5f5f5;
        cursor:pointer;
        font-size:12px;
      `;

      if(mode.value === selectedTone){
        chip.style.background="#0073b1";
        chip.style.color="#fff";
      }

      chip.onclick = () => {

        selectedTone = mode.value;

        modesWrapper.querySelectorAll("button").forEach(btn=>{
          btn.style.background="#f5f5f5";
          btn.style.color="#000";
        });

        chip.style.background="#0073b1";
        chip.style.color="#fff";
      };

      modesWrapper.appendChild(chip);

    });

    container.appendChild(modesWrapper);

    const generateBtn = document.createElement("button");

    generateBtn.textContent = "Generate Comment";

    generateBtn.style.cssText = `
      padding:10px;
      border-radius:10px;
      border:none;
      background:linear-gradient(90deg,#0073b1,#005582);
      color:#ffffff;
      font-weight:600;
      cursor:pointer;
      font-size:13px;
    `;

    container.appendChild(generateBtn);

    wrapper.appendChild(container);
    post.appendChild(wrapper);

    toggleBtn.onclick = ()=>{
      container.style.display =
        container.style.display === "none" ? "flex" : "none";
    };

    generateBtn.onclick = async function(){

      const postText = extractPostText(post);

      const tone = selectedTone;

      let prompt = "";

      let replyAuthor = null;
      let replyComment = null;

      if(activeEditor){
        replyAuthor = detectReplyAuthor(activeEditor);
        replyComment = extractReplyComment(activeEditor);
      }

      let context = "";

      if(replyAuthor && replyComment){

        context = `
Replying to comment by ${replyAuthor}:
${replyComment}

Important:
Respond specifically to this comment while considering the original post.
`;

      }

      if(tone === "professional"){
prompt = `
You are an experienced LinkedIn thought leader.

${context}

Step 1: Identify the core insight of the post.
Step 2: Write a thoughtful professional comment reacting to it.

Rules:
- Do not repeat the post
- Add perspective
- 2–4 sentences
- Sound human and confident
- If replying to a comment, respond to the specific point or question raised in that comment.

Post:
${postText}

Return only the final comment.
`;
      }

      if(tone === "friendly"){
prompt = `
You are a friendly LinkedIn user.

${context}

Step 1: Understand the main message.
Step 2: Write a warm supportive comment.

Rules:
- Natural tone
- 2–3 sentences
- Add positive insight
- If replying to a comment, respond to the specific point or question raised in that comment.

Post:
${postText}

Return only the comment.
`;
      }

      if(tone === "question"){
prompt = `
You are a LinkedIn engagement strategist.

${context}

Step 1: Identify the main idea of the post.
Step 2: Write a response that ends with a thoughtful question.

Rules:
- Add perspective
- 2–3 sentences
- Question must feel natural
- If replying to a comment, respond to the specific point or question raised in that comment.

Post:
${postText}

Return only the comment.
`;
      }

      if(tone === "funny"){
prompt = `
You are a witty LinkedIn commenter.

${context}

Step 1: Understand the main idea.
Step 2: Write a clever humorous response.

Rules:
- Business appropriate humor
- 2–3 sentences
- Not childish
- If replying to a comment, respond to the specific point or question raised in that comment.

Post:
${postText}

Return only the comment.
`;
      }

      if(tone === "one-liner"){
prompt = `
${context}

Write one short insightful LinkedIn comment reacting to the post.

Rules:
- One or two sentences
- Thought-provoking
- Natural tone
- If replying to a comment, respond to the specific point or question raised in that comment.

Post:
${postText}

Return only the comment.
`;
      }

      chrome.runtime.sendMessage(
        {type:"generate",prompt:prompt},
        function(response){

          if(!response || !response.success){
            alert("Generation error.");
            return;
          }

          let generatedText = (response.text || "").trim();

          if(!generatedText){
            alert("Empty response.");
            return;
          }

          if(generatedText.length>900){
            generatedText=generatedText.substring(0,900);
          }

          if(activeEditor){
            insertComment(activeEditor,generatedText);
            return;
          }

          const commentButton =
          post.querySelector('button[aria-label*="Comment"]');

          if(!commentButton){
            alert("Comment button not found.");
            return;
          }

          commentButton.click();

          setTimeout(()=>{

            const editor =
            post.querySelector('[contenteditable="true"]');

            if(!editor){
              alert("Comment box not found.");
              return;
            }

            insertComment(editor,generatedText);

          },1200);

        }
      );

    };

  });

}

addButtons();

const observer = new MutationObserver(()=>{
  addButtons();
});

observer.observe(document.body,{
  childList:true,
  subtree:true
});



