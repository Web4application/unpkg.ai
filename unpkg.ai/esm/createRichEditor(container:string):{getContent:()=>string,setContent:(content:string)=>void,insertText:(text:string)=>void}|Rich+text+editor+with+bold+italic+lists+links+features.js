export function createRichEditor(container) {
  const host = typeof container === 'string' ? document.querySelector(container) : container;
  if (!host) throw new Error('RichEditor: container not found');

  // Basic styles for editor
  const style = document.createElement('style');
  style.textContent = `
    .rei-editor { border:1px solid #ccc; border-radius:8px; overflow:hidden; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial; background:#fff; }
    .rei-toolbar { display:flex; gap:6px; padding:6px; background:#f5f5f5; border-bottom:1px solid #ddd; flex-wrap: wrap; }
    .rei-toolbar button { padding:6px 10px; border:1px solid #ccc; border-radius:4px; background:white; cursor:pointer; font-size:14px; }
    .rei-toolbar button:hover { background:#eee; }
    .rei-content { padding:12px; min-height:160px; outline:none; }
    .rei-content:empty:before { content: attr(data-placeholder); color:#888; }
  `;
  if (!document.head.querySelector('style[data-rich-editor]')) {
    style.setAttribute('data-rich-editor', 'true');
    document.head.appendChild(style);
  }

  // Editor structure
  const editor = document.createElement('div');
  editor.className = 'rei-editor';

  const toolbar = document.createElement('div');
  toolbar.className = 'rei-toolbar';

  const content = document.createElement('div');
  content.className = 'rei-content';
  content.contentEditable = 'true';
  content.setAttribute('role', 'textbox');
  content.setAttribute('aria-multiline', 'true');
  content.dataset.placeholder = 'Start typing here...';
  content.spellcheck = true;

  // Helper to create toolbar buttons
  const createButton = (label, command, title) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerText = label;
    if (title) btn.title = title;
    btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus
    btn.addEventListener('click', () => {
      // If link insertion requires user input, handle inside
      if (command === 'createLink') {
        const url = prompt('Enter URL', 'https://');
        if (url) document.execCommand('createLink', false, url);
        return;
      }
      document.execCommand(command, false, null);
    });
    return btn;
  };

  // Build toolbar
  const boldBtn = createButton('B', 'bold', 'Bold');
  const italicBtn = createButton('I', 'italic', 'Italic');
  const underlineBtn = createButton('U', 'underline', 'Underline');
  const ulBtn = createButton('â€¢', 'insertUnorderedList', 'Unordered List');
  const olBtn = createButton('1.', 'insertOrderedList', 'Ordered List');
  const linkBtn = createButton('Link', 'createLink', 'Insert Link');
  const unlinkBtn = createButton('Unlink', 'unlink', 'Remove Link');

  toolbar.appendChild(boldBtn);
  toolbar.appendChild(italicBtn);
  toolbar.appendChild(underlineBtn);
  toolbar.appendChild(ulBtn);
  toolbar.appendChild(olBtn);
  toolbar.appendChild(linkBtn);
  toolbar.appendChild(unlinkBtn);

  editor.appendChild(toolbar);
  editor.appendChild(content);

  // Attach to host
  host.innerHTML = ''; // clear any previous content
  host.appendChild(editor);

  // API
  const getContent = () => content.innerHTML;
  const setContent = (html) => {
    content.innerHTML = html ?? '';
  };

  const insertText = (text) => {
    if (typeof text !== 'string') return;
    // Try modern insertion
    if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
      try {
        document.execCommand('insertText', false, text);
        return;
      } catch (e) {
        // fall through to fallback
      }
    }
    // Fallback: insert at caret
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      content.focus();
      content.appendChild(document.createTextNode(text));
    }
  };

  return { getContent, setContent, insertText };
}
