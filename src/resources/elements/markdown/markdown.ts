import axios from "axios";
import { bindable } from "aurelia-framework";

const marked = require("marked");

export class Markdown{

  @bindable document: string;
  @bindable url: string;
  markdown: string;

  // constructor() {
  //   marked.setOptions({ breaks: true, gfm: true });
  // }

  async attached(): Promise<void> {
    if (this.url) {
      await axios.get(this.url)
        .then((response) => {
          if (response.data && response.data.length) {
            this.document = response.data;
          }
        });
    }
    this.markdown = marked(this.document);
  }
}
