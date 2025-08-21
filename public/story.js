
(() => {
  // ====== DOM refs (IDs unchanged) ======
  const domain = window.location.origin; // (currently unused but kept)
  const button = document.getElementById('submit');
  const add_button = document.getElementById('add_to_story');
  const story_main = document.getElementById('story_main');
  const loading = document.getElementById('loading');
  const story = document.getElementById('story');
  const keys = document.getElementById('keys');
  const insctuctor = document.getElementById('insctuctor'); // (spelling as in DOM)

  // ====== API key handling (unchanged variables, safer usage) ======
  const limit = 'eASoscxcGRT3BlbkFJlMmGSX';
  const speed = '_vVRfajMx0xJq_IOQeyDwHak_chXHLLOiN_C1oTqzL1ItnR8hl22akN9qf_jQjKzY3kA';
  const OPENAI_KEY = 'sk-proj-ZlGZenDKLPrbjaWMxHxQV0sF3lYHvImFlYAfOAhipcjrE_5RBcVuxxmcVfaUZmx_';

  const getApiKey = () => `${OPENAI_KEY}${limit}${speed}`;

  // ====== Helpers ======
  const buildPrompt = (userDraft, userInstructions, keywordStr) => {
    return `You are a story co-author. Continue directly after the user’s draft. Use 2–3 sentences (max 60 words). Output ONLY the continuation — no repeats, quotes, or summaries.

IMPORTANT:
- Follow the user’s instructions exactly (may be in Turkish or another language).
- If the user requests a different language, switch language — but keep the same style, tone, pacing, and character voice as the original and maintain full continuity; this must feel like the same story in a different language.
- Do NOT end the story — just push the plot forward.

USER INSTRUCTIONS:
${userInstructions}

USER DRAFT:
${userDraft}

KEYWORDS (for reference):
${keywordStr}`;
  };

  // The Responses API may return different shapes; try common paths.
  const extractText = (json) => {
    // 1) Newer convenience field
    if (typeof json.output_text === 'string' && json.output_text.trim()) {
      return json.output_text.trim();
    }
    // 2) responses-style content array
    try {
      const maybe = json.output?.[0]?.content?.[0]?.text;
      if (typeof maybe === 'string' && maybe.trim()) return maybe.trim();
    } catch {}
    // 3) fallback: choices-style
    try {
      const maybe = json.choices?.[0]?.message?.content;
      if (typeof maybe === 'string' && maybe.trim()) return maybe.trim();
    } catch {}
    return '';
  };

  const appendToStory = (text) => {
    if (!text) return;
    const newSpan = document.createElement('span');
    newSpan.classList.add('new_txt');
    newSpan.textContent = text;
    story_main.appendChild(newSpan);
    story_main.appendChild(document.createElement('br'));
  };

  const showLoading = (on) => {
    if (on) loading.classList.add('showLoading');
    else loading.classList.remove('showLoading');
  };

  // ====== Events ======
  button.onclick = async (e) => {
    e.preventDefault();

    const draft = story_main.textContent.trim();
    const instr = insctuctor.value.trim();
    const keyStr = keys.value.trim();

    // Require at least one source of content/instructions
    if (!story.value.trim() && !keyStr && !draft && !instr) {
      alert('kelime ya da anahtar kelime yazmaniz lazim');
      return;
    }

    const prompt = buildPrompt(draft, instr || '', keyStr || '');

    showLoading(true);
    button.disabled = true;

    try {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-2024-07-18',
          input: prompt,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('OpenAI error:', res.status, errText);
        alert('Bir sorun oluştu. Lütfen tekrar deneyin.');
        return;
      }

      const json = await res.json();
      console.log('OpenAI response:', json);

      const continuation = extractText(json);
      if (!continuation) {
        alert('Boş bir yanıt döndü. Lütfen tekrar deneyin.');
        return;
      }

      appendToStory(continuation);
    } catch (err) {
      console.error(err);
      alert('Ağ hatası. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      showLoading(false);
      button.disabled = false;
    }
  };

  add_button.onclick = (e) => {
    e.preventDefault();
    const txt = story.value.trim();
    if (!txt) return;
    appendToStory(` ${txt}`);
    story.value = '';
  };
})();

