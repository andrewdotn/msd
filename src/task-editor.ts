import blessed, { Widgets } from "blessed";
import { execIfMain } from "execifmain";

const focusedTextboxBgcolor = 153;
// types are wrong saying this must be a string
const textboxBgcolor = (253 as any) as string;

export class TaskEditor {
  constructor(screen: Widgets.Screen) {
    this.screen = screen;

    this.form = blessed.form({
      keys: true,
      hidden: true,
      top: "center",
      border: "line",
      height: 6,
    });

    this._dialogTitle = blessed.box({
      top: 0,
    });
    this.form.append(this._dialogTitle);

    this.form.on("submit", () => {
      this.onSubmitListeners.forEach((f) => f());
    });
    this.form.on("cancel", () => {
      this.hide();
      this.onCancelListeners.forEach((f) => f());
    });

    this.form.on("element keypress", (el, ch, key) => {
      if (key?.full === "enter") {
        this.form.submit();
      } else if (key?.full === "escape") {
        this.form.cancel();
      }
    });

    this.titleEditor = blessed.textbox({
      height: 1,
      top: 1,
      content: "",
      keys: true,
      inputOnFocus: true,
      style: { bg: textboxBgcolor, focus: { bg: focusedTextboxBgcolor } },
    });
    this.form.append(this.titleEditor);

    const reminderLine = blessed.box({
      top: 2,
      style: { fg: 249 },
    });
    reminderLine.setContent("(press Ctrl-E to edit in $EDITOR)");
    this.form.append(reminderLine);

    this.form.append(
      blessed.box({
        top: 3,
        content: "Estimate:",
      })
    );

    this.estimateEditor = blessed.textbox({
      height: 1,
      top: 3,
      left: 10,
      content: "test",
      keys: true,
      inputOnFocus: true,
      style: { bg: textboxBgcolor, focus: { bg: focusedTextboxBgcolor } },
    });

    this.form.append(this.estimateEditor);

    screen.append(this.form);
  }

  show() {
    this.form.show();
  }

  hide() {
    this.form.hide();
    this.screen.render();
  }

  get taskTitle() {
    return this.titleEditor.value;
  }
  set taskTitle(value: string) {
    this.titleEditor.setValue(value);
  }

  get estimate() {
    return this.estimateEditor.value;
  }
  set estimate(value: string) {
    this.estimateEditor.setValue(value);
  }

  set dialogTitle(description: string) {
    this._dialogTitle.setContent(description);
  }

  onSubmit(f: () => unknown) {
    this.onSubmitListeners.push(f);
  }

  onCancel(f: () => unknown) {
    this.onCancelListeners.push(f);
  }

  focus() {
    this.titleEditor.focus();
  }
  focusEstimate() {
    this.estimateEditor.focus();
  }

  private onSubmitListeners: (() => unknown)[] = [];
  private onCancelListeners: (() => unknown)[] = [];
  private titleEditor: Widgets.TextboxElement;
  private estimateEditor: Widgets.TextboxElement;
  private _dialogTitle: Widgets.BoxElement;
  private form: Widgets.FormElement<unknown>;

  private screen: Widgets.Screen;
}

async function main() {
  const screen = blessed.screen({ smartCSR: true });
  const screenDestroy = new Promise((resolve) =>
    screen.on("destroy", () => resolve)
  );

  screen.append(
    blessed.box({
      bg: textboxBgcolor,
      shrink: true,
      content: "test driver",
    })
  );

  screen.key("q", () => screen.destroy());

  const editor = new TaskEditor(screen);
  editor.dialogTitle = "Sample dialog";
  editor.show();
  editor.focus();

  screen.render();

  await screenDestroy;
}

execIfMain(main, module);
