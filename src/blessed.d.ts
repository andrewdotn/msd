import { Widgets } from "blessed";

declare module "blessed" {
  namespace Widgets {
    interface ListElement {
      selected: number;
      items: unknown[];
      setItems(items: string[]): void;
    }

    interface ListElementStyle {
      focus?: {
        bg: string;
      };
    }
  }
}
