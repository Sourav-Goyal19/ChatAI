import LLMS from "./llms";
import Parsers from "./parsers";
import { queryPrompt } from "./prompt";

export const queryChain = queryPrompt
  .pipe(LLMS.moonshotai)
  .pipe(Parsers.string);
