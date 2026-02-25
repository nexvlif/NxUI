import { defineWidget } from "../../src/sdk/define";
import type { WidgetContext } from "../../src/sdk/types";

export default defineWidget({
  name: "Notes",
  version: "1.0.0",
  author: "Nex",
  description: "Markdown note viewer and editor",

  width: 320,
  height: 400,
  desktopLevel: "top",
  resizable: true,

  onMount(ctx: WidgetContext) {
    const elContainer = ctx.getElementById("notes-container");
    const elContent = ctx.getElementById("notes-content");
    const elEditor = ctx.getElementById("notes-editor");
    const elTextarea = ctx.getElementById("notes-textarea") as HTMLTextAreaElement;

    const btnSelect = ctx.getElementById("btn-notes-select");
    const btnEdit = ctx.getElementById("btn-notes-edit");
    const btnSave = ctx.getElementById("btn-notes-save");
    const btnCancel = ctx.getElementById("btn-notes-cancel");

    let currentFilePath: string | null = null;
    let isEditing = false;

    const renderMarkdown = (md: string) => {
      let html = md
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/\*(.*)\*/gim, '<i>$1</i>')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
        .replace(/^\s*\-\s+(.*)/gim, '<ul><li>$1</li></ul>')
        .replace(/<\/ul>\n<ul>/gim, '')
        .replace(/\n\n/gim, '<br><br>');
      return html;
    };

    const updateView = () => {
      if (!currentFilePath) {
        elContent.innerHTML = "<div style='opacity:0.5; text-align:center; padding-top:40px;'>No file selected.<br>Click the folder icon.</div>";
        return;
      }

      if (isEditing) {
        elContainer.classList.add("editing");
        elTextarea.focus();
      } else {
        elContainer.classList.remove("editing");
      }
    };

    const loadFile = async (path: string) => {
      try {
        const text = await ctx.readFile(path);
        currentFilePath = path;
        elTextarea.value = text;
        elContent.innerHTML = renderMarkdown(text);

        btnEdit.style.display = "flex";
        updateView();
      } catch (err: any) {
        elContent.innerHTML = `<div style='color:var(--nxui-danger)'>Error loading file:<br>${err.message}</div>`;
      }
    };

    btnSelect.addEventListener("click", async () => {
      const paths = await ctx.showOpenDialog({
        title: "Select Markdown File",
        filters: [{ name: "Markdown files", extensions: ["md", "txt"] }],
        properties: ["openFile"]
      });

      if (paths && paths.length > 0) {
        loadFile(paths[0]);
      }
    });

    btnEdit.addEventListener("click", () => {
      if (!currentFilePath) return;
      isEditing = true;
      updateView();
    });

    btnCancel.addEventListener("click", () => {
      isEditing = false;
      if (currentFilePath) loadFile(currentFilePath);
      else updateView();
    });

    btnSave.addEventListener("click", async () => {
      if (!currentFilePath) return;

      const newText = elTextarea.value;
      try {
        await ctx.writeFile(currentFilePath, newText);
        isEditing = false;
        loadFile(currentFilePath);
      } catch (err: any) {
        alert("Failed to save: " + err.message);
      }
    });

    btnEdit.style.display = "none";
    updateView();
  },
});
