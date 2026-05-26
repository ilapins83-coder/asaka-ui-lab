const views = Array.from(document.querySelectorAll('.view'));
const title = document.querySelector('#screenTitle');
const stepBadge = document.querySelector('#stepBadge');
const progressBar = document.querySelector('#progressBar');
const backButton = document.querySelector('#backButton');
const nextButton = document.querySelector('#nextButton');
const mediaInput = document.querySelector('#mediaInput');
const mediaList = document.querySelector('#mediaList');
const mediaError = document.querySelector('#mediaError');
const inputError = document.querySelector('#inputError');
const activeMedia = document.querySelector('#activeMedia');
const frameCount = document.querySelector('#frameCount');
const frameTitle = document.querySelector('#frameTitle');
const frameText = document.querySelector('#frameText');
const frameTextCount = document.querySelector('#frameTextCount');
const frameTimeline = document.querySelector('#frameTimeline');
const preview = document.querySelector('#preview');
const frameStrip = document.querySelector('#frameStrip');
const captionStack = document.querySelector('#captionStack');
const noticeStack = document.querySelector('#noticeStack');
const renderButton = document.querySelector('#renderButton');
const renderNote = document.querySelector('#renderNote');

const summaryMode = document.querySelector('#summaryMode');
const summaryMedia = document.querySelector('#summaryMedia');
const summaryFrames = document.querySelector('#summaryFrames');
const summaryCta = document.querySelector('#summaryCta');

const state = {
  step: 0,
  mode: 'story',
  activeIndex: 0,
  media: [],
  renderDone: false,
};

const titles = ['Add media', 'Frame text', 'Preview', 'Create'];

