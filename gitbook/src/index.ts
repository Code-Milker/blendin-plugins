
// src/index.ts
interface PluginContext {
  log: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
}
interface Block {
  body: string;
}

module.exports = {
  hooks: {
    init: function(this: PluginContext) {
      console.log("Blendin Translation Plugin for GitBook Initialized!");
    }
  },
  blocks: {
    translate: {
      process: function(blk: Block) {
        const translatedText = `Translated: ${blk.body}`;
        return translatedText;
      }
    }
  }
};
