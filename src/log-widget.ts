import blessed, { Widgets } from "blessed";

/**
 * Log widget. Has scrolling textbox which can be appended to. Press G to jump
 * to the end of the box.
 */
export class LogWidget {
  constructor(screen: Widgets.Screen) {
    this.screen = screen;

    this.log = blessed.box({
      left: "center",
      border: "line",
      width: "80%",
      hidden: true,
    });
    this.log.enableDrag();

    const logTitle = blessed.box({
      top: -1,
      height: 1,
      left: 1,
      width: 3,
      content: "Log",
      style: {
        inverse: true,
      },
    });
    this.log.append(logTitle);

    this.logContents = blessed.box({
      content: "This is the start of the log.\n",
      left: 1,
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      mouse: true,
      scrollbar: {
        style: {
          inverse: true,
        },
      },
    });
    this.log.append(this.logContents);
    this.logContents.on("keypress", (ch, key) => {
      if (ch === "j") {
        this.logContents.scroll(1);
      } else if (ch === "k") {
        this.logContents.scroll(-1);
      } else if (ch === "g") {
        this.logContents.setScrollPerc(0);
      } else if (ch === "G") {
        this.logContents.setScrollPerc(100);
      } else if (
        ch === " " ||
        (key && (key.name === "pagedown" || key.full === "C-d"))
      ) {
        this.logContents.scroll(<number>this.logContents.height);
      } else if (key && (key.name === "pageup" || key.full === "C-u")) {
        // ^ shift-space would be nice here, but is hard
        // https://unix.stackexchange.com/q/88579/27685
        this.logContents.scroll(-this.logContents.height);
      }
      screen.render();
    });
  }

  append() {
    this.screen.append(this.log);
  }

  focusPush() {
    this.screen.focusPush(this.logContents);
  }

  toggle() {
    this.log.toggle();
  }

  get visible() {
    return this.log.visible;
  }

  info(msg: string) {
    if (!msg.endsWith("\n")) {
      msg += "\n";
    }
    this.logContents.content += msg;
    this.screen.render();
  }

  private screen: Widgets.Screen;
  private log: Widgets.BoxElement;
  private logContents: Widgets.BoxElement;
}