for (const button of document.querySelectorAll('[data-mode]')) {
  button.addEventListener('click', () => {
    state.mode = button.dataset.mode;
    state.renderDone = false;
    document.querySelectorAll('[data-mode]').forEach((item) => {
      item.classList.toggle('is-selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    render();
  });
}

backButton.addEventListener('click', () => {
  state.step = Math.max(0, state.step - 1);
  render();
});

nextButton.addEventListener('click', () => {
  const error = validationErrorForStep(state.step);
  if (error) {
    showStepError(error);
    return;
  }
  state.step = Math.min(views.length - 1, state.step + 1);
  render();
});

mediaInput.addEventListener('change', () => {
  const incoming = Array.from(mediaInput.files || []).map((file) => ({
    file,
    url: URL.createObjectURL(file),
    type: file.type.startsWith('video/') ? 'video' : 'image',
    title: '',
    paragraph: '',
  }));
  state.media = state.media.concat(incoming);
  if (state.media.length === incoming.length) state.activeIndex = 0;
  mediaInput.value = '';
  state.renderDone = false;
  mediaError.textContent = '';
  render();
});

mediaList.addEventListener('dragstart', onDragStart);
mediaList.addEventListener('dragend', onDragEnd);
mediaList.addEventListener('dragover', onDragOver);
mediaList.addEventListener('drop', onDrop);
mediaList.addEventListener('click', (event) => {
  const item = event.target.closest('[data-media-index]');
  if (!item) return;
  setActiveIndex(Number(item.dataset.mediaIndex));
});
mediaList.addEventListener('pointerdown', onPointerDown);
mediaList.addEventListener('pointerup', onPointerUp);
mediaList.addEventListener('pointercancel', onPointerCancel);

frameTimeline.addEventListener('click', (event) => {
  const item = event.target.closest('[data-frame-index]');
  if (!item) return;
  setActiveIndex(Number(item.dataset.frameIndex));
});

frameTimeline.addEventListener('dragstart', onDragStart);
frameTimeline.addEventListener('dragend', onDragEnd);
frameTimeline.addEventListener('dragover', onDragOver);
frameTimeline.addEventListener('drop', onDrop);
frameTimeline.addEventListener('pointerdown', onPointerDown);
frameTimeline.addEventListener('pointerup', onPointerUp);
frameTimeline.addEventListener('pointercancel', onPointerCancel);

frameTitle.addEventListener('input', () => {
  const item = activeItem();
  if (!item) return;
  item.title = frameTitle.value;
  state.renderDone = false;
  renderFrameDependentViews();
});

frameText.addEventListener('input', () => {
  const item = activeItem();
  if (!item) return;
  item.paragraph = frameText.value;
  state.renderDone = false;
  renderFrameDependentViews();
});

renderButton.addEventListener('click', () => {
  const error = validationErrorForRender();
  if (error) {
    renderNote.textContent = error;
    renderNote.classList.add('is-error');
    return;
  }
  state.renderDone = true;
  render();
});

render();

function render() {
  views.forEach((view, index) => view.classList.toggle('is-active', index === state.step));
  title.textContent = titles[state.step];
  stepBadge.textContent = `${state.step + 1}/${views.length}`;
  progressBar.style.width = `${((state.step + 1) / views.length) * 100}%`;
  backButton.disabled = state.step === 0;
  nextButton.disabled = state.step === views.length - 1;
  nextButton.innerHTML = state.step === views.length - 2
    ? '<span>Confirm</span><span class="icon icon-check" aria-hidden="true"></span>'
    : '<span>Next</span><span class="icon icon-next" aria-hidden="true"></span>';

  if (state.step !== 0) mediaError.textContent = '';
  if (state.step !== 1) inputError.textContent = '';

  renderMediaList();
  renderEditor();
  renderFrameDependentViews();
  renderSummary();
  renderRenderState();
}

function renderFrameDependentViews() {
  renderPreview();
  renderTimeline();
  renderCaptions();
  renderNotices();
  renderSummary();
  renderRenderState();
}

function renderMediaList() {
  mediaList.innerHTML = '';
  document.querySelector('.dropzone')?.classList.toggle('has-media', state.media.length > 0);
  state.media.forEach((item, index) => {
    const thumb = mediaThumb(item, index, 'thumb');
    if (item.title || item.paragraph) thumb.classList.add('has-text');
    thumb.classList.toggle('is-active', index === state.activeIndex);
    mediaList.append(thumb);
  });
}

function renderEditor() {
  const item = activeItem();
  activeMedia.innerHTML = '';
  if (!item) {
    const empty = document.createElement('div');
    empty.className = 'preview-empty';
    empty.textContent = 'Add media';
    activeMedia.append(empty);
    frameTitle.value = '';
    frameText.value = '';
    frameTitle.disabled = true;
    frameText.disabled = true;
    frameCount.textContent = '0/0';
    frameTextCount.textContent = '0/180';
    return;
  }

  const media = document.createElement(item.type === 'video' ? 'video' : 'img');
  media.src = item.url;
  media.muted = true;
  media.loop = true;
  media.autoplay = true;
  media.playsInline = true;
  activeMedia.append(media);

  frameTitle.disabled = false;
  frameText.disabled = false;
  if (frameTitle.value !== item.title) frameTitle.value = item.title;
  if (frameText.value !== item.paragraph) frameText.value = item.paragraph;
  frameCount.textContent = `${state.activeIndex + 1}/${state.media.length}`;
  frameTextCount.textContent = `${item.paragraph.length}/180`;
}

function renderTimeline() {
  frameTimeline.innerHTML = '';
  state.media.forEach((item, index) => {
    const thumb = mediaThumb(item, index, 'timeline-thumb');
    thumb.dataset.frameIndex = String(index);
    thumb.classList.toggle('is-active', index === state.activeIndex);
    if (item.title || item.paragraph) thumb.classList.add('has-text');
    frameTimeline.append(thumb);
  });
}

function renderPreview() {
  preview.innerHTML = '';
  const item = activeItem() || state.media[0];
  if (!item) {
    const empty = document.createElement('div');
    empty.className = 'preview-empty';
    empty.textContent = 'Preview';
    preview.append(empty);
    return;
  }

  const media = document.createElement(item.type === 'video' ? 'video' : 'img');
  media.src = item.url;
  media.muted = true;
  media.loop = true;
  media.autoplay = true;
  media.playsInline = true;
  preview.append(media);

  const overlay = frameOverlay(item);
  if (overlay) preview.append(overlay);

  frameStrip.innerHTML = '';
  state.media.slice(0, 8).forEach((frame, index) => {
    const thumb = mediaThumb(frame, index, 'frame-thumb');
    thumb.classList.toggle('is-active', index === state.activeIndex);
    frameStrip.append(thumb);
  });
}

function renderCaptions() {
  captionStack.innerHTML = '';
  const item = activeItem();
  if (!item) return;
  for (const [label, line] of frameTextLines(item)) {
    const row = document.createElement('div');
    row.className = 'caption-line';
    const kind = document.createElement('span');
    kind.textContent = label;
    row.append(kind, document.createTextNode(line));
    captionStack.append(row);
  }
}

function renderNotices() {
  noticeStack.innerHTML = '';
  for (const notice of notices()) {
    const item = document.createElement('div');
    item.className = `notice ${notice.type}`;
    item.textContent = notice.text;
    noticeStack.append(item);
  }
}

function renderSummary() {
  summaryMode.textContent = labelForMode(state.mode);
  summaryMedia.textContent = `${state.media.length} ${state.media.length === 1 ? 'file' : 'files'}`;
  summaryFrames.textContent = `${framesWithText()} text`;
  summaryCta.textContent = ctaForMode(state.mode);
}

function renderRenderState() {
  renderButton.classList.toggle('is-done', state.renderDone);
  renderButton.innerHTML = state.renderDone
    ? '<span class="icon icon-check" aria-hidden="true"></span><span>Ready</span>'
    : '<span class="icon icon-check" aria-hidden="true"></span><span>Create</span>';
  renderNote.classList.toggle('is-error', false);
  renderNote.textContent = state.renderDone ? 'Ready to download.' : 'Vertical video export.';
}

function mediaThumb(item, index, className) {
  const thumb = document.createElement('div');
  thumb.className = className;
  thumb.draggable = true;
  thumb.dataset.mediaIndex = String(index);

  const media = document.createElement(item.type === 'video' ? 'video' : 'img');
  media.src = item.url;
  media.muted = true;
  media.playsInline = true;
  thumb.append(media);

  const label = document.createElement('span');
  label.textContent = String(index + 1);
  thumb.append(label);
  return thumb;
}

function frameOverlay(item) {
  if (!item.title && !item.paragraph) return null;
  const overlay = document.createElement('div');
  overlay.className = 'preview-caption';
  if (item.title) {
    const heading = document.createElement('strong');
    heading.textContent = item.title;
    overlay.append(heading);
  }
  if (item.paragraph) {
    const paragraph = document.createElement('p');
    paragraph.textContent = item.paragraph;
    overlay.append(paragraph);
  }
  return overlay;
}

function frameTextLines(item) {
  const rows = [];
  if (item.title) rows.push(['TITLE', item.title]);
  if (item.paragraph) rows.push(['TEXT', item.paragraph]);
  if (rows.length === 0) rows.push(['EMPTY', 'No text on this frame']);
  return rows;
}

function activeItem() {
  return state.media[state.activeIndex] || null;
}

function setActiveIndex(index) {
  if (index < 0 || index >= state.media.length) return;
  state.activeIndex = index;
  render();
}

function moveMedia(from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;
  if (from < 0 || to < 0 || from >= state.media.length || to >= state.media.length) return;
  const [item] = state.media.splice(from, 1);
  state.media.splice(to, 0, item);
  state.activeIndex = to;
  state.renderDone = false;
  render();
}

function onDragStart(event) {
  const thumb = event.target.closest('[data-media-index]');
  if (!thumb) return;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', thumb.dataset.mediaIndex);
  thumb.classList.add('is-dragging');
}

function onDragEnd(event) {
  event.target.closest('[data-media-index]')?.classList.remove('is-dragging');
}

function onDragOver(event) {
  if (!event.target.closest('[data-media-index]')) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function onDrop(event) {
  const target = event.target.closest('[data-media-index]');
  if (!target) return;
  event.preventDefault();
  moveMedia(Number(event.dataTransfer.getData('text/plain')), Number(target.dataset.mediaIndex));
}

function onPointerDown(event) {
  const thumb = event.target.closest('[data-media-index]');
  if (!thumb) return;
  thumb.setPointerCapture(event.pointerId);
  thumb.dataset.dragStartX = String(event.clientX);
  thumb.dataset.dragStartY = String(event.clientY);
  thumb.dataset.dragIndex = thumb.dataset.mediaIndex;
  thumb.classList.add('is-touching');
}

function onPointerUp(event) {
  const thumb = event.target.closest('[data-media-index]');
  if (!thumb?.dataset.dragStartX) return;
  const from = Number(thumb.dataset.dragIndex);
  const startX = Number(thumb.dataset.dragStartX);
  const startY = Number(thumb.dataset.dragStartY);
  const isTap = Math.abs(event.clientX - startX) < 8 && Math.abs(event.clientY - startY) < 8;
  const to = isTap ? from : indexFromPoint(event.clientX, event.clientY);
  clearTouchDrag(thumb);
  if (isTap) {
    setActiveIndex(from);
    return;
  }
  if (to >= 0) moveMedia(from, to);
}

function onPointerCancel(event) {
  const thumb = event.target.closest('[data-media-index]');
  if (thumb) clearTouchDrag(thumb);
}

function indexFromPoint(x, y) {
  const element = document.elementFromPoint(x, y)?.closest('[data-media-index]');
  return element ? Number(element.dataset.mediaIndex) : -1;
}

function clearTouchDrag(thumb) {
  delete thumb.dataset.dragStartX;
  delete thumb.dataset.dragStartY;
  delete thumb.dataset.dragIndex;
  thumb.classList.remove('is-touching');
}

function validationErrorForStep(step) {
  if (step === 0 && state.media.length === 0) return 'Add at least one photo or clip.';
  return '';
}

function validationErrorForRender() {
  return validationErrorForStep(0);
}

function showStepError(error) {
  if (state.step === 0) mediaError.textContent = error;
  if (state.step === 1) inputError.textContent = error;
}

function notices() {
  const text = state.media.map((item) => `${item.title} ${item.paragraph}`).join(' ');
  const result = [];
  if (state.mode === 'sell') {
    if (!hasPrice(text)) result.push({ type: 'warn', text: 'Missing price.' });
    if (!hasPlace(text)) result.push({ type: 'warn', text: 'Missing place.' });
  }
  if (state.mode === 'invite') {
    if (!hasDate(text)) result.push({ type: 'warn', text: 'Missing date.' });
    if (!hasPlace(text)) result.push({ type: 'warn', text: 'Missing place.' });
  }
  if (hasContact(text)) {
    result.push({ type: 'safe', text: 'Contact found. Safer CTA applied.' });
  } else if (state.mode !== 'story') {
    result.push({ type: 'safe', text: `CTA: ${ctaForMode(state.mode)}.` });
  }
  if (result.length === 0) result.push({ type: 'safe', text: 'Looks ready.' });
  return result;
}

function framesWithText() {
  return state.media.filter((item) => item.title || item.paragraph).length;
}

function hasPrice(text) {
  return /(\d+[,.]?\d*\s?(€|eur|eiro|\$|usd)|price)/i.test(text);
}

function hasDate(text) {
  return /(\d{1,2}[./-]\d{1,2}|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text);
}

function hasPlace(text) {
  return /(riga|london|berlin|paris|street|center|centre|venue|place|address|online|remote)/i.test(text);
}

function hasContact(text) {
  return /(\+?\d[\d\s-]{6,}|@|https?:\/\/|www\.)/i.test(text);
}

function ctaForMode(mode) {
  if (mode === 'invite') return 'Sign up';
  if (mode === 'sell') return 'Message profile';
  return 'None';
}

function labelForMode(mode) {
  return { story: 'Story', sell: 'Sell', invite: 'Invite' }[mode] || 'Story';
}
