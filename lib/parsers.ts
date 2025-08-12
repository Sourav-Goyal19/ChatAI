import {
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";

const Parsers = {
  string: new StringOutputParser(),
  json: new JsonOutputParser(),
};

export default Parsers;
