import LLMS from "./llms";
import Parsers from "./parsers";
import { queryPrompt } from "./prompts";

export const queryChain = queryPrompt
  .pipe(LLMS.moonshotai)
  .pipe(Parsers.string);
