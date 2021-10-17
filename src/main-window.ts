import blessed, { Widgets } from "blessed";

export class MainWindow {
  constructor(screen: Widgets.Screen) {
    const footer = blessed.box({
      content: "(n)ew task / toggle (d)one / (c)ancel / (e)dit / (q)uit",
      bottom: 0,
      height: 1,
      style: {
        inverse: true,
      },
    });
    screen.append(footer);
  }
}
