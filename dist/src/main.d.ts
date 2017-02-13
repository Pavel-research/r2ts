import rp = require("raml-1-parser");
export interface ProcessingResult {
    ramlSource: string;
    types: {
        [name: string]: any;
    };
}
export declare function process(x: rp.api10.LibraryBase): ProcessingResult;
export declare function parseToJSON(url: string, f: (v: ProcessingResult) => void): void;
