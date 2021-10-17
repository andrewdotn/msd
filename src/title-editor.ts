import blessed, { Widgets } from "blessed";
import { logInfo } from "./log";

export class TitleEditor {
  constructor(
    screen: Widgets.Screen,
    { remindAboutEditor } = { remindAboutEditor: false }
  ) {
    this.screen = screen;

    this.panel = blessed.box({
      hidden: true,
      border: "line",
      top: "center",
      height: 4 + (remindAboutEditor ? 1 : 0),
    });

    this.title = blessed.box({
      top: 0,
    });
    this.panel.append(this.title);

    this.editor = blessed.textbox({
      height: 1,
      top: 1,
      content: "",
      keys: true,
      inputOnFocus: true,
      style: { focus: { bg: 153 } },
    });

    this.panel.append(this.editor);

    if (remindAboutEditor) {
      const reminderLine = blessed.box({
        top: 2,
        style: { fg: 249 },
      });
      reminderLine.setContent("(press Ctrl-E to edit in $EDITOR)");
      this.panel.append(reminderLine);
    }

    this.editor.on("cancel", () => {
      logInfo("editor cancel");
      this.panel.hide();
      this.onCancelListeners.forEach((f) => f());
      this.screen.render();
    });

    this.editor.on("submit", () => {
      this.onSubmitListeners.forEach((f) => f());
    });

    screen.append(this.panel);
  }

  show() {
    this.editor.removeAllListeners("keypress");
    this.panel.show();
  }

  hide() {
    this.panel.hide();
  }

  get content() {
    return this.editor.value;
  }
  setValue(value: string) {
    this.editor.setValue(value);
  }

  set description(description: string) {
    this.title.setContent(description);
  }

  onSubmit(f: () => unknown) {
    this.onSubmitListeners.push(f);
  }

  onCancel(f: () => unknown) {
    this.onCancelListeners.push(f);
  }

  focusPush() {
    this.screen.focusPush(this.editor);
  }
  private onSubmitListeners: (() => unknown)[] = [];
  private onCancelListeners: (() => unknown)[] = [];
  private editor: Widgets.TextboxElement;
  private title: Widgets.BoxElement;
  private panel: Widgets.BoxElement;

  private screen: Widgets.Screen;
}
